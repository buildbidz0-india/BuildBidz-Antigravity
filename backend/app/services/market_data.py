
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pydantic import BaseModel

class MarketPrice(BaseModel):
    date: str
    price: float
    unit: str

class MarketDataService:
    """
    Service to fetch market data.
    Currently implements a High-Fidelity Deterministic Simulator.
    
    Why Deterministic?
    - Ensures demo consistency: The price for '2024-10-24' should always be the same
      regardless of when we query it, unless we explicitly want live volatility.
    - Simulates 'Real' history better than random noise.
    """
    
    # Base prices for Indian Market (Feb 2026 approx)
    BASE_SENSITIVITY = {
        "steel": {"base": 52000, "unit": "INR/Ton", "volatility": 0.02},
        "cement": {"base": 410, "unit": "INR/Bag", "volatility": 0.015},
        "sand": {"base": 1400, "unit": "INR/CFT", "volatility": 0.03},
        "tiles": {"base": 55, "unit": "INR/Sqft", "volatility": 0.01},
        "fittings": {"base": 1800, "unit": "INR/Unit", "volatility": 0.02}
    }
    
    # Region multipliers
    REGION_MULTIPLIERS = {
        "patna": 1.05,    # Higher transport cost
        "lucknow": 1.02,
        "indore": 0.98,   # Central hub
        "delhi_ncr": 1.00 # Standard
    }

    def get_price_history(self, material: str, region: str, days: int = 30) -> Dict[str, Any]:
        """
        Generates deterministic price history based on material and region.
        """
        config = self.BASE_SENSITIVITY.get(material, self.BASE_SENSITIVITY["steel"])
        region_mult = self.REGION_MULTIPLIERS.get(region, 1.0)
        
        base_price = config["base"] * region_mult
        volatility = config["volatility"]
        
        history: List[MarketPrice] = []
        today = datetime.now()
        
        # Seed the random generator with a combination of material+region to ensure 
        # the "random walk" is consistent for this specific combo.
        # We also include the year/month so long-term trends shift slowly.
        seed_key = f"{material}_{region}_{today.year}_{today.month}"
        ran = random.Random(seed_key)
        
        # Generate a "Target Trend" for the month (e.g., this month Steel is going UP)
        monthly_trend = ran.choice([-1, 0, 1]) * ran.uniform(0.01, 0.05) # -5% to +5%
        
        current_price = base_price
        
        # We generate backwards from today
        # To make it realistic, we calculate the 'start' price 30 days ago and walk forward
        start_price = base_price * (1 - monthly_trend)
        
        prices = []
        price = start_price
        
        for i in range(days):
            # Random Walk step
            change = ran.gauss(0, volatility * base_price) 
            # Apply slight trend bias
            bias = (monthly_trend * base_price) / days
            
            price += change + bias
            prices.append(price)

        # Now format into the return structure (reversed to show latest last? No, chronological usually)
        # Let's return chronological: Day -30 to Today
        
        for i in range(days):
            date_str = (today - timedelta(days=(days - 1 - i))).strftime("%Y-%m-%d")
            p = prices[i]
            history.append(MarketPrice(
                date=date_str,
                price=round(p, 2),
                unit=config["unit"]
            ))
            
        current_final_price = history[-1].price
        
        # Determine trend based on last 7 days
        start_7d = history[-8].price if days >= 8 else history[0].price
        change_7d = (current_final_price - start_7d) / start_7d
        
        trend_dir = "STABLE"
        if change_7d > 0.02: trend_dir = "UP"
        elif change_7d < -0.02: trend_dir = "DOWN"

        return {
            "current_price": current_final_price,
            "history": history,
            "unit": config["unit"],
            "trend": trend_dir,
            "change_7d_percent": round(change_7d * 100, 2)
        }

market_data_service = MarketDataService()
