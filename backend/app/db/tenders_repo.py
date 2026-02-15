
import structlog
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.db.session import get_db_pool

logger = structlog.get_logger()

def _row_to_tender(row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "project_id": row["project_id"],
        "description": row["description"] or "",
        "status": row["status"],
        "deadline": row["deadline"].isoformat() if row["deadline"] else None,
        "min_budget": row["min_budget"],
        "max_budget": row["max_budget"],
        "bid_count": row.get("bid_count", 0),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }

def _row_to_bid(row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "tender_id": row["tender_id"],
        "contractor_name": row["contractor_name"],
        "amount": row["amount"],
        "status": row["status"],
        "submitted_at": row["submitted_at"].isoformat() if row.get("submitted_at") else None,
    }

class TendersRepository:
    """
    Data access layer for Tenders and Bids.
    """

    async def create_tender(
        self,
        title: str,
        project_id: Optional[int] = None,
        description: str = "",
        status: str = "Open",
        deadline: Optional[datetime] = None,
        min_budget: float = 0.0,
        max_budget: float = 0.0,
    ) -> Dict[str, Any]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO tenders (title, project_id, description, status, deadline, min_budget, max_budget, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING id, title, project_id, description, status, deadline, min_budget, max_budget, created_at
                """,
                title,
                project_id,
                description,
                status,
                deadline,
                min_budget,
                max_budget,
            )
            return _row_to_tender(row)

    async def list_tenders(self) -> List[Dict[str, Any]]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            # Join with bids to get count
            rows = await conn.fetch(
                """
                SELECT t.*, COUNT(b.id) as bid_count 
                FROM tenders t
                LEFT JOIN bids b ON t.id = b.tender_id
                GROUP BY t.id
                ORDER BY t.created_at DESC
                """
            )
            return [_row_to_tender(r) for r in rows]

    async def get_tender_by_id(self, tender_id: int) -> Optional[Dict[str, Any]]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT t.*, COUNT(b.id) as bid_count 
                FROM tenders t
                LEFT JOIN bids b ON t.id = b.tender_id
                WHERE t.id = $1
                GROUP BY t.id
                """,
                tender_id,
            )
            return _row_to_tender(row) if row else None

    async def place_bid(
        self,
        tender_id: int,
        contractor_name: str,
        amount: float,
    ) -> Dict[str, Any]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO bids (tender_id, contractor_name, amount, status, submitted_at)
                VALUES ($1, $2, $3, 'Pending', NOW())
                RETURNING id, tender_id, contractor_name, amount, status, submitted_at
                """,
                tender_id,
                contractor_name,
                amount,
            )
            return _row_to_bid(row)

    async def get_bids_for_tender(self, tender_id: int) -> List[Dict[str, Any]]:
        pool = get_db_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM bids WHERE tender_id = $1 ORDER BY amount ASC",
                tender_id
            )
            return [_row_to_bid(r) for r in rows]

# Global instance
tenders_repo = TendersRepository()
