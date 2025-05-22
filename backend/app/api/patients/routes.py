"""
Patient API routes with HIPAA-compliant data handling.
Implements secure patient data management with encryption.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import (
    APIRouter, Depends, HTTPException, status,
    Request, UploadFile, File, Query
)
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import get_settings
from app.api.patients.models import (
    Patient, Document, PatientConsent, PatientAuditLog,
    InsuranceVerification, InsuranceVerificationStatus,
    MedicalRecord, MedicalCondition, Medication, Allergy
)
from app.api.patients.schemas import (
    PatientCreate, PatientUpdate, PatientResponse,
    DocumentCreate, DocumentResponse, DocumentUpdate,
    ConsentCreate, ConsentResponse, ConsentUpdate,
    AuditLogResponse,
    InsuranceVerificationRequest, InsuranceVerificationResponse,
    InsuranceStatusResponse, InsuranceUpdateRequest,
    InsuranceVerificationHistoryResponse,
    MedicalRecordResponse, MedicalRecordCreate, MedicalRecordUpdate,
    MedicalConditionResponse, MedicalHistorySearch,
    MedicationResponse, AllergyResponse,
    MedicalConditionCreate, MedicationCreate, AllergyCreate,
    PatientSearchRequest, PatientSearchResponse,
    AdvancedSearchFilters, BulkSearchRequest
)
from app.api.patients.encryption_service import PatientEncryptionService
from app.services.s3_service import S3Service
from app.services.insurance_verification import InsuranceVerificationService
from app.services.medical_history_service import MedicalHistoryService
from app.services.patient_search_service import PatientSearchService

router = APIRouter()
settings = get_settings()


async def log_phi_access(
    db: Session,
    patient_id: int,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: int,
    request: Request,
    accessed_fields: List[str]
) -> None:
    """Log PHI access for HIPAA compliance."""
    audit_log = PatientAuditLog(
        patient_id=patient_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=request.client.host,
        user_agent=request.headers.get('user-agent', ''),
        accessed_fields=accessed_fields,
        request_id=request.headers.get('x-request-id', ''),
        correlation_id=request.headers.get('x-correlation-id', ''),
        details={
            'method': request.method,
            'path': str(request.url),
            'timestamp': datetime.utcnow().isoformat()
        }
    )
    db.add(audit_log)
    db.commit()


@router.post(
    "/patients/",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_patient(
    patient: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends()
):
    """Create a new patient record with encrypted PHI."""
    # Encrypt patient data
    patient_dict = patient.dict()
    encrypted_data = await encryption_service.encrypt_patient_data(
        patient_dict,
        {
            'user_id': current_user.id,
            'territory_id': patient.territory_id
        }
    )
    
    # Create patient record
    db_patient = Patient(**encrypted_data)
    db_patient.created_by = current_user.id
    db_patient.updated_by = current_user.id
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    # Create consent record
    consent = PatientConsent(
        patient_id=db_patient.id,
        type=patient.consent_type,
        given_by=patient.consent_given_by,
        scope=patient.consent_scope,
        restrictions=patient.consent_restrictions,
        valid_from=datetime.utcnow(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(consent)
    db.commit()
    
    # Log PHI access
    await log_phi_access(
        db,
        db_patient.id,
        current_user.id,
        'create',
        'patient',
        db_patient.id,
        request,
        list(encryption_service.encrypted_fields)
    )
    
    # Decrypt for response
    decrypted_data = await encryption_service.decrypt_patient_data(
        db_patient.__dict__
    )
    return PatientResponse(**decrypted_data)


@router.get(
    "/patients/{patient_id}",
    response_model=PatientResponse
)
async def get_patient(
    patient_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends()
):
    """Get patient record with decrypted PHI."""
    # Get patient record
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify access permissions
    if not current_user.has_permission('read_patient', patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )
    
    # Log PHI access
    await log_phi_access(
        db,
        patient_id,
        current_user.id,
        'read',
        'patient',
        patient_id,
        request,
        list(encryption_service.encrypted_fields)
    )
    
    # Decrypt patient data
    decrypted_data = await encryption_service.decrypt_patient_data(
        patient.__dict__
    )
    return PatientResponse(**decrypted_data)


@router.put(
    "/patients/{patient_id}",
    response_model=PatientResponse
)
async def update_patient(
    patient_id: int,
    patient: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends()
):
    """Update patient record with encrypted PHI."""
    # Get patient record
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify access permissions
    if not current_user.has_permission('update_patient', db_patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this patient"
        )
    
    # Encrypt updated fields
    update_data = patient.dict(exclude_unset=True)
    if any(field in encryption_service.encrypted_fields for field in update_data):
        encrypted_data = await encryption_service.encrypt_patient_data(
            update_data,
            {
                'user_id': current_user.id,
                'territory_id': db_patient.territory_id
            }
        )
        for key, value in encrypted_data.items():
            setattr(db_patient, key, value)
    
    # Update non-encrypted fields
    for key, value in update_data.items():
        if key not in encryption_service.encrypted_fields and value is not None:
            setattr(db_patient, key, value)
    
    db_patient.updated_by = current_user.id
    db_patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_patient)
    
    # Log PHI access
    await log_phi_access(
        db,
        patient_id,
        current_user.id,
        'update',
        'patient',
        patient_id,
        request,
        list(update_data.keys())
    )
    
    # Decrypt for response
    decrypted_data = await encryption_service.decrypt_patient_data(
        db_patient.__dict__
    )
    return PatientResponse(**decrypted_data)


@router.get(
    "/patients/",
    response_model=List[PatientResponse]
)
async def search_patients(
    query: Optional[str] = None,
    territory_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 10,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends()
):
    """Search patients with territory-based access control."""
    # Verify access permissions
    if territory_id and not current_user.has_permission(
        'read_patient',
        territory_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this territory"
        )
    
    # Build base query
    patients_query = db.query(Patient)
    
    # Apply territory filter
    if territory_id:
        patients_query = patients_query.filter(Patient.territory_id == territory_id)
    else:
        # Filter by territories user has access to
        accessible_territories = current_user.get_accessible_territories()
        patients_query = patients_query.filter(
            Patient.territory_id.in_(accessible_territories)
        )
    
    # Apply search filter
    if query:
        patients_query = patients_query.filter(
            or_(
                Patient.search_vector.match(query),
                Patient.medical_record_number.ilike(f"%{query}%")
            )
        )
    
    # Apply pagination
    patients = patients_query.offset(skip).limit(limit).all()
    
    # Log PHI access
    for patient in patients:
        await log_phi_access(
            db,
            patient.id,
            current_user.id,
            'search',
            'patient',
            patient.id,
            request,
            list(encryption_service.encrypted_fields)
        )
    
    # Decrypt patient data
    decrypted_patients = []
    for patient in patients:
        decrypted_data = await encryption_service.decrypt_patient_data(
            patient.__dict__
        )
        decrypted_patients.append(PatientResponse(**decrypted_data))
    
    return decrypted_patients


@router.post(
    "/patients/{patient_id}/documents/",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    request: Request,
    patient_id: int,
    document: DocumentCreate,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    s3_service: S3Service = Depends()
):
    """Upload encrypted patient document to S3."""
    # Verify patient exists and access permissions
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    if not current_user.has_permission('create_document', patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload documents for this patient"
        )
    
    try:
        # Read and validate file content
        file_content = await file.read()
        if len(file_content) > settings.max_document_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds maximum allowed"
            )
        
        # Generate unique S3 key
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{file.filename}"
        s3_key = f"patients/{patient_id}/documents/{document.type}/{filename}"
        
        # Prepare encryption context
        encryption_context = {
            'user_id': str(current_user.id),
            'territory_id': str(patient.territory_id),
            'document_type': document.type,
            'patient_id': str(patient_id),
            'content_type': file.content_type
        }
        
        # Encrypt file content
        encrypted_data = await encryption_service.encrypt_field(
            file_content,
            encryption_context
        )
        
        # Upload to S3 with metadata
        s3_response = await s3_service.upload_file(
            encrypted_data['encrypted_data'],
            s3_key,
            file.content_type,
            metadata={
                'document_type': document.type,
                'original_filename': file.filename,
                'encryption_key_id': encrypted_data['key_id'],
                'uploaded_by': str(current_user.id),
                'patient_id': str(patient_id)
            }
        )
        
        # Create document record
        db_document = Document(
            patient_id=patient_id,
            type=document.type,
            name=document.name,
            description=document.description,
            content_type=file.content_type,
            s3_key=s3_key,
            s3_bucket=settings.aws_s3_bucket,
            size_bytes=len(file_content),
            territory_id=patient.territory_id,
            organization_id=patient.organization_id,
            encryption_key_id=encrypted_data['key_id'],
            encryption_context=encryption_context,
            created_by=current_user.id,
            updated_by=current_user.id
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'upload',
            'document',
            db_document.id,
            request,
            ['file_content', 'document_type', 'name']
        )
        
        return DocumentResponse.from_orm(db_document)
        
    except Exception as e:
        # Ensure cleanup in case of failure
        if 's3_key' in locals():
            try:
                await s3_service.delete_file(s3_key)
            except:
                pass  # Best effort cleanup
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/{patient_id}/documents/{document_id}",
    response_model=DocumentResponse
)
async def get_document(
    patient_id: int,
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    s3_service: S3Service = Depends()
):
    """Get patient document with decryption."""
    # Verify document exists and access permissions
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.patient_id == patient_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if not current_user.has_permission('read_document', document.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )
    
    try:
        # Download encrypted file from S3
        s3_response = await s3_service.download_file(
            document.s3_key,
            current_user.id,
            document.territory_id
        )
        
        # Update access count
        document.access_count += 1
        document.last_accessed_at = datetime.utcnow()
        document.last_accessed_by = current_user.id
        db.commit()
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'read',
            'document',
            document_id,
            request,
            ['file_content']
        )
        
        # Generate temporary access URL
        presigned_url = await s3_service.generate_presigned_url(
            document.s3_key,
            expiration=3600  # 1 hour
        )
        
        # Return document metadata with access URL
        response = DocumentResponse.from_orm(document)
        response.access_url = presigned_url
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete(
    "/patients/{patient_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_document(
    patient_id: int,
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    s3_service: S3Service = Depends()
):
    """Delete patient document and remove from S3."""
    # Verify document exists and access permissions
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.patient_id == patient_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if not current_user.has_permission('delete_document', document.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this document"
        )
    
    try:
        # Delete from S3
        await s3_service.delete_file(document.s3_key)
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'delete',
            'document',
            document_id,
            request,
            ['file_content']
        )
        
        # Delete document record
        db.delete(document)
        db.commit()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/patients/{patient_id}/verify-insurance",
    response_model=InsuranceVerificationResponse
)
async def verify_patient_insurance(
    patient_id: int,
    verification: InsuranceVerificationRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    insurance_service: InsuranceVerificationService = Depends()
):
    """Verify patient insurance eligibility."""
    # Get patient record
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify access permissions
    if not current_user.has_permission('verify_insurance', patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to verify insurance for this patient"
        )
    
    try:
        # Verify insurance
        verification_result = await insurance_service.verify_insurance(
            verification.dict(),
            current_user.id,
            patient.territory_id
        )
        
        # Create verification record
        db_verification = InsuranceVerification(
            patient_id=patient_id,
            verification_id=verification_result['verification_id'],
            status=verification_result['status'],
            insurance_id=verification.insurance_id,
            insurance_provider=verification.insurance_provider,
            insurance_group=verification.insurance_group,
            insurance_type=verification.insurance_type,
            coverage_details=verification_result['coverage_details'],
            benefits_info=verification_result['benefits_info'],
            provider_response=verification_result['provider_response'],
            verified_at=datetime.fromisoformat(verification_result['verified_at']),
            territory_id=patient.territory_id,
            organization_id=patient.organization_id,
            created_by=current_user.id,
            updated_by=current_user.id,
            request_id=request.headers.get('x-request-id', ''),
            correlation_id=request.headers.get('x-correlation-id', ''),
            ip_address=request.client.host,
            user_agent=request.headers.get('user-agent', '')
        )
        db.add(db_verification)
        
        # Update patient record
        patient.insurance_verified = (
            verification_result['status'] == InsuranceVerificationStatus.VERIFIED
        )
        patient.insurance_verified_at = datetime.fromisoformat(
            verification_result['verified_at']
        )
        patient.insurance_verification_id = verification_result['verification_id']
        patient.coverage_details = verification_result['coverage_details']
        patient.benefits_info = verification_result['benefits_info']
        patient.last_verification_status = verification_result['status']
        patient.verification_attempts += 1
        
        if 'error' in verification_result:
            patient.last_verification_error = verification_result['error']
            db_verification.error_message = verification_result['error']
        
        # Add to verification history
        if patient.verification_history is None:
            patient.verification_history = []
        patient.verification_history.append({
            'verification_id': verification_result['verification_id'],
            'status': verification_result['status'],
            'verified_at': verification_result['verified_at'],
            'error': verification_result.get('error')
        })
        
        db.commit()
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'verify_insurance',
            'insurance_verification',
            db_verification.id,
            request,
            ['insurance_id', 'coverage_details', 'benefits_info']
        )
        
        return InsuranceVerificationResponse(**verification_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/{patient_id}/insurance-status",
    response_model=InsuranceStatusResponse
)
async def get_insurance_status(
    patient_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get patient's current insurance status."""
    # Get patient record
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify access permissions
    if not current_user.has_permission('read_insurance', patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access insurance information"
        )
    
    # Log PHI access
    await log_phi_access(
        db,
        patient_id,
        current_user.id,
        'read',
        'insurance_status',
        patient_id,
        request,
        ['insurance_status']
    )
    
    return InsuranceStatusResponse(
        insurance_verified=patient.insurance_verified,
        insurance_verified_at=patient.insurance_verified_at,
        insurance_verification_id=patient.insurance_verification_id,
        coverage_start_date=patient.coverage_start_date,
        coverage_end_date=patient.coverage_end_date,
        last_verification_status=patient.last_verification_status,
        last_verification_error=patient.last_verification_error,
        verification_attempts=patient.verification_attempts
    )


