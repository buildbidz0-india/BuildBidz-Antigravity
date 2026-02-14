import structlog
import json
from datetime import datetime
from typing import Optional, List, Dict
from app.db.session import get_db_pool
from app.db.models import AgentLog, AwardDecision

logger = structlog.get_logger()

class Repository:
    """
    Data access layer for persistent storage.
    Uses direct asyncpg for performance, mapping broadly to the SQLAlchemy models.
    """
    
    async def log_agent_interaction(self, agent_name: str, role: str, content: str, session_id: Optional[str] = None, meta: Optional[dict] = None):
        try:
            pool = get_db_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO agent_logs (session_id, timestamp, agent_name, role, content, metadata_json)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    session_id,
                    datetime.utcnow(),
                    agent_name,
                    role,
                    content,
                    json.dumps(meta) if meta else None
                )
        except Exception as e:
            # Don't crash the app if logging fails, but alert us
            logger.error("Failed to persist agent log", error=str(e))

    async def save_award_decision(self, winner_bid_id: str, winner_supplier: str, score: float, justification: str, rankings: list, project_id: Optional[str] = None):
        try:
            pool = get_db_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO award_decisions (project_id, timestamp, winner_bid_id, winner_supplier, score, justification, rankings_json)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    project_id,
                    datetime.utcnow(),
                    winner_bid_id,
                    winner_supplier,
                    score,
                    justification,
                    json.dumps(rankings)
                )
            logger.info("Award decision saved to DB", winner=winner_supplier)
        except Exception as e:
            logger.error("Failed to persist award decision", error=str(e))

# Global instance
repo = Repository()
