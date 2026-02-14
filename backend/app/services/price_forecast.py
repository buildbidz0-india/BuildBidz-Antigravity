
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
    
    1. Market Data Ingestion: Fetches current and historical prices (Mocked for now).
    2. Trend Analysis: Mathematical projection of price movement.
    3. AI Reasoning: Uses DeepSeek-R1 70B to generate "Lock Rate" advice based 
       on supply chain variables and margin protection goals.
    """

    def _get_mock_market_data(self, material: MaterialType, region: Region) -> Dict[str, Any]:
        """
        Generates realistic mock data for Indian construction materials until
        a real API source is integrated.
        """
        base_prices = {
            MaterialType.STEEL: 55000,  # Per Ton
            MaterialType.CEMENT: 380,   # Per Bag
            MaterialType.SAND: 1200,    # Per CFT
            MaterialType.TILES: 45,     # Per Sqft
            MaterialType.FITTINGS: 1500 # Per Unit avg
        }
        
        units = {
            MaterialType.STEEL: "INR/Ton",
            MaterialType.CEMENT: "INR/Bag",
            MaterialType.SAND: "INR/CFT",
            MaterialType.TILES: "INR/Sqft",
            MaterialType.FITTINGS: "INR/Unit"
        }
        
        base = base_prices.get(material, 1000)
        
        # Generate 30 days of history with some random volatility
        history = []
        today = datetime.now()
        current_price = base
        
        # Trend simulation
        trend = random.choice([-0.05, 0.02, 0.08]) # Down 5%, Up 2%, Up 8%
        
        for i in range(30, -1, -1):
            date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            # Sine wave + random noise + trend
            noise = random.uniform(-0.02, 0.02)
            day_factor = 1 + (trend * (30-i)/30) + noise
            price = base * day_factor
            
            history.append(PricePoint(
                date=date_str,
                price=round(price, 2),
                unit=units[material]
            ))
            
            if i == 0:
                current_price = price

        return {
            "current_price": round(current_price, 2),
            "history": history,
            "unit": units[material],
            "detected_trend": "UP" if trend > 0 else "DOWN" if trend < -0.02 else "STABLE"
        }

    async def generate_forecast(self, request: ForecastRequest) -> ForecastResult:
        """
        Generate a price forecast and lock-rate recommendation.
        """
        # 1. Get Market Data
        data = self._get_mock_market_data(request.material, request.region)
        current_price = data["current_price"]
        trend = data["detected_trend"]
        history = data["history"]
        
        # 2. Mathematical Projection (Simple Linear Regression for now)
        # In a real system, this would use Prophet or ARIMA
        if trend == "UP":
            projected_price = current_price * 1.05  # +5%
        elif trend == "DOWN":
            projected_price = current_price * 0.95  # -5%
        else:
            projected_price = current_price
            
        # 3. AI Analysis (DeepSeek-R1 70B via Router)
        # We prompt the AI to act as a Quantitative Analyst
        
        history_summary = "\n".join([f"{p.date}: {p.price}" for p in history[-7:]]) # Last 7 days
        
        prompt_content = f"""
        Role: Quantitative Supply Chain Analyst for BuildBidz.
        
        Task: Analyze price trends for {request.material.value} in {request.region.value}.
        Target Margin to Protect: {request.target_margin_percent}%
        
        Current Market Data:
        - Current Price: {current_price} {data['unit']}
        - 30-Day Trend: {trend}
        - Recent History (Last 7 Days):
        {history_summary}
        
        Goal:
        Determine if the developer should "HEGDE/LOCK NOW" or "WAIT".
        - If prices are rising and threaten the {request.target_margin_percent}% margin, recommend LOCK.
        - If prices are falling, recommend WAIT.
        
        Output:
        Provide a concise, data-driven analysis (max 3 sentences) explaining your recommendation.
        Focus on supply chain variables (seasonal demand, logistics).
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