@router.put(
    "/patients/{patient_id}/insurance-info",
    response_model=PatientResponse
)
async def update_insurance_info(
    patient_id: int,
    insurance_update: InsuranceUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends()
):
    """Update patient's insurance information."""
    # Get patient record
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify access permissions
    if not current_user.has_permission('update_insurance', patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update insurance information"
        )
    
    try:
        # Update insurance fields
        update_data = insurance_update.dict(exclude_unset=True)
        if 'insurance_id' in update_data:
            # Encrypt insurance ID
            encrypted_id = await encryption_service.encrypt_field(
                update_data['insurance_id'],
                {
                    'user_id': current_user.id,
                    'territory_id': patient.territory_id,
                    'field': 'insurance_id'
                }
            )
            patient.insurance_id = encrypted_id
        
        # Update non-encrypted fields
        for field in ['insurance_provider', 'insurance_group', 'insurance_type']:
            if field in update_data:
                setattr(patient, field, update_data[field])
        
        # Reset verification status
        patient.insurance_verified = False
        patient.insurance_verified_at = None
        patient.insurance_verification_id = None
        patient.last_verification_status = None
        
        patient.updated_by = current_user.id
        db.commit()
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'update',
            'insurance_info',
            patient_id,
            request,
            list(update_data.keys())
        )
        
        # Decrypt for response
        decrypted_data = await encryption_service.decrypt_patient_data(
            patient.__dict__
        )
        return PatientResponse(**decrypted_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/{patient_id}/insurance-history",
    response_model=List[InsuranceVerificationHistoryResponse]
)
async def get_insurance_history(
    request: Request,
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """Get patient's insurance verification history."""
    # Get patient record
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify access permissions
    if not current_user.has_permission('read_insurance', patient.territory_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access insurance information"
        )
    
    # Get verification history
    verifications = db.query(InsuranceVerification).filter(
        InsuranceVerification.patient_id == patient_id
    ).order_by(
        InsuranceVerification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Log PHI access
    await log_phi_access(
        db,
        patient_id,
        current_user.id,
        'read',
        'insurance_history',
        patient_id,
        request,
        ['verification_history']
    )
    
    return verifications


@router.post(
    "/patients/{patient_id}/medical-records/",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_medical_record(
    patient_id: int,
    record: MedicalRecordCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Create a new medical record with encryption."""
    try:
        # Set patient ID from path
        record.patient_id = patient_id
        
        # Create medical record
        response = await medical_history_service.create_medical_record(record)
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'create',
            'medical_record',
            response.id,
            request,
            ['diagnosis', 'treatment', 'notes', 'provider_notes']
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/{patient_id}/medical-records/{record_id}",
    response_model=MedicalRecordResponse
)
async def get_medical_record(
    patient_id: int,
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Get a medical record with decryption."""
    try:
        response = await medical_history_service.get_medical_record(record_id)
        
        # Verify record belongs to patient
        if response.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found"
            )
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'read',
            'medical_record',
            record_id,
            request,
            ['diagnosis', 'treatment', 'notes', 'provider_notes']
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put(
    "/patients/{patient_id}/medical-records/{record_id}",
    response_model=MedicalRecordResponse
)
async def update_medical_record(
    patient_id: int,
    record_id: int,
    record: MedicalRecordUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Update a medical record with encryption."""
    try:
        response = await medical_history_service.update_medical_record(
            record_id,
            record
        )
        
        # Verify record belongs to patient
        if response.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found"
            )
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'update',
            'medical_record',
            record_id,
            request,
            ['diagnosis', 'treatment', 'notes', 'provider_notes']
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/{patient_id}/medical-records/",
    response_model=List[MedicalRecordResponse]
)
async def search_medical_records(
    patient_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends(),
    record_type: Optional[RecordType] = None,
    status: Optional[RecordStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 10
):
    """Search medical records with filters."""
    try:
        # Create search parameters
        search = MedicalHistorySearch(
            patient_id=patient_id,
            record_type=record_type,
            status=status,
            start_date=start_date,
            end_date=end_date,
            include_archived=include_archived,
            skip=skip,
            limit=limit
        )
        
        response = await medical_history_service.search_medical_history(search)
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'search',
            'medical_record',
            None,
            request,
            ['diagnosis', 'treatment', 'notes', 'provider_notes']
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/patients/{patient_id}/medical-records/{record_id}/conditions/",
    response_model=MedicalConditionResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_medical_condition(
    patient_id: int,
    record_id: int,
    condition: MedicalConditionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Create a new medical condition with encryption."""
    try:
        # Set IDs from path
        condition.patient_id = patient_id
        condition.medical_record_id = record_id
        
        response = await medical_history_service.create_medical_condition(
            condition
        )
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'create',
            'medical_condition',
            response.id,
            request,
            ['condition_name', 'icd10_code', 'severity', 'notes']
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/patients/{patient_id}/medical-records/{record_id}/medications/",
    response_model=MedicationResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_medication(
    patient_id: int,
    record_id: int,
    medication: MedicationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Create a new medication with encryption."""
    try:
        # Set IDs from path
        medication.patient_id = patient_id
        medication.medical_record_id = record_id
        
        response = await medical_history_service.create_medication(medication)
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'create',
            'medication',
            response.id,
            request,
            [
                'medication_name', 'dosage', 'frequency',
                'prescribing_doctor', 'pharmacy', 'notes'
            ]
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/patients/{patient_id}/medical-records/{record_id}/allergies/",
    response_model=AllergyResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_allergy(
    patient_id: int,
    record_id: int,
    allergy: AllergyCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Create a new allergy with encryption."""
    try:
        # Set IDs from path
        allergy.patient_id = patient_id
        allergy.medical_record_id = record_id
        
        response = await medical_history_service.create_allergy(allergy)
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'create',
            'allergy',
            response.id,
            request,
            ['allergen', 'reaction_type', 'severity', 'notes']
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/{patient_id}/medical-history",
    response_model=Dict[str, List[Any]]
)
async def get_patient_medical_history(
    patient_id: int,
    request: Request,
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    medical_history_service: MedicalHistoryService = Depends()
):
    """Get complete medical history for a patient."""
    try:
        response = await medical_history_service.get_patient_medical_history(
            patient_id,
            include_archived
        )
        
        # Log PHI access
        await log_phi_access(
            db,
            patient_id,
            current_user.id,
            'read',
            'medical_history',
            None,
            request,
            [
                'diagnosis', 'treatment', 'notes', 'provider_notes',
                'condition_name', 'icd10_code', 'severity',
                'medication_name', 'dosage', 'frequency',
                'prescribing_doctor', 'pharmacy',
                'allergen', 'reaction_type'
            ]
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/search",
    response_model=PatientSearchResponse
)
async def search_patients(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    search_service: PatientSearchService = Depends(),
    query: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    date_of_birth: Optional[datetime] = Query(None),
    medical_record_number: Optional[str] = Query(None),
    insurance_id: Optional[str] = Query(None),
    insurance_provider: Optional[str] = Query(None),
    phone_number: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    territory_id: Optional[int] = Query(None),
    organization_id: Optional[int] = Query(None),
    provider_id: Optional[int] = Query(None),
    facility_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    insurance_verified: Optional[bool] = Query(None),
    sort_by: str = Query('created_at'),
    sort_order: str = Query('desc'),
    skip: int = Query(0),
    limit: int = Query(10)
):
    """
    Search patients with HIPAA-compliant filtering and access control.
    """
    try:
        search_request = PatientSearchRequest(
            query=query,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            medical_record_number=medical_record_number,
            insurance_id=insurance_id,
            insurance_provider=insurance_provider,
            phone_number=phone_number,
            email=email,
            territory_id=territory_id,
            organization_id=organization_id,
            provider_id=provider_id,
            facility_id=facility_id,
            status=status,
            insurance_verified=insurance_verified,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )
        return await search_service.search_patients(request, search_request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/patients/search/advanced",
    response_model=PatientSearchResponse
)
async def advanced_search_patients(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    search_service: PatientSearchService = Depends(),
    # Basic search parameters
    query: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    medical_record_number: Optional[str] = Query(None),
    territory_id: Optional[int] = Query(None),
    # Advanced filters
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    diagnosis_codes: Optional[List[str]] = Query(None),
    medication_codes: Optional[List[str]] = Query(None),
    allergy_types: Optional[List[str]] = Query(None),
    insurance_types: Optional[List[str]] = Query(None),
    consent_status: Optional[List[str]] = Query(None),
    provider_specialties: Optional[List[str]] = Query(None),
    facility_types: Optional[List[str]] = Query(None),
    visit_date_start: Optional[datetime] = Query(None),
    visit_date_end: Optional[datetime] = Query(None),
    last_visit_within_days: Optional[int] = Query(None),
    # Pagination and sorting
    sort_by: str = Query('created_at'),
    sort_order: str = Query('desc'),
    skip: int = Query(0),
    limit: int = Query(10)
):
    """
    Advanced patient search with additional filters.
    """
    try:
        search_request = PatientSearchRequest(
            query=query,
            first_name=first_name,
            last_name=last_name,
            medical_record_number=medical_record_number,
            territory_id=territory_id,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )
        
        advanced_filters = AdvancedSearchFilters(
            age_range=(age_min, age_max) if age_min and age_max else None,
            diagnosis_codes=diagnosis_codes,
            medication_codes=medication_codes,
            allergy_types=allergy_types,
            insurance_types=insurance_types,
            consent_status=consent_status,
            provider_specialties=provider_specialties,
            facility_types=facility_types,
            visit_dates=(visit_date_start, visit_date_end)
                if visit_date_start and visit_date_end else None,
            last_visit_within_days=last_visit_within_days
        )
        
        return await search_service.advanced_search(
            request,
            search_request,
            advanced_filters
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post(
    "/patients/search/bulk",
    response_model=Dict[str, List[PatientResponse]]
)
async def bulk_search_patients(
    request: Request,
    bulk_request: BulkSearchRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    encryption_service: PatientEncryptionService = Depends(),
    search_service: PatientSearchService = Depends()
):
    """
    Bulk search for multiple patient search terms.
    """
    try:
        return await search_service.bulk_search(request, bulk_request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 