"""Seed script for patient data with HIPAA-compliant encryption."""
import asyncio
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import init_db, async_session_factory
from app.core.encryption import encrypt_field
from app.models import (
    Patient,
    Organization,
    Facility,
    Provider,
    User
)


async def get_first_entity(db: AsyncSession, model_class):
    """Get the first entity of a given model type."""
    result = await db.execute(model_class.__table__.select().limit(1))
    return result.scalar_one_or_none()


async def create_seed_patients():
    """Create sample patients for development."""
    # Initialize database first
    if not await init_db():
        raise RuntimeError("Failed to initialize database")

    if not async_session_factory:
        raise RuntimeError("Database session factory not initialized")

    async with async_session_factory() as db:
        # Get required related entities
        organization = await get_first_entity(db, Organization)
        if not organization:
            raise ValueError(
                "No organization found. Please run organization setup first."
            )

        facility = await get_first_entity(db, Facility)
        if not facility:
            raise ValueError(
                "No facility found. Please run facility setup first."
            )

        provider = await get_first_entity(db, Provider)
        if not provider:
            raise ValueError(
                "No provider found. Please run provider setup first."
            )

        user = await get_first_entity(db, User)
        if not user:
            raise ValueError(
                "No user found. Please run user setup first."
            )

        # Create sample patients
        patients = [
            {
                "id": uuid4(),
                "external_id": "PAT001",
                "encrypted_first_name": encrypt_field("John"),
                "encrypted_last_name": encrypt_field("Smith"),
                "encrypted_dob": encrypt_field("1990-01-01"),
                "encrypted_ssn": encrypt_field("123-45-6789"),
                "encrypted_phone": encrypt_field("(555) 123-4567"),
                "encrypted_email": encrypt_field("john.smith@example.com"),
                "encrypted_address": encrypt_field(
                    "123 Main St, City, ST 12345"
                ),
                "status": "active",
                "organization_id": organization.id,
                "facility_id": facility.id,
                "provider_id": provider.id,
                "created_by_id": user.id
            },
            {
                "id": uuid4(),
                "external_id": "PAT002",
                "encrypted_first_name": encrypt_field("Jane"),
                "encrypted_last_name": encrypt_field("Doe"),
                "encrypted_dob": encrypt_field("1985-06-15"),
                "encrypted_ssn": encrypt_field("987-65-4321"),
                "encrypted_phone": encrypt_field("(555) 987-6543"),
                "encrypted_email": encrypt_field("jane.doe@example.com"),
                "encrypted_address": encrypt_field(
                    "456 Oak St, Town, ST 67890"
                ),
                "status": "active",
                "organization_id": organization.id,
                "facility_id": facility.id,
                "provider_id": provider.id,
                "created_by_id": user.id
            },
            {
                "id": uuid4(),
                "external_id": "PAT003",
                "encrypted_first_name": encrypt_field("Michael"),
                "encrypted_last_name": encrypt_field("Brown"),
                "encrypted_dob": encrypt_field("1978-11-30"),
                "encrypted_ssn": encrypt_field("456-78-9012"),
                "encrypted_phone": encrypt_field("(555) 234-5678"),
                "encrypted_email": encrypt_field("michael.brown@example.com"),
                "encrypted_address": encrypt_field(
                    "789 Pine Rd, Village, ST 34567"
                ),
                "status": "active",
                "organization_id": organization.id,
                "facility_id": facility.id,
                "provider_id": provider.id,
                "created_by_id": user.id
            },
            {
                "id": uuid4(),
                "external_id": "PAT004",
                "encrypted_first_name": encrypt_field("Emily"),
                "encrypted_last_name": encrypt_field("Davis"),
                "encrypted_dob": encrypt_field("1995-04-18"),
                "encrypted_ssn": encrypt_field("345-67-8901"),
                "encrypted_phone": encrypt_field("(555) 345-6789"),
                "encrypted_email": encrypt_field("emily.davis@example.com"),
                "encrypted_address": encrypt_field(
                    "321 Elm St, County, ST 89012"
                ),
                "status": "active",
                "organization_id": organization.id,
                "facility_id": facility.id,
                "provider_id": provider.id,
                "created_by_id": user.id
            },
            {
                "id": uuid4(),
                "external_id": "PAT005",
                "encrypted_first_name": encrypt_field("William"),
                "encrypted_last_name": encrypt_field("Wilson"),
                "encrypted_dob": encrypt_field("1982-09-25"),
                "encrypted_ssn": encrypt_field("234-56-7890"),
                "encrypted_phone": encrypt_field("(555) 456-7890"),
                "encrypted_email": encrypt_field("william.wilson@example.com"),
                "encrypted_address": encrypt_field(
                    "654 Maple Dr, Borough, ST 45678"
                ),
                "status": "active",
                "organization_id": organization.id,
                "facility_id": facility.id,
                "provider_id": provider.id,
                "created_by_id": user.id
            }
        ]

        for patient_data in patients:
            patient = Patient(**patient_data)
            db.add(patient)

        await db.commit()
        print(f"✅ Created {len(patients)} seed patients")


if __name__ == "__main__":
    asyncio.run(create_seed_patients())