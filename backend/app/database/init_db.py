import logging
from app.database.session import engine, Base
from app.database.models import User, Project, Repository, Issue, Fix, Report, AIRequest, Session, Log

logger = logging.getLogger(__name__)

async def init_db() -> None:
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
