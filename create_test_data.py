#!/usr/bin/env python3
"""
Create test facility and provider records for patient registration testing.
"""

import asyncio
import sys
import os
from uuid import UUID
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.database import async_session_factory
from app.models.facility import Facility
from app.models.provider import Provider
from app.models.organization import Organization
from app.models.user import User
from sqlalchemy import select


async def create_test_data():
    """Create test facility and provider if they don't exist."""
    async with async_session_factory() as session:
        try:
            # Get the first organization
            org_result = await session.execute(select(Organization))
            organization = org_result.scalars().first()

            if not organization:
                print("❌ No organization found")
                return

            print(f"✅ Using organization: {organization.name} ({organization.id})")

            # Get a test user for created_by
            user_result = await session.execute(
                select(User).where(User.email == "doctor@healthcare.local")
            )
            user = user_result.scalar_one_or_none()

            if not user:
                print("❌ Test user not found")
                return

            print(f"✅ Found user: {user.email} ({user.id})")

            # Create test facility with specific ID
            facility_id = UUID("11111111-1111-1111-1111-111111111111")
            facility_result = await session.execute(
                select(Facility).where(Facility.id == facility_id)
            )
            facility = facility_result.scalar_one_or_none()

            if not facility:
                facility = Facility(
                    id=facility_id,
                    name="Test Medical Center",
                    facility_type="hospital",
                    npi="1234567890",
                    address_line1="123 Test Medical Drive",
                    address_line2="",
                    city="Test City",
                    state="CA",
                    zip_code="90210",
                    phone="555-123-4567",
                    fax="555-123-4568",
                    email="info@testmedical.com",
                    organization_id=organization.id,
                    is_active=True,
                )
                session.add(facility)
                print(f"✅ Created test facility: {facility.name} ({facility.id})")
            else:
                print(f"✅ Test facility already exists: {facility.name} ({facility.id})")

            # Create test provider with specific ID
            provider_id = UUID("22222222-2222-2222-2222-222222222222")
            provider_result = await session.execute(
                select(Provider).where(Provider.id == provider_id)
            )
            provider = provider_result.scalar_one_or_none()

            if not provider:
                provider = Provider(
                    id=provider_id,
                    name="Dr. Test Provider",
                    npi="0987654321",
                    tax_id="123456789",
                    email="provider@testmedical.com",
                    phone="555-987-6543",
                    address_line1="456 Provider St",
                    city="Test City",
                    state="CA",
                    zip_code="90210",
                    organization_id=organization.id,
                    created_by_id=user.id,
                )
                session.add(provider)
                print(f"✅ Created test provider: {provider.name} ({provider.id})")
            else:
                print(f"✅ Test provider already exists: {provider.name} ({provider.id})")

            await session.commit()
            print("✅ Test data creation completed successfully")

        except Exception as e:
            await session.rollback()
            print(f"❌ Error creating test data: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(create_test_data())