
import asyncio
import structlog
from app.db.tenders_repo import tenders_repo
from app.api.v1.endpoints.bids import analyze_tender

# Configure structlog for standalone script
structlog.configure(
    processors=[structlog.processors.JSONRenderer()],
    logger_factory=structlog.stdlib.LoggerFactory(),
)

async def verify_bids_flow():
    print("--- Verifying Bids & Analysis API Flow ---")

    # 1. Create a Tender
    print("\n1. Creating Tender...", end=" ")
    tender = await tenders_repo.create_tender(
        title="Verification Tender for Steel Supply",
        description="Supply of 50 Tons of TMT Bars for Patna Project. Urgent delivery required.",
        min_budget=2500000,
        max_budget=3000000
    )
    tender_id = tender["id"]
    print(f"DONE (ID: {tender_id})")

    # 2. Place Bids (Simulating 3 contractors)
    print("\n2. Submitting Bids...")
    
    # Bid 1: Low Price, Slow Delivery
    await tenders_repo.place_bid(tender_id, "Budget Steel Co", 2450000)
    print("  - Bid 1: Budget Steel Co (24.5L)")

    # Bid 2: High Price, Fast Delivery
    await tenders_repo.place_bid(tender_id, "Speedy Infra", 2900000)
    print("  - Bid 2: Speedy Infra (29.0L)")

    # Bid 3: Balanced
    await tenders_repo.place_bid(tender_id, "Reliable Traders", 2650000)
    print("  - Bid 3: Reliable Traders (26.5L)")

    # 3. Trigger Analysis
    print(f"\n3. Triggering AI Analysis for Tender {tender_id}...")
    try:
        decision = await analyze_tender(tender_id)
        
        print("\n--- Analysis Result ---")
        print(f"Winner: {decision.meta.get('winner_name', 'Unknown')} (Bid ID: {decision.recommended_bid_id})")
        print(f"Score: {decision.score}")
        print(f"Justification: {decision.justification}")
        print("\nRankings:")
        for r in decision.rankings:
            print(f"  - {r['supplier']}: {r['total_score']} (Price: {r['price_score']}, Delivery: {r['delivery_score']})")
            
        print("\nSUCCESS: Flow verified.")
        
    except Exception as e:
        print(f"\nFAILURE: Analysis failed - {e}")

if __name__ == "__main__":
    asyncio.run(verify_bids_flow())
