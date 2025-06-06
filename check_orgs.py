#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the backend directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, 'backend')
sys.path.insert(0, backend_path)

from app.core.database import async_session_factory  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.facility import Facility  # noqa: E402
from app.models.provider import Provider  # noqa: E402
from sqlalchemy import select  # noqa: E402


async def check_data():
    async with async_session_factory() as session:
        # Check organizations
        result = await session.execute(select(Organization))
        orgs = result.scalars().all()
        print('Available organizations:')
        for org in orgs:
            print(f'  - {org.name} ({org.id})')

        # Check facilities
        result = await session.execute(select(Facility))
        facilities = result.scalars().all()
        print('\nAvailable facilities:')
        for facility in facilities:
            print(f'  - {facility.name} ({facility.id})')

        # Check providers
        result = await session.execute(select(Provider))
        providers = result.scalars().all()
        print('\nAvailable providers:')
        for provider in providers:
            print(f'  - {provider.name} ({provider.id})')


if __name__ == "__main__":
    asyncio.run(check_data())
