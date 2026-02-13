# =============================================================================
# BuildBidz Python Backend - Authentication
# =============================================================================

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
import structlog

from app.config import settings
from app.core.exceptions import UnauthorizedError

logger = structlog.get_logger()


@dataclass
class CurrentUser:
    """Current authenticated user."""
    
    id: UUID
    email: str
    role: Optional[str] = None
    org_id: Optional[UUID] = None
    is_service_account: bool = False


def decode_jwt(token: str) -> dict:
    """Verify and decode a Firebase ID token."""
    from app.firebase import verify_firebase_token
    payload = verify_firebase_token(token)
    if not payload:
        raise UnauthorizedError("Invalid or expired Firebase token")
    return payload


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_org_id: Optional[str] = Header(None, alias="X-Org-ID"),
) -> CurrentUser:
    """
    Get current authenticated user from JWT token.
    
    Expects Authorization header in format: Bearer <token>
    Optional X-Org-ID header to specify which organization context.
    """
    if not authorization:
        raise UnauthorizedError("Missing authorization header")
    
    # Extract token from Bearer scheme
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedError("Invalid authorization header format")
    
    token = parts[1]
    payload = decode_jwt(token)
    
    # Extract user info from Supabase JWT
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token: missing user ID")
    
    email = payload.get("email", "")
    role = payload.get("role", "authenticated")
    
    # Parse org_id if provided
    org_id = None
    if x_org_id:
        try:
            org_id = UUID(x_org_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Org-ID header"
            )
    
    return CurrentUser(
        id=UUID(user_id),
        email=email,
        role=role,
        org_id=org_id,
        is_service_account=role == "service_role"
    )


async def get_optional_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Optional[CurrentUser]:
    """
    Get current user if authenticated, None otherwise.
    
    Useful for endpoints that work with or without authentication.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except UnauthorizedError:
        return None


def require_org_context(user: CurrentUser) -> UUID:
    """
    Require X-Org-ID header to be present.
    
    Use this for endpoints that need organization context.
    """
    if not user.org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Org-ID header is required for this endpoint"
        )
    return user.org_id


# Dependency for requiring specific roles
class RequireRole:
    """Dependency to require a specific role."""
    
    def __init__(self, *allowed_roles: str):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(self.allowed_roles)}"
            )
        return user


# Common role dependencies
require_authenticated = Depends(get_current_user)
require_service_role = Depends(RequireRole("service_role"))
