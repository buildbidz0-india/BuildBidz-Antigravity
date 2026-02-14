
from fastapi import APIRouter, HTTPException, Depends
from app.services.coordination_agent import coordination_agent, NotificationRequest, NotificationResult, Language, CommunicationStep
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/send", response_model=NotificationResult)
async def generate_notification(
    request: NotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a multilingual, WhatsApp-formatted notification for a contractor.
    
    1. Selects the appropriate template (Award, Site Ready, etc.).
    2. Translates the message into the contractor's preferred language (Hindi/Hinglish).
    3. Simplifies technical jargon into actionable steps.
    """
    try:
        result = await coordination_agent.generate_notification(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coordination agent error: {str(e)}")
