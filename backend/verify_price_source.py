import asyncio
import os
import sys

# Add the parent directory to sys.path to resolve 'app' module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.market_data import market_data_service

async def verify_market_data():
    print("--- Verifying Market Data Source ---")
    
    # 1. Test Steel in Patna
    print("\nFetching Steel prices for Patna (30 days)...")
    data = market_data_service.get_price_history("steel", "patna", days=30)
    
    print(f"Current Price: {data['current_price']} {data['unit']}")
    print(f"Trend: {data['trend']}")
    print(f"History Length: {len(data['history'])}")
    
    print("\nSample History (Last 3 days):")
    for p in data['history'][-3:]:
        print(f"  {p.date}: {p.price}")

    # 2. Test Determinism
    print("\nFetching AGAIN to verify determinism...")
    data2 = market_data_service.get_price_history("steel", "patna", days=30)
    
    if data['current_price'] == data2['current_price']:
        print("SUCCESS: Prices are consistent (Deterministic).")
    else:
        print("FAILURE: Prices changed between calls!")

    # 3. Test Seasonality (Mocking date not easy here without dependency injection, skipping)
    
if __name__ == "__main__":
    asyncio.run(verify_market_data())
