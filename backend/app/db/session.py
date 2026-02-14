import asyncpg
import structlog
from app.config import settings

logger = structlog.get_logger()

_pool = None

async def init_db():
    """Initialize database connection pool."""
    global _pool
    try:
        _pool = await asyncpg.create_pool(
            str(settings.DATABASE_URL),
            min_size=5,
            max_size=20,
        )
        logger.info("Database pool initialized")
    except Exception as e:
        logger.error("Failed to initialize database pool", error=str(e))
        raise

async def close_db():
    """Close database connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        logger.info("Database pool closed")

def get_db_pool():
    """Get database pool instance."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    return _pool
