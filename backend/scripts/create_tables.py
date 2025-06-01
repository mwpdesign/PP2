"""Script to create database tables."""

from app.core.database import Base, engine
import asyncio
from app.models import *  # Import all models


async def create_tables():
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully")


if __name__ == "__main__":
    asyncio.run(create_tables())
