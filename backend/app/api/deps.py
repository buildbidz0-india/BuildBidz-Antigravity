# =============================================================================
# BuildBidz Python Backend - Authentication Dependencies
# =============================================================================

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
import structlog

from app.config import settings
from app.db.session import get_db_pool

logger = structlog.get_logger()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


# =============================================================================
# User Models
# =============================================================================

class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str  # User ID
    email: Optional[str] = None
    role: Optional[str] = None
    org_id: Optional[str] = None
    exp: Optional[datetime] = None


class CurrentUser(BaseModel):
    """Current authenticated user."""
    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str = "member"
    org_id: Optional[UUID] = None
    permissions: dict = {}


# =============================================================================
# Token Verification
# =============================================================================

def verify_token(token: str) -> TokenPayload:
    """Verify Firebase ID token and extract payload."""
    from app.firebase import verify_firebase_token
    
    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return TokenPayload(
        sub=decoded_token.get("sub"),
        email=decoded_token.get("email"),
        # Firebase doesn't have roles/org_id by default unless using custom claims
        # For now, we'll try to get them from custom claims or set defaults
        role=decoded_token.get("role", "member"),
        org_id=decoded_token.get("org_id"),
        exp=decoded_token.get("exp"),
    )


# =============================================================================
# Dependencies
# =============================================================================

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
) -> CurrentUser:
    """
    Get the current authenticated user.
    
    Supports both OAuth2 token and Authorization header.
    """
    # Try to get token from header if not from OAuth2
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify token
    payload = verify_token(token)

    # Get user from database
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            """
            SELECT id, email, full_name, role
            FROM users
            WHERE id = $1
            """,
            payload.sub,
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return CurrentUser(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"] or "member",
        org_id=UUID(payload.org_id) if payload.org_id else None,
    )


async def get_current_user_optional(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[CurrentUser]:
    """
    Get current user if authenticated, None otherwise.
    
    For endpoints that work with or without auth.
    """
    if not token:
        return None

    try:
        return await get_current_user(request, token)
    except HTTPException:
        return None


async def get_firebase_payload_optional(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
) -> Optional[TokenPayload]:
    """
    Verify Firebase ID token when present; return payload or None.
    Does not require a users table. Invalid token when sent returns 401.
    """
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    if not token:
        return None
    return verify_token(token)  # raises 401 if token invalid


async def get_org_id(
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id"),
    current_user: CurrentUser = Depends(get_current_user),
) -> UUID:
    """
    Get the current organization ID.
    
    From X-Org-Id header or user's default org.
    """
    if x_org_id:
        org_id = UUID(x_org_id)
    elif current_user.org_id:
        org_id = current_user.org_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID required",
        )

    # Verify user is member of org
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        member = await conn.fetchval(
            """
            SELECT 1 FROM organization_members
            WHERE org_id = $1 AND user_id = $2 AND status = 'active'
            """,
            org_id,
            current_user.id,
        )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )

    return org_id


def require_role(allowed_roles: list[str]):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.post("/admin-only", dependencies=[Depends(require_role(["admin", "owner"]))])
    """
    async def role_checker(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


def require_project_access(min_role: str = "viewer"):
    """
    Dependency factory for project-level access control.
    """
    role_hierarchy = ["viewer", "member", "manager", "admin", "owner"]

    async def project_checker(
        project_id: UUID,
        current_user: CurrentUser = Depends(get_current_user),
    ):
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            member = await conn.fetchrow(
                """
                SELECT role FROM project_members
                WHERE project_id = $1 AND user_id = $2
                """,
                project_id,
                current_user.id,
            )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this project",
            )

        user_role_idx = role_hierarchy.index(member["role"]) if member["role"] in role_hierarchy else -1
        min_role_idx = role_hierarchy.index(min_role) if min_role in role_hierarchy else 0

        if user_role_idx < min_role_idx:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires at least {min_role} role",
            )

        return member["role"]

    return project_checker


# =============================================================================
# Rate Limiting
# =============================================================================

async def check_rate_limit(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    """
    Check rate limit for current user.
    
    Limits are stored in Redis.
    """
    # Implementation would use Redis to track request counts
    # For now, just pass through
    pass
