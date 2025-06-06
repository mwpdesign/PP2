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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
            # Get the test organization
            org_result = await session.execute(
                select(Organization).where(Organization.name == "Test Healthcare Organization")
            )
            organization = org_result.scalar_one_or_none()

            if not organization:
                print("❌ Test organization not found")
                return

            print(f"✅ Found organization: {organization.name} ({organization.id})")

            # Get a test user for created_by
            user_result = await session.execute(
                select(User).where(User.email == "doctor@healthcare.local")
            )
            user = user_result.scalar_one_or_none()

            if not user:
                print("❌ Test user not found")
                return

            print(f"✅ Found user: {user.email} ({user.id})")

            # Check if test facility exists
            facility_id = UUID("11111111-1111-1111-1111-111111111111")
            facility_result = await session.execute(
                select(Facility).where(Facility.id == facility_id)
            )
            facility = facility_result.scalar_one_or_none()

            if not facility:
                # Create test facility
                facility = Facility(
                    id=facility_id,
                    name="Test Medical Center",
                    facility_type="hospital",
                    npi="1234567890",
                    address_line1="123 Test Medical Drive",
                    address_line2="Suite 100",
                    city="Test City",
                    state="CA",
                    zip_code="90210",
                    phone="555-123-4567",
                    fax="555-123-4568",
                    email="facility@test.com",
                    organization_id=organization.id,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                session.add(facility)
                print(f"✅ Created test facility: {facility.name}")
            else:
                print(f"✅ Test facility already exists: {facility.name}")

            # Check if test provider exists
            provider_id = UUID("22222222-2222-2222-2222-222222222222")
            provider_result = await session.execute(
                select(Provider).where(Provider.id == provider_id)
            )
            provider = provider_result.scalar_one_or_none()

            if not provider:
                # Create test provider
                provider = Provider(
                    id=provider_id,
                    organization_id=organization.id,
                    name="Dr. Test Provider",
                    npi="9876543210",
                    tax_id="123456789",
                    email="provider@test.com",
                    phone="555-987-6543",
                    fax="555-987-6544",
                    address_line1="456 Provider Street",
                    address_line2="",
                    city="Test City",
                    state="CA",
                    zip_code="90210",
                    specialty="Internal Medicine",
                    accepting_new_patients=True,
                    insurance_networks='["Medicare", "Medicaid", "Blue Cross"]',
                    office_hours='{"monday": "9:00-17:00", "tuesday": "9:00-17:00"}',
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    created_by_id=user.id,
                )
                session.add(provider)
                print(f"✅ Created test provider: {provider.name}")
            else:
                print(f"✅ Test provider already exists: {provider.name}")

            # Commit the changes
            await session.commit()
            print("✅ Test facility and provider setup complete!")

        except Exception as e:
            await session.rollback()
            print(f"❌ Error creating test data: {str(e)}")
            raise


if __name__ == "__main__":
    asyncio.run(create_test_data())