
# =============================================================================
# BuildBidz - Quantitative Analyst Engine (Price Forecasting)
# =============================================================================
# Implements material price trend analysis and "Lock Rate" recommendations
# using mathematical models + DeepSeek-R1 logic as defined in the 
# AI Roadmap (2026).
# =============================================================================

from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import structlog
import random  # For mock data generation until real API source is connected

from app.services.ai import groq_service
from app.services.market_data import market_data_service

logger = structlog.get_logger()

# =============================================================================
# Data Models
# =============================================================================

class MaterialType(str, Enum):
    STEEL = "steel"
    CEMENT = "cement"
    SAND = "sand"
    TILES = "tiles"
    FITTINGS = "fittings"

class Region(str, Enum):
    PATNA = "patna"
    LUCKNOW = "lucknow"
    INDORE = "indore"
    DELHI_NCR = "delhi_ncr"

class PricePoint(BaseModel):
    date: str
    price: float
    unit: str

class ForecastRequest(BaseModel):
    material: MaterialType
    region: Region
    quantity: float
    target_margin_percent: float = Field(default=12.0, description="Developer's target margin to protect")

class ForecastResult(BaseModel):
    material: MaterialType
    region: Region
    current_price: float
    forecast_price_30d: float
    trend_direction: str  # "UP", "DOWN", "STABLE"
    lock_rate_recommendation: bool
    confidence_score: float
    ai_analysis: str  # DeepSeek-R1 reasoning
    historical_data: List[PricePoint]

# =============================================================================
# Price Forecast Service
# =============================================================================

class PriceForecastService:
    """
    Core logic for the 'Quantitative Analyst' phase.
    
    1. Market Data Ingestion: Fetches real/simulated data from MarketDataService.
    2. Trend Analysis: Uses the detected trend from MarketDataService.
    3. AI Reasoning: Uses DeepSeek-R1 70B to generate "Lock Rate" advice.
    """

    async def generate_forecast(self, request: ForecastRequest) -> ForecastResult:
        """
        Generate a price forecast and lock-rate recommendation.
        """
        # 1. Get Market Data (Deterministic/Real)
        # Note: We fetch more days (60) to give the chart more context, but AI uses last 30
        market_data = market_data_service.get_price_history(
            request.material.value, 
            request.region.value, 
            days=30
        )
        
        current_price = market_data["current_price"]
        trend = market_data["trend"]
        
        # Convert dict items to PricePoint objects
        history = [
            PricePoint(date=p.date, price=p.price, unit=p.unit) 
            for p in market_data["history"]
        ]
        
        # 2. Mathematical Projection
        # Simple projection based on the 7-day trend identified by MarketDataService
        # If trend is STABLE, we assume minimal drift.
        if trend == "UP":
            projected_price = current_price * 1.05  # +5%
        elif trend == "DOWN":
            projected_price = current_price * 0.95  # -5%
        else:
            projected_price = current_price * 1.01  # +1% inflation bias
            
        # 3. AI Analysis (DeepSeek-R1 70B via Router)
        
        history_summary = "\n".join([f"{p.date}: {p.price}" for p in history[-7:]]) # Last 7 days
        
        prompt_content = f"""
        Role: Quantitative Supply Chain Analyst for BuildBidz.
        
        Task: Analyze price trends for {request.material.value} in {request.region.value}.
        Target Margin to Protect: {request.target_margin_percent}%
        
        Current Market Data:
        - Current Price: {current_price} {market_data['unit']}
        - Trend Direction (7-day): {trend}
        - Recent History (Last 7 Days):
        {history_summary}
        
        Goal:
        Determine if the developer should "HEGDE/LOCK NOW" or "WAIT".
        - If prices are rising and threaten the {request.target_margin_percent}% margin, recommend LOCK.
        - If prices are falling, recommend WAIT.
        
        Output:
        Provide a concise, data-driven analysis (max 3 sentences) explaining your recommendation.
        Focus on supply chain variables (seasonal demand, logistics) that might explain this trend.
        """
        
        messages = [{"role": "user", "content": prompt_content}]
        
        try:
            # Use the 'forecast' task type which maps to DeepSeek-R1 70B
            response = await groq_service.price_forecast(messages, temperature=0.2)
            ai_analysis = response.choices[0].message.content
        except Exception as e:
            logger.error("AI Forecast failed", error=str(e))
            ai_analysis = "AI analysis unavailable. Proceed with caution based on mathematical trend."

        # 4. Determine Recommendation
        # Logic: If trend is UP and AI says Lock -> Lock
        # If trend is DOWN -> Wait
        # If STABLE -> Wait (usually)
        should_lock = (trend == "UP")
        
        return ForecastResult(
            material=request.material,
            region=request.region,
            current_price=current_price,
            forecast_price_30d=round(projected_price, 2),
            trend_direction=trend,
            lock_rate_recommendation=should_lock,
            confidence_score=0.85 if trend != "STABLE" else 0.60,
            ai_analysis=ai_analysis,
            historical_data=history
        )

# Global Instance
price_forecast_service = PriceForecastService()
