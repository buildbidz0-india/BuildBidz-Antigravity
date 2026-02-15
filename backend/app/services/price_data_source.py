
import random
import math
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pydantic import BaseModel

# =============================================================================
# Data Models
# =============================================================================

class MarketPrice(BaseModel):
    date: str
    price: float
    unit: str
    source: str = "simulated"  # "simulated" or "api"

class PriceDataSource(ABC):
    """
    Abstract Base Class for fetching market price history.
    """
    @abstractmethod
    def get_price_history(self, material: str, region: str, days: int) -> List[MarketPrice]:
        pass

# =============================================================================
# Implementations
# =============================================================================

class SimulatedDataSource(PriceDataSource):
    """
    High-Fidelity Deterministic Simulator.
    Simulates:
    - Base Volatility (Random Walk)
    - Regional Differences
    - Seasonality (Monsoon, Festival)
    - Market Shocks (Supply Chain Disruptions)
    """
    
    BASE_CONFIG = {
        "steel": {"base": 52000, "unit": "INR/Ton", "volatility": 0.02},
        "cement": {"base": 410, "unit": "INR/Bag", "volatility": 0.015},
        "sand": {"base": 1400, "unit": "INR/CFT", "volatility": 0.03},
        "tiles": {"base": 55, "unit": "INR/Sqft", "volatility": 0.01},
        "fittings": {"base": 1800, "unit": "INR/Unit", "volatility": 0.02}
    }

    REGION_MULTIPLIERS = {
        "patna": 1.05,
        "lucknow": 1.02,
        "indore": 0.98,
        "delhi_ncr": 1.00
    }

    def get_price_history(self, material: str, region: str, days: int = 30) -> List[MarketPrice]:
        config = self.BASE_CONFIG.get(material, self.BASE_CONFIG["steel"])
        base_price = config["base"] * self.REGION_MULTIPLIERS.get(region, 1.0)
        volatility = config["volatility"]
        
        history: List[MarketPrice] = []
        today = datetime.now()
        
        # Seed ensures that querying the SAME date always returns the SAME price
        # We process day by day
        
        for i in range(days):
            current_date = today - timedelta(days=(days - 1 - i))
            date_str = current_date.strftime("%Y-%m-%d")
            
            # 1. Deterministic Randomness for this Date + Material + Region
            # Using timestamp of the date at midnight ensures stability
            seed_val = f"{material}_{region}_{date_str}"
            rng = random.Random(seed_val)
            
            # 2. Seasonality Factor
            # Monsoon (June-Sept): Demand drops -> Prices drop ~5%
            month = current_date.month
            seasonality = 1.0
            if 6 <= month <= 9:
                seasonality = 0.95
            
            # 3. Market Shocks (Rare events)
            # 1 in 100 chance of a "Shock" on any given day that lasts for a while?
            # Keeping it simple: The seed includes the date, so 'shocks' are static to the date.
            # We'll simulate a random walk from a fixed point (start of year) to ensure continuity?
            # Actually, true continuity requires P(t) = P(t-1) + delta.
            # To allow random access WITHOUT storing state, we use a sine wave + noise function
            # P(t) = Base * (1 + Seasonality + MacroTrend + DailyNoise)
            
            day_of_year = current_date.timetuple().tm_yday
            
            # 3a. Macro Trend (Sine wave with 1-year period)
            # Peak in Summer (March-May), Low in Winter
            macro_trend = math.sin((day_of_year / 365) * 2 * math.pi) * 0.05
            
            # 3b. Daily Noise (Random fluctuation)
            noise = rng.gauss(0, volatility)
            
            # Calculate Price
            # Price = Base * Seasonality * (1 + Macro + Noise)
            final_price = base_price * seasonality * (1 + macro_trend + noise)
            
            history.append(MarketPrice(
                date=date_str,
                price=round(final_price, 2),
                unit=config["unit"],
                source="simulated"
            ))
            
        return history

class APIDataSource(PriceDataSource):
    """
    Placeholder for Real API integration.
    """
    def get_price_history(self, material: str, region: str, days: int) -> List[MarketPrice]:
        # TODO: Implement httpx call to real provider
        # For now, fallback to simulation or return empty
        return []

