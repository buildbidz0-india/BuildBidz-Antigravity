from fastapi import APIRouter
from app.api.v1.endpoints import ai, award

api_router = APIRouter()
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(award.router, prefix="/awards", tags=["awards"])
