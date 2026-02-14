
# Verification Script for BuildBidz Price Forecast Engine
# Tests the trend analysis and lock-rate logic

import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.price_forecast import price_forecast_service, ForecastRequest, MaterialType, Region

def print_result(name, passed):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")

async def test_forecasting():
    print("\n--- Testing Price Forecast Engine ---")
    
    # 1. Test Mock Data & Trend Analysis
    print("Generating forecast for STEEL in DELHI_NCR...")
    request = ForecastRequest(
        material=MaterialType.STEEL,
        region=Region.DELHI_NCR,
        quantity=100.0,
        target_margin_percent=12.0
    )
    
    # Run forecast
    result = await price_forecast_service.generate_forecast(request)
    
    # Verify Data Structure
    print(f"Material: {result.material}")
    print(f"Current Price: {result.current_price}")
    print(f"Trend: {result.trend_direction}")
    print(f"Recommendation: {'LOCK NOW' if result.lock_rate_recommendation else 'WAIT'}")
    print(f"History Points: {len(result.historical_data)}")
    
    print_result("History Data Generated (30 days)", len(result.historical_data) >= 30)
    print_result("Price is positive", result.current_price > 0)
    
    # Verify Lock Logic
    # If trend is UP, should recommend Lock
    if result.trend_direction == "UP":
        print_result("Logic: UP Trend -> Lock", result.lock_rate_recommendation == True)
        print(f"Forecast Price (+5%): {result.forecast_price_30d}")
        # Allow small float diffs
        expected = result.current_price * 1.05
        print_result("Projection Calculation", abs(result.forecast_price_30d - expected) < 1.0)
        
    elif result.trend_direction == "DOWN":
        print_result("Logic: DOWN Trend -> Wait", result.lock_rate_recommendation == False)
        
    # Verify AI Analysis Field (Even if mocked/error)
    print(f"AI Analysis: {result.ai_analysis[:50]}...")
    print_result("AI Analysis Present", len(result.ai_analysis) > 0)

async def main():
    await test_forecasting()

if __name__ == "__main__":
    asyncio.run(main())
