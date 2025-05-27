# type: ignore
"""Database configuration with optional connection."""
import os
import logging
from typing import AsyncGenerator, Optional
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

logger = logging.getLogger(__name__)


# Load environment variables
load_dotenv()


# Get database configuration from environment
def get_async_url():
    """Get async database URL."""
    return os.getenv(
        "DATABASE_URL",
        (
            f"postgresql+asyncpg://"
            f"{os.getenv('DB_USER', 'postgres')}:"
            f"{os.getenv('DB_PASSWORD', 'postgres')}@"
            f"{os.getenv('DB_HOST', 'localhost')}:"
            f"{os.getenv('DB_PORT', '5432')}/"
            f"{os.getenv('DB_NAME', 'healthcare_ivr')}"
        )
    )


def get_sync_url():
    """Get sync database URL."""
    return os.getenv(
        "DATABASE_URL",
        (
            f"postgresql://"
            f"{os.getenv('DB_USER', 'postgres')}:"
            f"{os.getenv('DB_PASSWORD', 'postgres')}@"
            f"{os.getenv('DB_HOST', 'localhost')}:"
            f"{os.getenv('DB_PORT', '5432')}/"
            f"{os.getenv('DB_NAME', 'healthcare_ivr')}"
        )
    ).replace("+asyncpg", "")


# These are kept for backward compatibility but not used in URL construction
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "healthcare_ivr")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    model_config = ConfigDict(extra='ignore')  # Allow extra fields

    # Make all fields optional with defaults
    database_required: bool = True  # Enable database by default
    database_url: Optional[str] = get_async_url()
    db_echo: bool = False


# Global settings instance
db_settings = DatabaseSettings()


# Create base class for models
class Base(DeclarativeBase):
    pass


# Global engines and session factories
sync_engine = create_engine(
    get_sync_url(),
    echo=db_settings.db_echo,
    future=True
)

sync_session_factory = sessionmaker(
    sync_engine,
    expire_on_commit=False
)

# Initialize async engine and session factory as None
engine = None
async_session_factory = None


def init_async_engine():
    """Initialize async engine and session factory."""
    global engine, async_session_factory
    if engine is None:
        engine = create_async_engine(
            get_async_url(),
            echo=db_settings.db_echo,
            future=True
        )
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )


async def init_db() -> bool:
    """Initialize database connection if required.

    Returns:
        bool: True if database connection successful or not required
    """
    global engine, async_session_factory

    # Early return if database not required
    if not db_settings.database_required:
        logger.info(
            "Database connection disabled - running in no-database mode"
        )
        return True

    try:
        # Initialize async engine if needed
        init_async_engine()

        # Test connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.commit()

        # Initialize tables only if database is required and engine exists
        if engine is not None:
            # Import models here to avoid circular imports
            from app.models import (  # noqa
                organization, user, rbac, territory, sensitive_data,
                patient, facility, order, product
            )
            from app.services.shipping_types import (  # noqa
                ShippingServiceType, TrackingStatus, ShippingProvider,
                ShippingRate, ShippingLabel, TrackingInfo
            )
            from app.analytics.models import (  # noqa
                DimTime, DimGeography, DimOrganization,
                DimPatientDemographics, DimPatientSatisfaction,
                DimVerificationPerformance,
                FactIVRCall, FactOrder
            )

            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            logger.info("Database tables initialized successfully")

        logger.info(f"Database connection successful using {db_settings.database_url}")
        return True

    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        if db_settings.database_required:
            return False
        logger.warning("Continuing without database connection")
        return True


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session.

    Yields:
        AsyncSession: Database session
    """
    if not async_session_factory:
        await init_db()
        if not async_session_factory:
            raise RuntimeError("Database session factory not initialized")

    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


# Utility function to check database availability
def is_database_available() -> bool:
    """Check if database is available and configured."""
    return bool(db_settings.database_required and async_session_factory)


# Create async session factory only if database is required
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
) if engine else None
