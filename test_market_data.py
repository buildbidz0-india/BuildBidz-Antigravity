
import sys
import os

# Add backend to path so imports work
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.market_data import market_data_service

def test():
    print("Testing Market Data Service...")
    
    # Test Steel in Patna
    data = market_data_service.get_price_history("steel", "patna", days=7)
    print(f"\nMaterial: Steel | Region: Patna")
    print(f"Current Price: {data['current_price']} {data['unit']}")
    print(f"Trend: {data['trend']}")
    print(f"History (Last 3 days):")
    for p in data['history'][-3:]:
        print(f"  {p.date}: {p.price}")

    # Test Cement in Delhi
    data = market_data_service.get_price_history("cement", "delhi_ncr", days=7)
    print(f"\nMaterial: Cement | Region: Delhi")
    print(f"Current Price: {data['current_price']} {data['unit']}")
    print(f"Trend: {data['trend']}")

if __name__ == "__main__":
    test()
