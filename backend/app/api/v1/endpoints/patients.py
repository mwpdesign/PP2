"""Patient endpoints for the API."""

from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
    UploadFile,
    File,
    Form,
)
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging
import os
import re
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient, PatientDocument
from app.models.user import User
from app.schemas.patient import (
    Patient as PatientSchema,
    PatientUpdate,
    PatientSearchResults,
    PatientDocument as PatientDocumentSchema,
    PatientRegistration,
)
from app.schemas.token import TokenData
from app.services.s3_service import S3Service
from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()


def get_mock_patient_data(patient_id: str) -> dict:
    """Return mock patient data for development/testing purposes"""
    mock_patients = {
        "P-1234": {
            "id": "P-1234",
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@email.com",
            "phone_number": "(555) 123-4567",
            "date_of_birth": "1980-05-15",
            "address": "123 Main St",
            "city": "Boston",
            "state": "MA",
            "zip_code": "02101",
            "primary_condition": "Chronic wound care",
            "last_visit_date": "2024-03-15",
            "insurance_provider": "Blue Cross Blue Shield",
            "insurance_id": "BCBS123456",
            "insurance_group": "GRP001",
            "insurance_verified": True,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-03-15T00:00:00Z",
            "documents": [
                {
                    "id": "doc-1",
                    "display_name": "Insurance Card Front",
                    "file_name": "insurance_front.jpg",
                    "document_type": "insurance",
                    "created_at": "2024-01-01T00:00:00Z",
                    "file_size": 1024000
                },
                {
                    "id": "doc-2",
                    "display_name": "Medical Records",
                    "file_name": "medical_records.pdf",
                    "document_type": "medical",
                    "created_at": "2024-02-01T00:00:00Z",
                    "file_size": 2048000
                }
            ]
        },
        "P-1235": {
            "id": "P-1235",
            "first_name": "Sarah",
            "last_name": "Johnson",
            "email": "sarah.johnson@email.com",
            "phone_number": "(555) 234-5678",
            "date_of_birth": "1992-08-21",
            "address": "456 Oak Ave",
            "city": "Boston",
            "state": "MA",
            "zip_code": "02102",
            "primary_condition": "Post-surgical wound",
            "last_visit_date": "2024-03-14",
            "insurance_provider": "UnitedHealthcare",
            "insurance_id": "UHC789012",
            "insurance_group": "GRP002",
            "insurance_verified": True,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-03-14T00:00:00Z",
            "documents": []
        },
        "P-1236": {
            "id": "P-1236",
            "first_name": "Michael",
            "last_name": "Brown",
            "email": "michael.brown@email.com",
            "phone_number": "(555) 345-6789",
            "date_of_birth": "1975-12-03",
            "address": "789 Pine St",
            "city": "Boston",
            "state": "MA",
            "zip_code": "02103",
            "primary_condition": "Diabetic ulcer",
            "last_visit_date": "2024-03-10",
            "insurance_provider": "Aetna",
            "insurance_id": "AET345678",
            "insurance_group": "GRP003",
            "insurance_verified": True,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-03-10T00:00:00Z",
            "documents": []
        },
        "P-1237": {
            "id": "P-1237",
            "first_name": "Emily",
            "last_name": "Davis",
            "email": "emily.davis@email.com",
            "phone_number": "(555) 456-7890",
            "date_of_birth": "1988-03-30",
            "address": "321 Elm St",
            "city": "Boston",
            "state": "MA",
            "zip_code": "02104",
            "primary_condition": "Pressure sore",
            "last_visit_date": "2024-02-28",
            "insurance_provider": "Cigna",
            "insurance_id": "CIG901234",
            "insurance_group": "GRP004",
            "insurance_verified": False,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-02-28T00:00:00Z",
            "documents": []
        },
        "P-1238": {
            "id": "P-1238",
            "first_name": "David",
            "last_name": "Wilson",
            "email": "david.wilson@email.com",
            "phone_number": "(555) 567-8901",
            "date_of_birth": "1965-09-12",
            "address": "654 Maple Ave",
            "city": "Boston",
            "state": "MA",
            "zip_code": "02105",
            "primary_condition": "Venous leg ulcer",
            "last_visit_date": "2024-03-18",
            "insurance_provider": "Medicare",
            "insurance_id": "MED567890",
            "insurance_group": "GRP005",
            "insurance_verified": True,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-03-18T00:00:00Z",
            "documents": []
        }
    }

    return mock_patients.get(patient_id)


