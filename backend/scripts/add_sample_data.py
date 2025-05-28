"""Script to add sample patient data."""
import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select

from app.core.database import get_db
from app.core.encryption import encrypt_field
from app.models.patient import Patient
from app.models.user import User
from app.models.organization import Organization
from app.models.facility import Facility
from app.models.provider import Provider


def encrypt_to_bytes(value: str) -> bytes:
    """Encrypt a string value to bytes."""
    encrypted = encrypt_field(value)
    if isinstance(encrypted, str):
        return encrypted.encode('utf-8')
    return encrypted


async def add_sample_data():
    """Add sample patient data."""
    async for db in get_db():
        try:
            # First check if we have an organization, if not create one
            org_result = await db.execute(select(Organization).limit(1))
            organization = org_result.scalar_one_or_none()
            
            if not organization:
                organization = Organization(
                    name="Demo Healthcare",
                    description="Demo Healthcare Organization",
                    settings={},
                    security_policy="Default Security Policy",
                    is_active=True,
                    status="active",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(organization)
                await db.commit()
                await db.refresh(organization)

            # Create a user if it doesn't exist
            user_query = select(User).filter(User.email == "admin@demo.com")
            user_result = await db.execute(user_query)
            user = user_result.scalar_one_or_none()

            if not user:
                user = User(
                    organization_id=organization.id,
                    email="admin@demo.com",
                    encrypted_password="password",  # In production, use proper hashing
                    first_name="Admin",
                    last_name="User",
                    is_active=True,
                    is_superuser=True,
                    mfa_enabled=False,
                    force_password_change=False,
                    failed_login_attempts=0,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

            # Create a facility if it doesn't exist
            facility_result = await db.execute(
                select(Facility).filter(Facility.npi == "1234567890")
            )
            facility = facility_result.scalar_one_or_none()

            if not facility:
                facility = Facility(
                    id=uuid.uuid4(),
                    name="Demo Clinic",
                    facility_type="Clinic",
                    npi="1234567890",
                    address_line1="123 Main St",
                    address_line2=None,
                    city="Demo City",
                    state="CA",
                    zip_code="12345",
                    phone="555-123-4567",
                    fax="555-123-4568",
                    email="clinic@demo.com",
                    organization_id=organization.id,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(facility)
                await db.commit()
                await db.refresh(facility)

            # Create a provider if it doesn't exist
            provider_result = await db.execute(
                select(Provider).filter(Provider.npi == "9876543210")
            )
            provider = provider_result.scalar_one_or_none()

            if not provider:
                provider = Provider(
                    id=uuid.uuid4(),
                    organization_id=organization.id,
                    name="Dr. Demo",
                    npi="9876543210",
                    tax_id="123456789",
                    email="doctor@demo.com",
                    phone="555-987-6543",
                    fax="555-987-6544",
                    address_line1="456 Medical Dr",
                    address_line2=None,
                    city="Demo City",
                    state="CA",
                    zip_code="12345",
                    specialty="General Practice",
                    accepting_new_patients=True,
                    insurance_networks="All major networks",
                    office_hours="9am-5pm M-F",
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    created_by_id=user.id
                )
                db.add(provider)
                await db.commit()
                await db.refresh(provider)

            # Create a patient if it doesn't exist
            patient_result = await db.execute(
                select(Patient).limit(1)
            )
            patient = patient_result.scalar_one_or_none()

            if not patient:
                patient = Patient(
                    id=uuid.uuid4(),
                    encrypted_first_name=encrypt_to_bytes("John"),
                    encrypted_last_name=encrypt_to_bytes("Doe"),
                    encrypted_dob=encrypt_to_bytes("1980-01-01"),
                    encrypted_phone=encrypt_to_bytes("555-111-2222"),
                    encrypted_email=encrypt_to_bytes("patient@demo.com"),
                    encrypted_address=encrypt_to_bytes(
                        "789 Patient St, Demo City, CA 12345"
                    ),
                    status="active",
                    patient_metadata={},
                    tags=[],
                    created_by_id=user.id,
                    updated_by_id=user.id,
                    organization_id=organization.id,
                    facility_id=facility.id,
                    provider_id=provider.id
                )
                db.add(patient)
                await db.commit()
                await db.refresh(patient)

            print("Sample data added successfully!")

        except Exception as e:
            print(f"Error adding sample data: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(add_sample_data()) 