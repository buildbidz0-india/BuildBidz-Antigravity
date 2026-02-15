import structlog
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.db.session import get_db_pool
from app.db.models import AgentLog, AwardDecision

logger = structlog.get_logger()


def _parse_json_col(row, key: str, default: list) -> list:
    val = row.get(key)
    if val is None:
        return default
    if isinstance(val, str):
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return default
    return list(val) if val else default


def _row_to_project(row) -> Dict[str, Any]:
    """Map DB row to project dict."""
    team = _parse_json_col(row, "team_json", [])
    milestones = _parse_json_col(row, "milestones_json", [])
    return {
        "id": row["id"],
        "name": row["name"],
        "location": row["location"] or "",
        "status": row["status"] or "Planning",
        "description": row["description"] or "",
        "progress": row["progress"] or 0,
        "team_count": row.get("team_count") if row.get("team_count") is not None else len(team),
        "deadline": row["deadline"],
        "image": row["image"],
        "team": team,
        "milestones": milestones,
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
                RETURNING id, name, location, status, description, progress, team_count, deadline, image, team_json, milestones_json, created_at
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
                "SELECT id, name, location, status, description, progress, team_count, deadline, image, team_json, milestones_json, created_at FROM projects ORDER BY created_at DESC"
            )
            return [_row_to_project(r) for r in rows]

    async def get_project_by_id(self, project_id: int) -> Optional[Dict[str, Any]]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, name, location, status, description, progress, team_count, deadline, image, team_json, milestones_json, created_at FROM projects WHERE id = $1",
                project_id,
            )
            return _row_to_project(row) if row else None

    async def update_project(
        self,
        project_id: int,
        *,
        name: Optional[str] = None,
        location: Optional[str] = None,
        status: Optional[str] = None,
        description: Optional[str] = None,
        progress: Optional[int] = None,
        team: Optional[List[Dict[str, Any]]] = None,
        milestones: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Update project fields. Only provided fields are updated."""
        updates = []
        values = []
        pos = 1
        if name is not None:
            updates.append(f"name = ${pos}")
            values.append(name)
            pos += 1
        if location is not None:
            updates.append(f"location = ${pos}")
            values.append(location)
            pos += 1
        if status is not None:
            updates.append(f"status = ${pos}")
            values.append(status)
            pos += 1
        if description is not None:
            updates.append(f"description = ${pos}")
            values.append(description)
            pos += 1
        if progress is not None:
            updates.append(f"progress = ${pos}")
            values.append(progress)
            pos += 1
        if team is not None:
            updates.append(f"team_json = ${pos}")
            values.append(json.dumps(team))
            pos += 1
        if milestones is not None:
            updates.append(f"milestones_json = ${pos}")
            values.append(json.dumps(milestones))
            pos += 1
        if not updates:
            return await self.get_project_by_id(project_id)
        values.append(project_id)
        pool = get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                f"UPDATE projects SET {', '.join(updates)} WHERE id = ${pos}",
                *values,
            )
        return await self.get_project_by_id(project_id)


# Global instance
repo = Repository()
