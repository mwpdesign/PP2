"""
Patient data models with field-level encryption for PHI.
Implements HIPAA-compliant data storage with audit logging.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Boolean, Table, Text, Index, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.sql import func

from app.core.database import Base
from app.core.config import get_settings
from app.core.models import TimestampMixin, AuditMixin


# Many-to-many relationship tables
patient_doctors = Table(
    'patient_doctors',
    Base.metadata,
    Column('patient_id', Integer, ForeignKey('patients.id')),
    Column('doctor_id', Integer, ForeignKey('doctors.id')),
    Column('created_at', DateTime, default=datetime.utcnow),
    Column('updated_at', DateTime, onupdate=datetime.utcnow)
)


patient_facilities = Table(
    'patient_facilities',
    Base.metadata,
    Column('patient_id', Integer, ForeignKey('patients.id')),
    Column('facility_id', Integer, ForeignKey('facilities.id')),
    Column('created_at', DateTime, default=datetime.utcnow),
    Column('updated_at', DateTime, onupdate=datetime.utcnow)
)


class Patient(Base, TimestampMixin, AuditMixin):
    """
    Patient model with encrypted PHI fields.
    Uses field-level encryption for sensitive data.
    """
    __tablename__ = 'patients'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Encrypted PHI Fields (stored as JSON with encryption metadata)
    first_name = Column(JSONB)  # Encrypted
    last_name = Column(JSONB)  # Encrypted
    date_of_birth = Column(JSONB)  # Encrypted
    ssn = Column(JSONB)  # Encrypted
    address = Column(JSONB)  # Encrypted
    phone_number = Column(JSONB)  # Encrypted
    email = Column(JSONB)  # Encrypted
    
    # Insurance Information (Encrypted)
    insurance_id = Column(JSONB)  # Encrypted
    insurance_provider = Column(String)
    insurance_group = Column(String)
    insurance_type = Column(String)
    insurance_verified = Column(Boolean, default=False)
    insurance_verified_at = Column(DateTime)
    insurance_verification_id = Column(String)  # Provider's verification ID
    
    # Insurance Coverage Details (Encrypted)
    coverage_details = Column(JSONB)  # Encrypted
    benefits_info = Column(JSONB)  # Encrypted
    coverage_start_date = Column(DateTime)
    coverage_end_date = Column(DateTime)
    
    # Insurance Verification History
    verification_history = Column(ARRAY(JSONB))  # Array of verification attempts
    last_verification_status = Column(String)
    last_verification_error = Column(String)
    verification_attempts = Column(Integer, default=0)
    
    # Medical Information (Encrypted)
    medical_record_number = Column(JSONB)  # Encrypted
    diagnosis_codes = Column(JSONB)  # Encrypted array of ICD-10 codes
    treatment_notes = Column(JSONB)  # Encrypted
    
    # Consent Management
    consent_status = Column(String)
    consent_given_at = Column(DateTime)
    consent_expires_at = Column(DateTime)
    consent_document_id = Column(Integer, ForeignKey('documents.id'))
    
    # Metadata and Tracking
    status = Column(String, default='active')
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    doctors = relationship(
        'Doctor',
        secondary=patient_doctors,
        backref='patients'
    )
    facilities = relationship(
        'Facility',
        secondary=patient_facilities,
        backref='patients'
    )
    documents = relationship('Document', backref='patient')
    ivr_requests = relationship('IVRRequest', backref='patient')
    orders = relationship('Order', backref='patient')
    audit_logs = relationship('AuditLog', backref='patient')
    insurance_verifications = relationship('InsuranceVerification', backref='patient')
    
    # Search Vector (for full-text search)
    search_vector = Column(Text)

    # Indexes for optimized search
    __table_args__ = (
        # Composite index for territory-based filtering
        Index('ix_patients_territory_org', 'territory_id', 'organization_id'),
        
        # Index for status-based filtering
        Index('ix_patients_status', 'status'),
        
        # Index for insurance verification filtering
        Index('ix_patients_insurance_verified', 'insurance_verified'),
        
        # Index for consent status filtering
        Index('ix_patients_consent_status', 'consent_status'),
        
        # Full text search index
        Index('ix_patients_search_vector', 'search_vector', postgresql_using='gin'),
    )

    def __init__(self, **kwargs):
        """Initialize patient with encrypted fields."""
        super().__init__(**kwargs)
        self.settings = get_settings()


class Document(Base):
    """
    Patient document model for storing encrypted files.
    Handles medical records, consent forms, and other PHI documents.
    """
    __tablename__ = 'documents'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Document Information
    patient_id = Column(Integer, ForeignKey('patients.id'))
    type = Column(String)  # medical_record, consent_form, insurance_card, etc.
    name = Column(String)
    description = Column(Text)
    
    # Storage Information (Encrypted)
    s3_key = Column(JSONB)  # Encrypted
    s3_bucket = Column(String)
    content_type = Column(String)
    size_bytes = Column(Integer)
    
    # Document Metadata
    status = Column(String, default='active')
    version = Column(Integer, default=1)
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Document Security
    encryption_key_id = Column(String)
    encryption_context = Column(JSONB)
    access_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime)
    last_accessed_by = Column(Integer, ForeignKey('users.id'))


class PatientAuditLog(Base):
    """
    Audit logging for patient data access and modifications.
    Tracks all PHI access for HIPAA compliance.
    """
    __tablename__ = 'patient_audit_logs'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Audit Information
    patient_id = Column(Integer, ForeignKey('patients.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    action = Column(String)  # view, create, update, delete, export
    resource_type = Column(String)  # patient, document, order, etc.
    resource_id = Column(Integer)
    
    # Access Details
    ip_address = Column(String)
    user_agent = Column(String)
    accessed_fields = Column(ARRAY(String))
    
    # Request Context
    request_id = Column(String)
    correlation_id = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Additional Context
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    details = Column(JSONB)  # Additional audit context


class PatientConsent(Base):
    """
    Patient consent management and tracking.
    Handles consent forms and permissions.
    """
    __tablename__ = 'patient_consents'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Consent Information
    patient_id = Column(Integer, ForeignKey('patients.id'))
    type = Column(String)  # phi_access, treatment, research, etc.
    status = Column(String)  # active, revoked, expired
    
    # Consent Details
    given_by = Column(String)  # patient, guardian, proxy
    document_id = Column(Integer, ForeignKey('documents.id'))
    scope = Column(ARRAY(String))  # List of consented items
    restrictions = Column(JSONB)  # Any specific restrictions
    
    # Validity Period
    valid_from = Column(DateTime)
    valid_until = Column(DateTime)
    
    # Metadata
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Revocation Information
    revoked_at = Column(DateTime)
    revoked_by = Column(Integer, ForeignKey('users.id'))
    revocation_reason = Column(Text)


class InsuranceVerification(Base):
    """
    Insurance verification tracking model.
    Stores verification history and status.
    """
    __tablename__ = 'insurance_verifications'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Verification Information
    patient_id = Column(Integer, ForeignKey('patients.id'))
    verification_id = Column(String, unique=True)  # Provider's verification ID
    status = Column(String)  # pending, verified, failed, expired
    
    # Insurance Details at Time of Verification
    insurance_id = Column(JSONB)  # Encrypted
    insurance_provider = Column(String)
    insurance_group = Column(String)
    insurance_type = Column(String)
    
    # Verification Results (Encrypted)
    coverage_details = Column(JSONB)  # Encrypted
    benefits_info = Column(JSONB)  # Encrypted
    provider_response = Column(JSONB)  # Encrypted raw response
    
    # Verification Metadata
    verified_at = Column(DateTime)
    expires_at = Column(DateTime)
    error_message = Column(String)
    attempt_count = Column(Integer, default=1)
    
    # Request Context
    request_id = Column(String)
    correlation_id = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)
    
    # Territory and Organization
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    
    # Audit Trail
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class MedicalRecord(Base):
    """
    Medical record model for tracking patient medical history.
    Uses field-level encryption for sensitive data.
    """
    __tablename__ = 'medical_records'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    
    # Record Type and Status
    record_type = Column(String)  # e.g., 'visit', 'procedure', 'test'
    status = Column(String, default='active')
    
    # Encrypted Medical Data
    diagnosis = Column(JSONB)  # Encrypted
    treatment = Column(JSONB)  # Encrypted
    notes = Column(JSONB)  # Encrypted
    provider_notes = Column(JSONB)  # Encrypted
    
    # Dates
    record_date = Column(DateTime)
    follow_up_date = Column(DateTime)
    
    # Version Control
    version = Column(Integer, default=1)
    previous_version_id = Column(Integer, ForeignKey('medical_records.id'))
    
    # Metadata and Tracking
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship('Patient', backref='medical_records')
    conditions = relationship('MedicalCondition', backref='medical_record')
    medications = relationship('Medication', backref='medical_record')
    allergies = relationship('Allergy', backref='medical_record')


class MedicalCondition(Base):
    """
    Medical condition model for tracking diagnoses.
    Uses field-level encryption for sensitive data.
    """
    __tablename__ = 'medical_conditions'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    
    # Condition Data (Encrypted)
    condition_name = Column(JSONB)  # Encrypted
    icd10_code = Column(JSONB)  # Encrypted
    diagnosis_date = Column(JSONB)  # Encrypted
    resolution_date = Column(JSONB)  # Encrypted
    severity = Column(JSONB)  # Encrypted
    notes = Column(JSONB)  # Encrypted
    
    # Status
    status = Column(String, default='active')
    
    # Metadata and Tracking
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class Medication(Base):
    """
    Medication model for tracking prescriptions.
    Uses field-level encryption for sensitive data.
    """
    __tablename__ = 'medications'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    
    # Medication Data (Encrypted)
    medication_name = Column(JSONB)  # Encrypted
    dosage = Column(JSONB)  # Encrypted
    frequency = Column(JSONB)  # Encrypted
    start_date = Column(JSONB)  # Encrypted
    end_date = Column(JSONB)  # Encrypted
    prescribing_doctor = Column(JSONB)  # Encrypted
    pharmacy = Column(JSONB)  # Encrypted
    notes = Column(JSONB)  # Encrypted
    
    # Status
    status = Column(String, default='active')
    
    # Metadata and Tracking
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class Allergy(Base):
    """
    Allergy model for tracking adverse reactions.
    Uses field-level encryption for sensitive data.
    """
    __tablename__ = 'allergies'

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    medical_record_id = Column(Integer, ForeignKey('medical_records.id'), index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    
    # Allergy Data (Encrypted)
    allergen = Column(JSONB)  # Encrypted
    reaction_type = Column(JSONB)  # Encrypted
    severity = Column(JSONB)  # Encrypted
    onset_date = Column(JSONB)  # Encrypted
    notes = Column(JSONB)  # Encrypted
    
    # Status
    status = Column(String, default='active')
    
    # Metadata and Tracking
    territory_id = Column(Integer, ForeignKey('territories.id'))
    organization_id = Column(Integer, ForeignKey('organizations.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow) 