def is_mock_patient_id(patient_id: str) -> bool:
    """Check if the patient ID is a mock ID (format: P-XXXX)"""
    return bool(re.match(r'^P-\d{4}$', patient_id))


def is_valid_uuid(patient_id: str) -> bool:
    """Check if the patient ID is a valid UUID"""
    try:
        UUID(patient_id)
        return True
    except ValueError:
        return False


@router.get("", response_model=PatientSearchResults)
async def search_patients(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    query: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
) -> PatientSearchResults:
    """Search patients with pagination"""
    try:
        logger.info("Starting patients search query...")

        # Base query - filter by organization and eagerly load documents
        query_filter = (
            select(Patient)
            .options(selectinload(Patient.documents))
            .where(Patient.organization_id == current_user.organization_id)
        )

        # Apply search filter if query provided
        if query:
            query_filter = query_filter.where(Patient.status == "active")

        # Get total count
        count_query = (
            select(func.count())
            .select_from(Patient)
            .where(Patient.organization_id == current_user.organization_id)
        )
        if query:
            count_query = count_query.where(Patient.status == "active")

        total = await db.scalar(count_query)

        # Apply pagination
        query_filter = query_filter.offset(skip).limit(limit)

        # Execute query
        result = await db.execute(query_filter)
        patients = result.scalars().all()

        return PatientSearchResults(total=total or 0, patients=patients)

    except Exception as e:
        logger.error(f"Patient search failed with error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search patients: {str(e)}",
        )


@router.post("/register", response_model=PatientSchema)
async def register_patient(
    patient_data: PatientRegistration,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> PatientSchema:
    """Register a new patient."""
    try:
        # Get default facility and provider for the organization
        # For now, use the first available ones
        facility_query = select(Patient.__table__.c.facility_id).limit(1)
        facility_result = await db.execute(facility_query)
        default_facility_id = facility_result.scalar()

        if not default_facility_id:
            # Use our test facility
            default_facility_id = "11111111-1111-1111-1111-111111111111"

        provider_query = select(Patient.__table__.c.provider_id).limit(1)
        provider_result = await db.execute(provider_query)
        default_provider_id = provider_result.scalar()

        if not default_provider_id:
            # Use our test provider
            default_provider_id = "22222222-2222-2222-2222-222222222222"

        # Create patient instance with organization
        db_patient = Patient(
            **patient_data.dict(),
            status="active",
            patient_metadata={},  # Required field with NOT NULL constraint
            tags=[],  # Required field with NOT NULL constraint
            organization_id=current_user.organization_id,
            facility_id=default_facility_id,
            provider_id=default_provider_id,
            created_by_id=current_user.id,
            updated_by_id=current_user.id,
        )

        # Add to database
        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)

        return PatientSchema.from_orm(db_patient)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,  # Changed from UUID to str to handle both formats
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Get patient by ID with documents - supports both UUID and mock IDs"""

    # Check if it's a mock patient ID
    if is_mock_patient_id(patient_id):
        mock_data = get_mock_patient_data(patient_id)
        if not mock_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mock patient not found"
            )
        return mock_data

    # Validate as UUID for production IDs
    if not is_valid_uuid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid patient ID format. Expected UUID or mock ID "
            "(P-XXXX)"
        )

    # Convert to UUID for database query
    try:
        patient_uuid = UUID(patient_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid UUID format"
        )

    # Use selectinload to eagerly load documents
    query = (
        select(Patient)
        .options(selectinload(Patient.documents))
        .where(Patient.id == patient_uuid)
    )
    result = await db.execute(query)
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient",
        )

    return PatientSchema.from_orm(patient)


@router.put("/{patient_id}", response_model=PatientSchema)
async def update_patient(
    *,
    db: AsyncSession = Depends(get_db),
    patient_id: str,  # Changed from UUID to str
    patient_in: PatientUpdate,
    current_user: TokenData = Depends(get_current_user),
) -> Patient:
    """Update patient"""

    # Mock patients cannot be updated
    if is_mock_patient_id(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mock patients cannot be updated"
        )

    # Validate as UUID
    if not is_valid_uuid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid patient ID format"
        )

    patient_uuid = UUID(patient_id)
    patient = await db.get(Patient, patient_uuid)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this patient",
        )

    # Update patient
    patient_data = patient_in.dict(exclude_unset=True)
    for field, value in patient_data.items():
        setattr(patient, field, value)

    patient.updated_by_id = current_user.id
    await db.commit()
    await db.refresh(patient)

    return PatientSchema.from_orm(patient)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,  # Changed from UUID to str
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Delete patient"""

    # Mock patients cannot be deleted
    if is_mock_patient_id(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mock patients cannot be deleted"
        )

    # Validate as UUID
    if not is_valid_uuid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid patient ID format"
        )

    patient_uuid = UUID(patient_id)
    patient = await db.get(Patient, patient_uuid)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this patient",
        )

    await db.delete(patient)
    await db.commit()


