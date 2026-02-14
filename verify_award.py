
# Verification Script for BuildBidz Award Engine
# Tests the multi-factor scoring logic (Price, Delivery, Reputation)

import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.award_engine import award_engine, Bid, AwardCriteria

def print_result(name, passed):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")

async def test_scoring():
    print("\n--- Testing Award Engine Scoring ---")
    
    # 1. Setup Data
    criteria = AwardCriteria(
        weight_price=0.5,      # 50%
        weight_delivery=0.3,   # 30%
        weight_reputation=0.2  # 20%
    )
    
    bids = [
        Bid(
            id="bid_1", 
            supplier_name="Cheap & Slow Corp", 
            price=100000, 
            delivery_days=10, 
            reputation_score=7.0
        ),
        Bid(
            id="bid_2", 
            supplier_name="Fast & Pricey Ltd", 
            price=120000, 
            delivery_days=2, 
            reputation_score=9.0
        ),
        Bid(
            id="bid_3", 
            supplier_name="Balanced Bros", 
            price=105000, 
            delivery_days=5, 
            reputation_score=8.5
        )
    ]
    
    # 2. Run Scoring
    ranked = award_engine.calculate_scores(bids, criteria)
    
    # 3. Verify Results
    print("\nRanking Results:")
    for r in ranked:
        b = r["bid"]
        s = r["scores"]
        print(f"{r['rank'] if 'rank' in r else '-'} {b.supplier_name}: Total {s['total']} "
              f"(Price: {s['price_score']}, Del: {s['delivery_score']}, Rep: {s['reputation_score']})")

    # Verification Logic
    # Cheapest (Bid 1) should have max price score (100)
    # Fastest (Bid 2) should have max delivery score (100)
    
    bid1_res = next(r for r in ranked if r["bid"].id == "bid_1")
    bid2_res = next(r for r in ranked if r["bid"].id == "bid_2")
    
    print_result("Cheapest gets max Price Score", bid1_res["scores"]["price_score"] == 100.0)
    print_result("Fastest gets max Delivery Score", bid2_res["scores"]["delivery_score"] == 100.0)
    
    # Weighted calculation check for Bid 3
    # Price Range: 100k - 120k (Range 20k). Bid 3 is 105k.
    # Normalized Price = 1 - (105k-100k)/20k = 1 - 0.25 = 0.75 -> Score 75
    # Delivery Range: 2 - 10 (Range 8). Bid 3 is 5.
    # Normalized Del = 1 - (5-2)/8 = 1 - 3/8 = 0.625 -> Score 62.5
    # Reputation: 8.5 -> Score 85
    # Total = (0.5*75) + (0.3*62.5) + (0.2*85) = 37.5 + 18.75 + 17 = 73.25
    
    bid3_res = next(r for r in ranked if r["bid"].id == "bid_3")
    print(f"Bid 3 Calculated Total: {bid3_res['scores']['total']}")
    
    # Allow small float rounding diffs
    passed_calc = 73.0 <= bid3_res["scores"]["total"] <= 73.5
    print_result("Weighted Score Calculation", passed_calc)

async def main():
    await test_scoring()

if __name__ == "__main__":
    asyncio.run(main())
