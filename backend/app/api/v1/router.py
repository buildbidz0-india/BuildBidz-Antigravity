from fastapi import APIRouter
from app.api.v1.endpoints import ai, award, forecast, coordination, projects

api_router = APIRouter()
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(award.router, prefix="/awards", tags=["awards"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
api_router.include_router(coordination.router, prefix="/coordination", tags=["coordination"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
