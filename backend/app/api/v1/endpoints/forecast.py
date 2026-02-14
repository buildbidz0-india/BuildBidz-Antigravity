
from fastapi import APIRouter, HTTPException, Depends
from app.services.price_forecast import price_forecast_service, ForecastRequest, ForecastResult
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/analyze", response_model=ForecastResult)
async def analyze_price_trend(
    request: ForecastRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a material price forecast and lock-rate recommendation.
    
    1. Analyzes historical trends (mocked for Phase 3).
    2. Uses DeepSeek-R1 70B (Quantitative Analyst) to evaluate market conditions.
    3. Recommends "LOCK" or "WAIT" to protect developer margins.
    """
    try:
        result = await price_forecast_service.generate_forecast(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast engine error: {str(e)}")
