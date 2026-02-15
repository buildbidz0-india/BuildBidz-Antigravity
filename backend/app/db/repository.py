import structlog
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.db.session import get_db_pool
from app.db.models import AgentLog, AwardDecision

logger = structlog.get_logger()


def _row_to_project(row) -> Dict[str, Any]:
    """Map DB row to project dict."""
    return {
        "id": row["id"],
        "name": row["name"],
        "location": row["location"] or "",
        "status": row["status"] or "Planning",
        "description": row["description"] or "",
        "progress": row["progress"] or 0,
        "team_count": row["team_count"],
        "deadline": row["deadline"],
        "image": row["image"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


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

    # -------------------------------------------------------------------------
    # Projects
    # -------------------------------------------------------------------------

    async def create_project(
        self,
        name: str,
        location: Optional[str] = None,
        description: Optional[str] = None,
        status: str = "Planning",
        progress: int = 0,
    ) -> Dict[str, Any]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO projects (name, location, description, status, progress)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, name, location, status, description, progress, team_count, deadline, image, created_at
                """,
                name,
                location or "",
                description or "",
                status,
                progress,
            )
            return _row_to_project(row)

    async def list_projects(self) -> List[Dict[str, Any]]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, name, location, status, description, progress, team_count, deadline, image, created_at FROM projects ORDER BY created_at DESC"
            )
            return [_row_to_project(r) for r in rows]

    async def get_project_by_id(self, project_id: int) -> Optional[Dict[str, Any]]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, name, location, status, description, progress, team_count, deadline, image, created_at FROM projects WHERE id = $1",
                project_id,
            )
            return _row_to_project(row) if row else None


# Global instance
repo = Repository()