@router.post("/{patient_id}/documents", response_model=PatientDocumentSchema)
async def upload_patient_document(
    patient_id: str,  # Changed from UUID to str
    document: UploadFile = File(...),
    document_type: str = Form(...),
    document_category: str = Form(...),
    display_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Upload patient document"""

    # Mock patients cannot have documents uploaded
    if is_mock_patient_id(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload documents for mock patients"
        )

    # Validate as UUID
    if not is_valid_uuid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid patient ID format"
        )

    patient_uuid = UUID(patient_id)

    # Verify patient exists
    patient = await db.get(Patient, patient_uuid)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload documents for this patient",
                )

    try:
        # Read file content
        file_content = await document.read()

        # Generate S3 key
        s3_key = (
            f"patients/{patient_uuid}/documents/"
            f"{document_category}_{document.filename}"
        )

        # Upload to S3
        s3_service = S3Service()
        await s3_service.upload_file(
            file_content=file_content,
            s3_key=s3_key,
            content_type=document.content_type or "application/octet-stream",
            metadata={
                "patient_id": str(patient_uuid),
                "document_type": document_type,
                "document_category": document_category,
                "uploaded_by": str(current_user.id),
                "organization_id": str(current_user.organization_id),
            }
        )

        # Create document record in database
        db_document = PatientDocument(
            patient_id=patient_uuid,
            document_type=document_type,
            document_category=document_category,
            file_name=document.filename,
            display_name=display_name or document.filename,
            file_path=s3_key,  # Store S3 key in file_path field
            s3_key=s3_key,
            file_size=len(file_content),
            content_type=document.content_type,
            organization_id=current_user.organization_id,
            created_by_id=current_user.id,
            updated_by_id=current_user.id,
        )

        # Save document
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)

        logger.info(f"Document uploaded successfully: {s3_key}")
        return PatientDocumentSchema.from_orm(db_document)

    except Exception as e:
        await db.rollback()
        logger.error(f"Document upload failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/{patient_id}/documents/{document_id}/download")
async def download_patient_document(
    patient_id: str,  # Changed from UUID to str
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Download patient document"""

    # Mock patients have mock document downloads
    if is_mock_patient_id(patient_id):
        # Return a mock download response
        base_url = "https://mock-storage.example.com"
        download_url = (f"{base_url}/patients/{patient_id}/documents/"
                        f"{document_id}")
        return {
            "download_url": download_url,
            "filename": f"mock_document_{document_id}.pdf",
            "content_type": "application/pdf",
            "size": 1024000
        }

    # Validate as UUID
    if not is_valid_uuid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid patient ID format"
        )

    patient_uuid = UUID(patient_id)

    # Verify patient exists and user has access
    patient = await db.get(Patient, patient_uuid)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient",
        )

    # Get document
    document = await db.get(PatientDocument, document_id)
    if not document or document.patient_id != patient_uuid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Check organization access for document
    if document.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document",
        )

    try:
        # Generate presigned URL for download
        s3_service = S3Service()
        download_url = await s3_service.generate_presigned_url(
            s3_key=document.s3_key or document.file_path,
            expiration=3600,  # 1 hour
            operation="get_object"
        )

        return {
            "download_url": download_url,
            "filename": document.file_name,
            "content_type": document.content_type,
            "size": document.file_size
        }

    except Exception as e:
        logger.error(f"Document download failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.get("/debug/user-check")
async def debug_user_check(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Debug endpoint to check if current user exists in database"""
    try:
        # Try raw SQL query
        raw_query = text("SELECT id, email FROM users WHERE id = :user_id")
        raw_result = await db.execute(raw_query, {"user_id": str(current_user.id)})
        raw_user = raw_result.fetchone()

        # Try ORM query
        orm_user = await db.get(User, current_user.id)

        # List all users
        all_users_query = text("SELECT id, email FROM users")
        all_users_result = await db.execute(all_users_query)
        all_users = all_users_result.fetchall()

        # Check current database name
        current_db_query = text("SELECT current_database()")
        current_db_result = await db.execute(current_db_query)
        current_db = current_db_result.scalar()

        # Get database connection info
        db_url = getattr(settings, 'DATABASE_URL', 'Not set')
        db_host = os.getenv('DB_HOST', 'Not set')
        db_name = os.getenv('DB_NAME', 'Not set')

        return {
            "current_user_id": str(current_user.id),
            "raw_sql_result": dict(raw_user) if raw_user else None,
            "orm_result": {"id": str(orm_user.id), "email": orm_user.email} if orm_user else None,
            "all_users": [{"id": str(row[0]), "email": row[1]} for row in all_users],
            "total_users": len(all_users),
            "database_url": db_url,
            "db_host": db_host,
            "db_name": db_name,
            "current_db": current_db
        }
    except Exception as e:
        return {"error": str(e)}


@router.post("/debug/create-doctor")
async def debug_create_doctor(
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint to create doctor user directly through application"""
    from app.models.user import User
    from app.models.rbac import Role
    from app.models.organization import Organization
    from uuid import UUID

    try:
        # Check if doctor already exists
        doctor_id = UUID("43d8ebd3-efe8-4aee-98b5-0a77ba7003e8")
        existing_doctor = await db.get(User, doctor_id)
        if existing_doctor:
            return {"message": "Doctor user already exists", "user_id": str(doctor_id)}

        # Get or create organization
        org_id = UUID("2276e0c1-6a32-470e-b7e7-dcdbb286d76b")
        org = await db.get(Organization, org_id)
        if not org:
            org = Organization(
                id=org_id,
                name="Healthcare Local Development Org",
                description="Mock organization for local development",
                is_active=True,
                status="active"
            )
            db.add(org)
            await db.flush()

        # Get or create Doctor role
        role_query = select(Role).where(Role.name == "Doctor", Role.organization_id == org_id)
        role_result = await db.execute(role_query)
        role = role_result.scalar_one_or_none()
        if not role:
            role = Role(
                name="Doctor",
                description="Doctor role for healthcare providers",
                organization_id=org_id,
                permissions={}
            )
            db.add(role)
            await db.flush()

        # Create doctor user
        doctor = User(
            id=doctor_id,
            username="doctor@healthcare.local",
            email="doctor@healthcare.local",
            first_name="Dr. John",
            last_name="Smith",
            role_id=role.id,
            organization_id=org_id,
            is_active=True,
            is_superuser=False
        )
        doctor.set_password("doctor123")
        db.add(doctor)
        await db.commit()

        return {"message": "Doctor user created successfully", "user_id": str(doctor_id)}
    except Exception as e:
        await db.rollback()
        return {"error": str(e)}
