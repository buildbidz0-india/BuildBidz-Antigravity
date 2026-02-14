
# =============================================================================
# BuildBidz - Strategic Decision Engine (Compare & Award)
# =============================================================================
# Implements the multi-factor scoring logic and AI verbal justification
# for procurement decisions as defined in the AI Roadmap (2026).
# =============================================================================

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
import structlog
import json

from app.services.ai import groq_service
from app.core.model_config import TaskType

logger = structlog.get_logger()

# =============================================================================
# Data Models
# =============================================================================

class Bid(BaseModel):
    """A supplier's bid for a requirement."""
    id: str
    supplier_name: str
    price: float
    delivery_days: int
    reputation_score: float = Field(ge=0.0, le=10.0, description="0-10 score based on past performance")
    is_verified: bool = False
    notes: Optional[str] = None

class AwardCriteria(BaseModel):
    """Weighted criteria for evaluating bids."""
    weight_price: float = 0.50
    weight_delivery: float = 0.30
    weight_reputation: float = 0.20
    
    # Optional constraints
    max_price: Optional[float] = None
    max_delivery_days: Optional[int] = None

class AwardDecision(BaseModel):
    """The final AI-generated award recommendation."""
    recommended_bid_id: str
    score: float
    justification: str  # The "verbal justification" required by roadmap
    rankings: List[Dict[str, Any]]  # Full ranking details
    meta: Dict[str, Any] = {}

# =============================================================================
# Award Engine Service
# =============================================================================

class AwardEngine:
    """
    Core logic for the 'Compare & Award' phase.
    
    1. Quantitative Scoring: Calculates weighted scores for Price, SPEED, TRUST.
    2. Qualitative Reasoning: Uses AI (GPT-OSS 120B) to generate the "Senior Procurement Officer" 
       justification for the decision.
    """

    def calculate_scores(self, bids: List[Bid], criteria: AwardCriteria) -> List[Dict[str, Any]]:
        """
        Calculate weighted scores for all bids.
        Score = (W_p * PriceScore) + (W_d * DeliveryScore) + (W_r * ReputationScore)
        All scores are normalized 0-100.
        """
        if not bids:
            return []

        # Find ranges for normalization
        prices = [b.price for b in bids]
        min_price = min(prices)
        max_price = max(prices)
        price_range = max_price - min_price if max_price != min_price else 1

        deliveries = [b.delivery_days for b in bids]
        min_delivery = min(deliveries)
        max_delivery = max(deliveries)
        delivery_range = max_delivery - min_delivery if max_delivery != min_delivery else 1

        scored_bids = []
        for bid in bids:
            # 1. Price Score (Lower is better) -> Invert
            # 100 points for lowest price, 0 for highest
            price_score = 100 * (1 - (bid.price - min_price) / price_range)
            
            # 2. Delivery Score (Lower is better) -> Invert
            delivery_score = 100 * (1 - (bid.delivery_days - min_delivery) / delivery_range)
            
            # 3. Reputation Score (Higher is better) -> Scale 0-10 to 0-100
            reputation_score = bid.reputation_score * 10
            
            # Final Weighted Score
            final_score = (
                (criteria.weight_price * price_score) +
                (criteria.weight_delivery * delivery_score) +
                (criteria.weight_reputation * reputation_score)
            )

            scored_bids.append({
                "bid": bid,
                "scores": {
                    "price_raw": bid.price,
                    "price_score": round(price_score, 1),
                    "delivery_raw": bid.delivery_days,
                    "delivery_score": round(delivery_score, 1),
                    "reputation_raw": bid.reputation_score,
                    "reputation_score": round(reputation_score, 1),
                    "total": round(final_score, 1)
                }
            })

        # Sort by total score descending
        return sorted(scored_bids, key=lambda x: x["scores"]["total"], reverse=True)

    async def generate_recommendation(self, requirement_desc: str, bids: List[Bid], criteria: AwardCriteria) -> AwardDecision:
        """
        Full Analyze & Award workflow.
        
        1. Calculate math scores first (objective baseline).
        2. Feed top 3 candidates to AI Model (GPT-OSS 120B) for narrative generation.
        """
        # 1. Math Scoring
        ranked_bids = self.calculate_scores(bids, criteria)
        top_bid = ranked_bids[0]
        
        # 2. Prepare context for AI
        # We only send the top 3 to the LLM to focus the reasoning
        candidates = ranked_bids[:3]
        
        candidate_summary = []
        for c in candidates:
            b = c["bid"]
            s = c["scores"]
            candidate_summary.append(
                f"- Supplier: {b.supplier_name} (ID: {b.id})\n"
                f"  Price: ₹{b.price:.2f} (Score: {s['price_score']})\n"
                f"  Delivery: {b.delivery_days} days (Score: {s['delivery_score']})\n"
                f"  Reputation: {b.reputation_score}/10 (Score: {s['reputation_score']})\n"
                f"  Verified: {b.is_verified}\n"
                f"  Notes: {b.notes or 'None'}\n"
                f"  Total Weighted Score: {s['total']}/100"
            )
        
        candidates_text = "\n\n".join(candidate_summary)
        
        prompt_content = f"""
        Requirement: {requirement_desc}
        
        Evaluation Weights: 
        - Price: {criteria.weight_price*100}%
        - Delivery: {criteria.weight_delivery*100}%
        - Reputation: {criteria.weight_reputation*100}%
        
        Top 3 Candidates (based on mathematical scoring):
        {candidates_text}
        
        TASK:
        As a Senior Procurement Officer, analyze these top candidates.
        1. Confirm if the mathematically top-ranked bid ({top_bid['bid'].supplier_name}) is truly the best choice.
        2. Provide a clear, professional "Verbal Justification" that can be shown to other bidders to prove fairness.
        3. Explain WHY the winner was chosen over the runner-up (e.g. "Supplier A was 5% cheaper, but Supplier B's 2-day delivery prevents site stoppage").
        4. Be merit-based.
        """
        
        messages = [
            {"role": "user", "content": prompt_content}
        ]

        # 3. AI Reasoning (via Router -> Model Award/GPT-OSS 120B)
        response = await groq_service.award_compare(messages, temperature=0.3)
        justification = response.choices[0].message.content

        )
        
        # 4. Persist Decision
        from app.db.repository import repo
        await repo.save_award_decision(
            winner_bid_id=top_bid["bid"].id,
            winner_supplier=top_bid["bid"].supplier_name,
            score=top_bid["scores"]["total"],
            justification=justification,
            rankings=ranked_bids,
            project_id="PROJECT-123" # Placeholder for now
        )
        
        return AwardDecision(
            recommended_bid_id=top_bid["bid"].id,
            score=top_bid["scores"]["total"],
            justification=justification,
            rankings=[
                {
                    "rank": i+1,
                    "supplier": r["bid"].supplier_name,
                    "total_score": r["scores"]["total"],
                    "breakdown": r["scores"]
                }
                for i, r in enumerate(ranked_bids)
            ],
            meta={"persisted": True}
        )

# Global Instance
award_engine = AwardEngine()
