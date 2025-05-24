# type: ignore
"""Database initialization and session management."""

from typing import AsyncGenerator
import os
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

# Get database configuration from environment
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "healthcare_ivr")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

# Create database URL
DATABASE_URL = (
    f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Create async database engine
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
    echo=True,
)


# Create base class for models
class Base(DeclarativeBase):
    pass


# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session.
    
    Yields:
        AsyncSession that will be automatically closed.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database with required tables."""
    # Import all models here to ensure they are registered
    from app.models.organization import Organization  # noqa
    from app.models.user import User  # noqa
    from app.models.rbac import Role, Permission  # noqa
    from app.models.territory import Territory  # noqa
    from app.models.sensitive_data import SensitiveUserData  # noqa
    from app.models.patient import Patient  # noqa

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
