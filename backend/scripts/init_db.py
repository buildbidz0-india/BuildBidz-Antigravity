import asyncio
import json
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
                team_json JSONB DEFAULT '[]',
                milestones_json JSONB DEFAULT '[]',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
            );
            CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        """)
        # Add columns for existing DBs
        await conn.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_json JSONB DEFAULT '[]';")
        await conn.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS milestones_json JSONB DEFAULT '[]';")

        # Seed mock projects if table is empty
        count = await conn.fetchval("SELECT COUNT(*) FROM projects")
        if count == 0:
            print("Seeding 3 mock projects...")
            seed_projects = [
                (
                    "Mumbai Metro Extension",
                    "Mumbai, MH",
                    "Active",
                    "Phase 2 extension of the Mumbai Metro Line 3, covering 12km of elevated corridor and 8 stations.",
                    35,
                    18,
                    "Dec 2026",
                    "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=400",
                    json.dumps([
                        {"name": "John Doe", "role": "Project Manager", "initials": "JD"},
                        {"name": "Sarah Smith", "role": "Lead Architect", "initials": "SS"},
                        {"name": "Raj Vyas", "role": "Site Engineer", "initials": "RV"},
                    ]),
                    json.dumps([
                        {"name": "Foundation Work", "date": "Oct 2024", "completed": True},
                        {"name": "Pillar Casting", "date": "Jan 2025", "completed": True},
                        {"name": "Girder Launching", "date": "June 2025", "completed": False},
                        {"name": "Station Finishing", "date": "March 2026", "completed": False},
                    ]),
                ),
                (
                    "DLF Cyber City - Tower C",
                    "Gurgaon, HR",
                    "Active",
                    "Commercial tower C as part of DLF Cyber City complex. 28 floors with basement parking and retail podium.",
                    68,
                    42,
                    "Aug 2025",
                    "https://images.unsplash.com/photo-1503387762-592dee58c190?auto=format&fit=crop&q=80&w=400",
                    json.dumps([
                        {"name": "Amit Sharma", "role": "Project Manager", "initials": "AS"},
                        {"name": "Priya Nair", "role": "Structural Engineer", "initials": "PN"},
                        {"name": "Vikram Singh", "role": "MEP Lead", "initials": "VS"},
                    ]),
                    json.dumps([
                        {"name": "Excavation & Piling", "date": "Jun 2024", "completed": True},
                        {"name": "Core & Shell", "date": "Dec 2024", "completed": True},
                        {"name": "Façade & MEP", "date": "Apr 2025", "completed": False},
                        {"name": "Handover", "date": "Aug 2025", "completed": False},
                    ]),
                ),
                (
                    "Green Valley Residential",
                    "Bangalore, KA",
                    "Planning",
                    "Residential complex with 4 towers, clubhouse, and landscaped amenities. Pre-sales and approvals in progress.",
                    10,
                    5,
                    "Mar 2027",
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400",
                    json.dumps([
                        {"name": "Kavitha Reddy", "role": "Project Lead", "initials": "KR"},
                        {"name": "Suresh Kumar", "role": "Design Coordinator", "initials": "SK"},
                    ]),
                    json.dumps([
                        {"name": "RERA & Approvals", "date": "Q1 2025", "completed": False},
                        {"name": "Groundbreaking", "date": "Q3 2025", "completed": False},
                        {"name": "Tower 1 Foundation", "date": "Q1 2026", "completed": False},
                        {"name": "Phase 1 Handover", "date": "Mar 2027", "completed": False},
                    ]),
                ),
            ]
            for p in seed_projects:
                await conn.execute(
                    """
                    INSERT INTO projects (name, location, status, description, progress, team_count, deadline, image, team_json, milestones_json)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)
                    """,
                    *p,
                )
            print("Seeded 3 mock projects.")
        
    print("Tables initialized successfully.")
    await close_db()

if __name__ == "__main__":
    asyncio.run(init_tables())
