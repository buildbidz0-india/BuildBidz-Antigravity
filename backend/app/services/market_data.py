
import structlog
from typing import List, Dict, Any, Optional
from app.services.price_data_source import PriceDataSource, SimulatedDataSource, APIDataSource

logger = structlog.get_logger()

class MarketDataService:
    """
    Service to fetch market data.
    Delegates to a configured PriceDataSource (Simulated or API).
    """

    def __init__(self):
        # In a real app, this would be injected via dependency injection or config
        # e.g., if settings.USE_REAL_DATA: self.source = APIDataSource()
        self.source: PriceDataSource = SimulatedDataSource()

    def get_price_history(self, material: str, region: str, days: int = 30) -> Dict[str, Any]:
        """
        Generates deterministic price history based on material and region.
        """
        try:
            history = self.source.get_price_history(material, region, days)
        except Exception as e:
            logger.error(f"Failed to fetch price history: {e}")
            return {
                "current_price": 0.0,
                "history": [],
                "unit": "N/A",
                "trend": "STABLE",
                "change_7d_percent": 0.0
            }

        if not history:
             return {
                "current_price": 0.0,
                "history": [],
                "unit": "N/A",
                "trend": "STABLE",
                "change_7d_percent": 0.0
            }

        current_final_price = history[-1].price
        unit = history[0].unit

        # Determine trend based on last 7 days from the fetched history
        # Ensure we have enough data
        start_index = -8 if len(history) >= 8 else 0
        start_7d = history[start_index].price
        
        change_7d = 0.0
        if start_7d != 0:
            change_7d = (current_final_price - start_7d) / start_7d
        
        trend_dir = "STABLE"
        if change_7d > 0.02: trend_dir = "UP"
        elif change_7d < -0.02: trend_dir = "DOWN"

        return {
            "current_price": current_final_price,
            "history": history,
            "unit": unit,
            "trend": trend_dir,
            "change_7d_percent": round(change_7d * 100, 2)
        }

market_data_service = MarketDataService()
