import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.config import settings
from app.db.session import init_db, close_db, get_db_pool
import structlog

logger = structlog.get_logger()

async def init_tables():
    """Create tables if they don't exist."""
    print("Initializing database...")
    await init_db()
    
    pool = get_db_pool()
    async with pool.acquire() as conn:
        # Agent Logs
        print("Creating agent_logs table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR,
                timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                agent_name VARCHAR,
                role VARCHAR,
                content TEXT,
                metadata_json JSONB
            );
            CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_agent_logs_session_id ON agent_logs(session_id);
        """)
        
        # Award Decisions
        print("Creating award_decisions table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS award_decisions (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR,
                timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                winner_bid_id VARCHAR,
                winner_supplier VARCHAR,
                score DOUBLE PRECISION,
                justification TEXT,
                rankings_json JSONB
            );
            CREATE INDEX IF NOT EXISTS idx_award_decisions_timestamp ON award_decisions(timestamp);
        """)

        # Projects
        print("Creating projects table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                location VARCHAR,
                status VARCHAR DEFAULT 'Planning',
                description TEXT,
                progress INTEGER DEFAULT 0,
                team_count INTEGER,
                deadline VARCHAR,
                image VARCHAR,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
            );
            CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        """)
        
    print("Tables initialized successfully.")
    await close_db()

if __name__ == "__main__":
    asyncio.run(init_tables())
