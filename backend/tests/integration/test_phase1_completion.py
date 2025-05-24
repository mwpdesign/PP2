"""
Phase 1 Completion Integration Tests.
Tests end-to-end functionality of core features.
"""
import pytest
from datetime import date
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.facility import Facility
from app.models.patient import Patient
from app.models.organization import Organization
from app.models.territory import Territory
from app.models.provider import Provider

pytestmark = pytest.mark.asyncio


async def test_facility_patient_relationship(
    async_session: AsyncSession,
    test_organization: Organization,
    test_territory: Territory
):
    """Test facility-patient relationship mapping."""
    # Create test facility
    facility = Facility(
        name="Test Medical Center",
        facility_type="hospital",
        npi="1234567890",
        address_line1="123 Medical Way",
        city="Healthville",
        state="CA",
        zip_code="90210",
        phone="555-123-4567",
        organization_id=test_organization.id,
        territory_id=test_territory.id
    )
    async_session.add(facility)
    await async_session.flush()

    # Create test provider
    provider = Provider(
        name="Dr. Test Provider",
        npi="0987654321",
        tax_id="123456789",
        email="provider@test.com",
        phone="555-987-6543",
        address_line1="456 Doctor St",
        city="Healthville",
        state="CA",
        zip_code="90210",
        created_by_id=uuid4()
    )
    async_session.add(provider)
    await async_session.flush()

    # Create test patient
    patient = Patient(
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1990, 1, 1),
        gender="M",
        ssn="123-45-6789",
        phone="555-555-5555",
        address_line1="789 Patient Lane",
        city="Healthville",
        state="CA",
        zip_code="90210",
        insurance_provider="Test Insurance",
        insurance_id="INS123456",
        created_by_id=uuid4(),
        provider_id=provider.id,
        facility_id=facility.id,
        territory_id=test_territory.id,
        organization_id=test_organization.id
    )
    async_session.add(patient)
    await async_session.flush()

    # Verify relationships
    db_patient = await async_session.get(Patient, patient.id)
    assert db_patient.facility_id == facility.id
    assert db_patient.facility.name == "Test Medical Center"

    # Test reverse relationship
    db_facility = await async_session.get(Facility, facility.id)
    assert len(db_facility.patients) == 1
    assert db_facility.patients[0].id == patient.id


async def test_patient_registration_api(
    async_client: AsyncClient,
    test_organization: Organization,
    test_territory: Territory,
    test_facility: Facility,
    test_provider: Provider
):
    """Test patient registration through API."""
    patient_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1985-06-15",
        "gender": "F",
        "ssn": "987-65-4321",
        "phone": "555-777-8888",
        "address_line1": "321 Patient Ave",
        "city": "Healthville",
        "state": "CA",
        "zip_code": "90210",
        "insurance_provider": "Health Plus",
        "insurance_id": "INS789012",
        "provider_id": str(test_provider.id),
        "facility_id": str(test_facility.id),
        "territory_id": str(test_territory.id),
        "organization_id": str(test_organization.id)
    }

    response = await async_client.post(
        f"{settings.API_V1_STR}/patients/",
        json=patient_data
    )
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["facility_id"] == str(test_facility.id)


async def test_patient_document_upload(
    async_client: AsyncClient,
    test_patient: Patient
):
    """Test patient document upload functionality."""
    import io
    
    # Create a test file
    file_content = io.BytesIO(b"Test medical document content")
    files = {
        "file": ("test_document.pdf", file_content, "application/pdf")
    }
    
    form_data = {
        "document_type": "medical_record",
        "document_category": "test_category"
    }

    response = await async_client.post(
        f"{settings.API_V1_STR}/patients/{test_patient.id}/documents",
        files=files,
        data=form_data
    )
    assert response.status_code == 201
    data = response.json()
    assert data["document_type"] == "medical_record"


async def test_patient_facility_query(
    async_client: AsyncClient,
    test_patient: Patient,
    test_facility: Facility
):
    """Test querying patient with facility information."""
    response = await async_client.get(
        f"{settings.API_V1_STR}/patients/{test_patient.id}"
    )
    assert response.status_code == 200
    data = response.json()
    
    # Verify facility information is included
    assert data["facility_id"] == str(test_facility.id)
    assert "facility" in data
    assert data["facility"]["name"] == test_facility.name 