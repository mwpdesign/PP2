#!/usr/bin/env python3
"""
Check for existing data in the database.
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.config import get_settings
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.organization import Organization

async def check_data():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check for patients
        result = await session.execute(select(Patient).limit(1))
        patient = result.scalar_one_or_none()
        if patient:
            print(f'Patient ID: {patient.id}')
        else:
            print('No patients found')

        # Check for providers
        result = await session.execute(select(Provider).limit(1))
        provider = result.scalar_one_or_none()
        if provider:
            print(f'Provider ID: {provider.id}')
        else:
            print('No providers found')

        # Check for organizations
        result = await session.execute(select(Organization).limit(1))
        org = result.scalar_one_or_none()
        if org:
            print(f'Organization ID: {org.id}')
            # Use organization as facility for now
            print(f'Facility ID: {org.id}')
        else:
            print('No organizations found')

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_data())