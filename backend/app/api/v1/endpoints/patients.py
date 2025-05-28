"""Patient endpoints for the API."""
from typing import Optional
from fastapi import (
    APIRouter, Depends, HTTPException, Query, status,
    UploadFile, File, Form
)
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient, PatientDocument
from app.schemas.patient import (
    Patient as PatientSchema,
    PatientUpdate,
    PatientSearchResults,
    PatientDocument as PatientDocumentSchema,
    PatientRegistration,
)
from app.schemas.token import TokenData

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=PatientSearchResults)
async def search_patients(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    query: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> PatientSearchResults:
    """Search patients with pagination"""
    try:
        logger.info("Starting patients search query...")
        
        # Base query - filter by organization
        query_filter = select(Patient).where(
            Patient.organization_id == current_user.organization_id
        )

        # Apply search filter if query provided
        if query:
            query_filter = query_filter.where(
                Patient.status == 'active'
            )

        # Get total count
        count_query = select(func.count()).select_from(Patient).where(
            Patient.organization_id == current_user.organization_id
        )
        if query:
            count_query = count_query.where(Patient.status == 'active')

        total = await db.scalar(count_query)

        # Apply pagination
        query_filter = query_filter.offset(skip).limit(limit)

        # Execute query
        result = await db.execute(query_filter)
        patients = result.scalars().all()

        return PatientSearchResults(
            total=total or 0,
            patients=patients
        )

    except Exception as e:
        logger.error(f"Patient search failed with error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search patients: {str(e)}"
        )


@router.post("/register", response_model=PatientSchema)
async def register_patient(
    patient_data: PatientRegistration,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> PatientSchema:
    """Register a new patient."""
    try:
        # Create patient instance with organization
        db_patient = Patient(
            **patient_data.dict(),
            status='active',
            organization_id=current_user.organization_id,
            created_by_id=current_user.id,
            updated_by_id=current_user.id
        )

        # Add to database
        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)

        return PatientSchema.from_orm(db_patient)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{patient_id}", response_model=PatientSchema)
async def get_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> Patient:
    """Get patient by ID"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )

    return PatientSchema.from_orm(patient)


@router.put("/{patient_id}", response_model=PatientSchema)
async def update_patient(
    *,
    db: AsyncSession = Depends(get_db),
    patient_id: UUID,
    patient_in: PatientUpdate,
    current_user: TokenData = Depends(get_current_user)
) -> Patient:
    """Update patient"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this patient"
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
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """Delete patient"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this patient"
        )

    await db.delete(patient)
    await db.commit()


@router.post("/{patient_id}/documents", response_model=PatientDocumentSchema)
async def upload_patient_document(
    patient_id: UUID,
    document: UploadFile = File(...),
    document_type: str = Form(...),
    document_category: str = Form(...),
    display_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """Upload patient document"""
    # Verify patient exists
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Check organization access
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload documents for this patient"
        )

    # Create document
    db_document = PatientDocument(
        patient_id=patient_id,
        document_type=document_type,
        document_category=document_category,
        file_name=document.filename,
        display_name=display_name or document.filename,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        updated_by_id=current_user.id
    )

    # Save document
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)

    return PatientDocumentSchema.from_orm(db_document)