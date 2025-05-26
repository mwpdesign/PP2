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
from app.core.security import get_current_user, verify_territory_access
from app.models.patient import Patient, PatientDocument
from app.schemas.patient import (
    Patient as PatientSchema,
    PatientUpdate,
    PatientSearchResults,
    PatientDocument as PatientDocumentSchema,
    PatientRegistration,
)
from app.services.encryption import encrypt_patient_data, decrypt_patient_data
from app.services.s3_service import S3Service


# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=PatientSearchResults)
async def search_patients(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    query: Optional[str] = None,
    territory_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> PatientSearchResults:
    """Search patients with pagination"""
    try:
        logger.info("Starting patients search query...")
        logger.info(
            "Search parameters - "
            f"query: {query}, territory_id: {territory_id}, "
            f"skip: {skip}, limit: {limit}"
        )
        logger.info(f"Current user: {current_user}")

        # Verify territory access
        if territory_id:
            await verify_territory_access(current_user, territory_id)
        elif current_user.get("primary_territory_id"):
            territory_id = current_user["primary_territory_id"]
            await verify_territory_access(
                current_user,
                territory_id
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Territory ID is required"
            )
        
        # Base query
        query_filter = select(Patient).where(
            Patient.territory_id == territory_id
        )
        logger.debug("Base query created")
        
        # Apply search filter if query provided
        if query:
            logger.debug(f"Applying search filter for query: {query}")
            # Note: We can't do LIKE queries on encrypted fields
            # This is a placeholder - we'll need a different search strategy
            query_filter = query_filter.where(
                Patient.status == 'active'
            )
        
        # Get total count
        logger.debug("Getting total count")
        total = await db.scalar(
            select(func.count()).select_from(query_filter.subquery())
        )
        logger.info(f"Total patients found: {total}")
        
        # Apply pagination
        logger.debug(f"Applying pagination - skip: {skip}, limit: {limit}")
        query_filter = query_filter.offset(skip).limit(limit)
        
        # Execute query
        logger.debug("Executing main query")
        result = await db.execute(query_filter)
        patients = result.scalars().all()
        logger.info(f"Retrieved {len(patients)} patients")
        
        # Decrypt patient data
        logger.debug("Starting patient data decryption")
        decrypted_patients = []
        for patient in patients:
            try:
                decrypted_patient = decrypt_patient_data(patient)
                decrypted_patients.append(decrypted_patient)
            except Exception as decrypt_err:
                logger.error(
                    f"Failed to decrypt patient {patient.id}: {str(decrypt_err)}"
                )
                logger.error(f"Decryption error type: {type(decrypt_err)}")
                raise
        
        logger.info("Patient search completed successfully")
        return PatientSearchResults(
            total=total,
            patients=decrypted_patients
        )
        
    except Exception as e:
        logger.error(f"Patient search failed with error: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {e.__dict__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search patients: {str(e)}"
        )


@router.post("/register", response_model=PatientSchema)
async def register_patient(
    patient_data: PatientRegistration,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> PatientSchema:
    """Register a new patient."""
    try:
        # Encrypt sensitive data
        encrypted_data = encrypt_patient_data(patient_data.dict())
        
        # Create patient instance with encrypted data
        db_patient = Patient(
            external_id=None,  # Will be set by business logic if needed
            encrypted_first_name=encrypted_data['encrypted_first_name'],
            encrypted_last_name=encrypted_data['encrypted_last_name'],
            encrypted_email=encrypted_data['encrypted_email'],
            encrypted_dob=encrypted_data['encrypted_dob'],
            encrypted_phone=encrypted_data.get('encrypted_phone'),
            encrypted_address=encrypted_data.get('encrypted_address'),
            encrypted_ssn=encrypted_data.get('encrypted_ssn'),
            status='active',
            created_by_id=current_user["id"],
            updated_by_id=current_user["id"]
        )
        
        # Add to database
        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)
        
        # Decrypt for response
        decrypted_patient = decrypt_patient_data(db_patient)
        return PatientSchema(**decrypted_patient)
        
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
    current_user: dict = Depends(get_current_user)
) -> Patient:
    """Get patient by ID with decrypted PHI"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Decrypt data for response
    decrypted_patient = decrypt_patient_data(patient)
    return PatientSchema(**decrypted_patient)


@router.put("/{patient_id}", response_model=PatientSchema)
async def update_patient(
    *,
    db: AsyncSession = Depends(get_db),
    patient_id: UUID,
    patient_in: PatientUpdate,
    current_user: dict = Depends(get_current_user)
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
        update_data = patient_in.dict(exclude_unset=True)
        encrypted_data = encrypt_patient_data(update_data)
        
        # Update patient with encrypted data
        for field, value in encrypted_data.items():
            if value is not None:  # Only update provided fields
                setattr(patient, field, value)
        
        # Update audit field
        patient.updated_by_id = current_user["id"]
            
        await db.commit()
        await db.refresh(patient)
        
        # Decrypt data for response
        decrypted_patient = decrypt_patient_data(patient)
        return PatientSchema(**decrypted_patient)
        
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
    current_user: dict = Depends(get_current_user)
):
    """Delete a patient (soft delete by updating status)"""
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    try:
        # Soft delete by updating status
        patient.status = 'deleted'
        patient.updated_by_id = current_user["id"]
        await db.commit()
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
    current_user: dict = Depends(get_current_user),
    s3_service: S3Service = Depends()
):
    """Upload a document for a patient"""
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
            document_metadata=(
                {"display_name": display_name} if display_name else {}
            ),
            created_by_id=current_user.get("id"),
            updated_by_id=current_user.get("id"),
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