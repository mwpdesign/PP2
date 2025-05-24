from typing import Optional
from fastapi import (
    APIRouter, Depends, HTTPException, Query, status,
    UploadFile, File, Form
)
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient, SecondaryInsurance, PatientDocument
from app.models.user import User
from app.schemas.patient import (
    Patient as PatientSchema,
    PatientCreate,
    PatientUpdate,
    PatientSearchResults,
    SecondaryInsuranceCreate,
    SecondaryInsurance as SecondaryInsuranceSchema,
    PatientDocument as PatientDocumentSchema,
    PatientRegistration,
)
from app.services.encryption import encrypt_patient_data, decrypt_patient_data
from app.services.s3_service import S3Service

router = APIRouter()

@router.post("/register", response_model=PatientSchema)
async def register_patient(
    patient_data: PatientRegistration,
    db: AsyncSession = Depends(get_db)
) -> PatientSchema:
    """Register a new patient."""
    try:
        # Parse date string to datetime
        date_of_birth = datetime.strptime(patient_data.date_of_birth, '%Y-%m-%d')
        
        # Create patient instance
        db_patient = Patient(
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            email=patient_data.email,
            date_of_birth=date_of_birth,
            insurance_provider=patient_data.insurance_provider,
            insurance_id=patient_data.insurance_id
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


@router.post("/{patient_id}/documents", response_model=PatientDocumentSchema)
async def upload_patient_document(
    patient_id: UUID,
    document: UploadFile = File(...),
    document_type: str = Form(...),
    document_category: str = Form(...),
    display_name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    s3_service: S3Service = Depends()
):
    """Upload additional patient document."""
    try:
        # Get patient to verify existence and access
        patient = await db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Upload file
        doc_path = await s3_service.upload_file(
            document,
            f"patients/{patient_id}/{document_category}/{document.filename}"
        )
        
        # Create document record
        db_doc = PatientDocument(
            patient_id=patient_id,
            document_type=document_type,
            file_name=document.filename,
            file_path=doc_path["file_path"],
            document_category=document_category,
            metadata={"display_name": display_name} if display_name else {},
            created_by=current_user.id,
            territory_id=patient.territory_id
        )
        
        db.add(db_doc)
        await db.commit()
        await db.refresh(db_doc)
        
        return db_doc
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{patient_id}/secondary-insurance", response_model=SecondaryInsuranceSchema)
async def create_secondary_insurance(
    patient_id: UUID,
    insurance_in: SecondaryInsuranceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create secondary insurance record."""
    try:
        # Get patient to verify existence and access
        patient = await db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Create secondary insurance
        db_insurance = SecondaryInsurance(
            **insurance_in.dict(),
            patient_id=patient_id,
            created_by=current_user.id,
            territory_id=patient.territory_id
        )
        
        db.add(db_insurance)
        await db.commit()
        await db.refresh(db_insurance)
        
        return db_insurance
        
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
    current_user: User = Depends(get_current_user)
) -> Patient:
    """Get patient by ID with decrypted PHI"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Decrypt data for response
    return decrypt_patient_data(patient)


@router.put("/{patient_id}", response_model=PatientSchema)
async def update_patient(
    *,
    db: AsyncSession = Depends(get_db),
    patient_id: UUID,
    patient_in: PatientUpdate,
    current_user: User = Depends(get_current_user)
) -> Patient:
    """Update patient information"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    try:
        # Encrypt updated data
        encrypted_data = encrypt_patient_data(patient_in.dict(exclude_unset=True))
        
        # Update patient
        for field, value in encrypted_data.items():
            setattr(patient, field, value)
            
        await db.commit()
        await db.refresh(patient)
        
        # Decrypt data for response
        return decrypt_patient_data(patient)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete patient"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    await db.delete(patient)
    await db.commit()


@router.get("", response_model=PatientSearchResults)
async def search_patients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    query: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> PatientSearchResults:
    """Search patients with pagination"""
    # Base query
    query_filter = select(Patient)
    
    # Apply search filter if query provided
    if query:
        search_filter = or_(
            Patient.first_name.ilike(f"%{query}%"),
            Patient.last_name.ilike(f"%{query}%"),
            Patient.email.ilike(f"%{query}%")
        )
        query_filter = query_filter.where(search_filter)
    
    # Get total count
    total = await db.scalar(
        select(func.count()).select_from(query_filter.subquery())
    )
    
    # Apply pagination
    query_filter = query_filter.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query_filter)
    patients = result.scalars().all()
    
    # Decrypt patient data
    decrypted_patients = [decrypt_patient_data(p) for p in patients]
    
    return PatientSearchResults(
        total=total,
        patients=decrypted_patients
    ) 