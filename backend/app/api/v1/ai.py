from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict

from app.services.ai import groq_service
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/health", response_model=Dict[str, Any])
async def check_health(
    current_user: dict = Depends(get_current_user)
):
    """
    Check the health status of the AI Model Router.
    Returns the state of all circuit breakers and model availability.
    """
    # Only allow admins to view detailed AI health
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Not authorized to view system health")
        
    return groq_service.get_health()
