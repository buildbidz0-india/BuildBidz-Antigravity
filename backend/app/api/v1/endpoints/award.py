
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.award_engine import award_engine, Bid, AwardCriteria, AwardDecision
from app.core.auth import get_current_user

router = APIRouter()

class CompareBidsRequest(BaseModel):
    requirement_description: str
    bids: List[Bid]
    criteria: AwardCriteria = Field(default_factory=AwardCriteria)

@router.post("/compare", response_model=AwardDecision)
async def compare_bids(
    request: CompareBidsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Evaluate multiple bids for a requirement using the Strategic Decision Engine.
    
    1. Scores bids based on Price (50%), Delivery (30%), Reputation (20%).
    2. Uses AI (GPT-OSS 120B) to generate a "Senior Procurement Officer" justification.
    
    Returns the recommended winner, scores, and verbal reasoning.
    """
    if len(request.bids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 bids are required for comparison.")

    try:
        decision = await award_engine.generate_recommendation(
            requirement_desc=request.requirement_description, 
            bids=request.bids, 
            criteria=request.criteria
        )
        return decision
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Award engine error: {str(e)}")

@router.post("/score-only")
async def score_bids_only(
    request: CompareBidsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Fast, math-only scoring without AI justification.
    Useful for quick sorting or real-time UI updates.
    """
    scored = award_engine.calculate_scores(request.bids, request.criteria)
    return {
        "ranked_bids": scored
    }
