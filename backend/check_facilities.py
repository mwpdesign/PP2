#!/usr/bin/env python3
"""
Check for facilities in the database.
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.core.config import get_settings

async def check_facilities():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if facilities table exists
        result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name = 'facilities';"))
        table_exists = result.scalar_one_or_none()

        if table_exists:
            print('Facilities table exists')
            # Check for facilities
            result = await session.execute(text('SELECT id, name FROM facilities LIMIT 5;'))
            facilities = result.fetchall()
            if facilities:
                for facility in facilities:
                    print(f'Facility ID: {facility[0]}, Name: {facility[1]}')
            else:
                print('No facilities found')
        else:
            print('Facilities table does not exist')

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_facilities())