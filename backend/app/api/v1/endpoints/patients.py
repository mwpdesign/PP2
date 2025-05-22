from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import (
    Patient as PatientSchema,
    PatientCreate,
    PatientUpdate,
    PatientSearchResults,
)
from app.services.encryption import encrypt_patient_data, decrypt_patient_data

router = APIRouter()


@router.post("", response_model=PatientSchema, status_code=status.HTTP_201_CREATED)
async def create_patient(
    *,
    db: AsyncSession = Depends(get_db),
    patient_in: PatientCreate,
    current_user: User = Depends(get_current_user)
) -> Patient:
    """Create new patient with encrypted PHI"""
    try:
        # Encrypt sensitive data
        encrypted_data = encrypt_patient_data(patient_in.dict())
        
        # Create patient object
        db_patient = Patient(
            **encrypted_data,
            created_by_id=current_user.id
        )
        
        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)
        
        # Decrypt data for response
        return decrypt_patient_data(db_patient)
        
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