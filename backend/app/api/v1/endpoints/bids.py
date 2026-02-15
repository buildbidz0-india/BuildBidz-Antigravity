
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db.tenders_repo import tenders_repo

router = APIRouter()

# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------

class TenderCreate(BaseModel):
    title: str
    project_id: Optional[int] = None
    description: Optional[str] = None
    min_budget: Optional[float] = 0.0
    max_budget: Optional[float] = 0.0
    deadline: Optional[datetime] = None

class BidCreate(BaseModel):
    contractor_name: str
    amount: float

class BidResponse(BaseModel):
    id: int
    tender_id: int
    contractor_name: str
    amount: float
    status: str
    submitted_at: Optional[str]

class TenderResponse(BaseModel):
    id: int
    title: str
    project_id: Optional[int]
    description: str
    status: str
    deadline: Optional[str]
    min_budget: float
    max_budget: float
    bid_count: int
    created_at: Optional[str]

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get("", response_model=List[TenderResponse])
async def list_tenders():
    """List all tenders."""
    try:
        return await tenders_repo.list_tenders()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=TenderResponse)
async def create_tender(body: TenderCreate):
    """Create a new tender."""
    try:
        return await tenders_repo.create_tender(
            title=body.title,
            project_id=body.project_id,
            description=body.description or "",
            deadline=body.deadline,
            min_budget=body.min_budget or 0.0,
            max_budget=body.max_budget or 0.0,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tender_id}", response_model=TenderResponse)
async def get_tender(tender_id: int):
    """Get a tender by ID."""
    try:
        tender = await tenders_repo.get_tender_by_id(tender_id)
        if not tender:
            raise HTTPException(status_code=404, detail="Tender not found")
        return tender
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tender_id}/submit", response_model=BidResponse)
async def place_bid(tender_id: int, body: BidCreate):
    """Submit a bid for a tender."""
    try:
        tender = await tenders_repo.get_tender_by_id(tender_id)
        if not tender:
            raise HTTPException(status_code=404, detail="Tender not found")
            
        return await tenders_repo.place_bid(
            tender_id=tender_id,
            contractor_name=body.contractor_name,
            amount=body.amount
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tender_id}/bids", response_model=List[BidResponse])
async def get_bids(tender_id: int):
    """Get all bids for a tender."""
    try:
        return await tenders_repo.get_bids_for_tender(tender_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
