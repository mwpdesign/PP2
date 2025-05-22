"""
Patient data schemas for request/response validation.
Handles data validation and serialization with encryption.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, EmailStr, constr, validator
from enum import Enum


class ConsentType(str, Enum):
    """Types of patient consent."""
    PHI_ACCESS = 'phi_access'
    TREATMENT = 'treatment'
    RESEARCH = 'research'
    MARKETING = 'marketing'


class ConsentStatus(str, Enum):
    """Status of patient consent."""
    ACTIVE = 'active'
    REVOKED = 'revoked'
    EXPIRED = 'expired'


class InsuranceType(str, Enum):
    """Types of insurance coverage."""
    PRIVATE = 'private'
    MEDICARE = 'medicare'
    MEDICAID = 'medicaid'
    TRICARE = 'tricare'
    SELF_PAY = 'self_pay'


class PatientStatus(str, Enum):
    """Patient record status."""
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    ARCHIVED = 'archived'


class DocumentType(str, Enum):
    """Types of patient documents."""
    MEDICAL_RECORD = 'medical_record'
    CONSENT_FORM = 'consent_form'
    INSURANCE_CARD = 'insurance_card'
    LAB_RESULT = 'lab_result'
    PRESCRIPTION = 'prescription'


class InsuranceVerificationStatus(str, Enum):
    """Status of insurance verification."""
    PENDING = 'pending'
    VERIFIED = 'verified'
    FAILED = 'failed'
    EXPIRED = 'expired'


class PatientBase(BaseModel):
    """Base schema for patient data."""
    first_name: str
    last_name: str
    date_of_birth: datetime
    ssn: str = constr(regex=r'^\d{3}-?\d{2}-?\d{4}$')
    address: str
    phone_number: str = constr(regex=r'^\+?1?\d{9,15}$')
    email: EmailStr
    
    insurance_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_group: Optional[str] = None
    insurance_type: Optional[InsuranceType] = None
    
    status: PatientStatus = PatientStatus.ACTIVE
    territory_id: int
    organization_id: int

    @validator('ssn')
    def format_ssn(cls, v):
        """Format SSN to standard format."""
        if '-' not in v:
            return f"{v[:3]}-{v[3:5]}-{v[5:]}"
        return v

    @validator('phone_number')
    def format_phone(cls, v):
        """Format phone number to E.164 format."""
        v = ''.join(filter(str.isdigit, v))
        if len(v) == 10:
            v = f"+1{v}"
        elif len(v) == 11 and v[0] == '1':
            v = f"+{v}"
        return v


class PatientCreate(PatientBase):
    """Schema for creating a new patient."""
    consent_type: ConsentType
    consent_given_by: str
    consent_scope: List[str]
    consent_restrictions: Optional[Dict[str, Any]] = None


class PatientUpdate(BaseModel):
    """Schema for updating patient data."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    
    insurance_provider: Optional[str] = None
    insurance_group: Optional[str] = None
    insurance_type: Optional[InsuranceType] = None
    
    status: Optional[PatientStatus] = None
    territory_id: Optional[int] = None


class PatientResponse(PatientBase):
    """Schema for patient response data."""
    id: int
    medical_record_number: str
    insurance_verified: bool
    insurance_verified_at: Optional[datetime] = None
    insurance_verification_id: Optional[str] = None
    coverage_details: Optional[Dict] = None
    benefits_info: Optional[Dict] = None
    coverage_start_date: Optional[datetime] = None
    coverage_end_date: Optional[datetime] = None
    last_verification_status: Optional[str] = None
    verification_attempts: int = 0
    consent_status: ConsentStatus
    consent_given_at: datetime
    consent_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class DocumentBase(BaseModel):
    """Base schema for patient documents."""
    patient_id: int
    type: DocumentType
    name: str
    description: Optional[str] = None
    content_type: str


class DocumentCreate(BaseModel):
    """Schema for creating a new document."""
    type: DocumentType
    name: str
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata."""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class DocumentResponse(BaseModel):
    """Schema for document response data."""
    id: int
    patient_id: int
    type: DocumentType
    name: str
    description: Optional[str] = None
    content_type: str
    size_bytes: int
    version: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    access_count: int
    last_accessed_at: Optional[datetime] = None
    access_url: Optional[str] = None

    class Config:
        orm_mode = True


class ConsentBase(BaseModel):
    """Base schema for patient consent."""
    patient_id: int
    type: ConsentType
    given_by: str
    scope: List[str]
    restrictions: Optional[Dict[str, Any]] = None
    valid_from: datetime
    valid_until: Optional[datetime] = None


class ConsentCreate(ConsentBase):
    """Schema for creating a new consent record."""
    document_id: Optional[int] = None


class ConsentUpdate(BaseModel):
    """Schema for updating consent data."""
    status: ConsentStatus
    revocation_reason: Optional[str] = None


class ConsentResponse(ConsentBase):
    """Schema for consent response data."""
    id: int
    status: ConsentStatus
    document_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[int] = None
    revocation_reason: Optional[str] = None

    class Config:
        orm_mode = True


class AuditLogResponse(BaseModel):
    """Schema for audit log response data."""
    id: int
    patient_id: int
    user_id: int
    action: str
    resource_type: str
    resource_id: int
    ip_address: str
    user_agent: str
    accessed_fields: List[str]
    request_id: str
    correlation_id: str
    created_at: datetime
    details: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


class InsuranceVerificationRequest(BaseModel):
    """Schema for insurance verification request."""
    insurance_id: str
    insurance_provider: str
    insurance_group: Optional[str] = None
    insurance_type: InsuranceType
    verification_type: str = 'eligibility'


class InsuranceVerificationResponse(BaseModel):
    """Schema for insurance verification response."""
    status: InsuranceVerificationStatus
    verified_at: datetime
    verification_id: Optional[str] = None
    coverage_details: Optional[Dict] = None
    benefits_info: Optional[Dict] = None
    error: Optional[str] = None
    error_details: Optional[str] = None

    class Config:
        orm_mode = True


class InsuranceUpdateRequest(BaseModel):
    """Schema for updating insurance information."""
    insurance_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_group: Optional[str] = None
    insurance_type: Optional[InsuranceType] = None


class InsuranceStatusResponse(BaseModel):
    """Schema for insurance status response."""
    insurance_verified: bool
    insurance_verified_at: Optional[datetime] = None
    insurance_verification_id: Optional[str] = None
    coverage_start_date: Optional[datetime] = None
    coverage_end_date: Optional[datetime] = None
    last_verification_status: Optional[str] = None
    last_verification_error: Optional[str] = None
    verification_attempts: int

    class Config:
        orm_mode = True


class InsuranceVerificationHistoryResponse(BaseModel):
    """Schema for verification history response."""
    id: int
    verification_id: str
    status: InsuranceVerificationStatus
    verified_at: datetime
    expires_at: Optional[datetime] = None
    error_message: Optional[str] = None
    attempt_count: int
    created_at: datetime

    class Config:
        orm_mode = True


class MedicalRecordType(str, Enum):
    """Types of medical records."""
    CONDITION = 'condition'
    MEDICATION = 'medication'
    ALLERGY = 'allergy'
    PROCEDURE = 'procedure'
    VITAL = 'vital'
    LAB_RESULT = 'lab_result'
    IMMUNIZATION = 'immunization'
    NOTE = 'note'


class MedicalRecordStatus(str, Enum):
    """Status of medical records."""
    ACTIVE = 'active'
    RESOLVED = 'resolved'
    INACTIVE = 'inactive'
    ARCHIVED = 'archived'


class ConditionType(str, Enum):
    """Types of medical conditions."""
    CHRONIC = 'chronic'
    ACUTE = 'acute'
    RECURRING = 'recurring'
    TEMPORARY = 'temporary'


class MedicationType(str, Enum):
    """Types of medications."""
    PRESCRIPTION = 'prescription'
    OTC = 'otc'
    SUPPLEMENT = 'supplement'


class AllergyType(str, Enum):
    """Types of allergies."""
    MEDICATION = 'medication'
    FOOD = 'food'
    ENVIRONMENTAL = 'environmental'


class AllergySeverity(str, Enum):
    """Severity levels for allergies."""
    MILD = 'mild'
    MODERATE = 'moderate'
    SEVERE = 'severe'
    LIFE_THREATENING = 'life_threatening'


class MedicalRecordBase(BaseModel):
    """Base schema for medical records."""
    type: MedicalRecordType
    category: str
    status: MedicalRecordStatus
    details: Dict[str, Any]
    notes: Optional[str] = None
    diagnosis_codes: Optional[List[str]] = None
    provider_id: Optional[int] = None
    facility_id: Optional[int] = None
    encounter_id: Optional[int] = None


class MedicalRecordCreate(MedicalRecordBase):
    """Schema for creating a new medical record."""
    pass


class MedicalRecordUpdate(BaseModel):
    """Schema for updating medical record."""
    status: Optional[MedicalRecordStatus] = None
    details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    diagnosis_codes: Optional[List[str]] = None


class MedicalRecordResponse(MedicalRecordBase):
    """Schema for medical record response."""
    id: int
    patient_id: int
    version: int
    previous_version_id: Optional[int] = None
    necessity_verified: bool
    insurance_validated: bool
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class MedicalConditionBase(BaseModel):
    """Base schema for medical conditions."""
    condition_code: str
    condition_type: ConditionType
    status: MedicalRecordStatus
    diagnosis: Dict[str, Any]
    treatment_plan: Optional[Dict[str, Any]] = None
    prognosis: Optional[Dict[str, Any]] = None
    onset_date: datetime
    diagnosis_date: datetime
    resolved_date: Optional[datetime] = None
    diagnosed_by: int
    treating_provider: Optional[int] = None


class MedicalConditionCreate(MedicalConditionBase):
    """Schema for creating a new medical condition."""
    pass


class MedicalConditionUpdate(BaseModel):
    """Schema for updating medical condition."""
    status: Optional[MedicalRecordStatus] = None
    treatment_plan: Optional[Dict[str, Any]] = None
    prognosis: Optional[Dict[str, Any]] = None
    resolved_date: Optional[datetime] = None
    treating_provider: Optional[int] = None


class MedicalConditionResponse(MedicalConditionBase):
    """Schema for medical condition response."""
    id: int
    patient_id: int
    record_id: int
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class MedicationBase(BaseModel):
    """Base schema for medications."""
    medication_code: str
    medication_type: MedicationType
    status: MedicalRecordStatus
    dosage: Dict[str, Any]
    instructions: Dict[str, Any]
    pharmacy_notes: Optional[Dict[str, Any]] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    last_filled_date: Optional[datetime] = None
    next_refill_date: Optional[datetime] = None
    prescribed_by: int
    pharmacy_id: Optional[int] = None


class MedicationCreate(MedicationBase):
    """Schema for creating a new medication."""
    pass


class MedicationUpdate(BaseModel):
    """Schema for updating medication."""
    status: Optional[MedicalRecordStatus] = None
    dosage: Optional[Dict[str, Any]] = None
    instructions: Optional[Dict[str, Any]] = None
    end_date: Optional[datetime] = None
    last_filled_date: Optional[datetime] = None
    next_refill_date: Optional[datetime] = None


class MedicationResponse(MedicationBase):
    """Schema for medication response."""
    id: int
    patient_id: int
    record_id: int
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class AllergyBase(BaseModel):
    """Base schema for allergies."""
    allergy_type: AllergyType
    severity: AllergySeverity
    status: MedicalRecordStatus
    allergen: Dict[str, Any]
    reaction: Dict[str, Any]
    treatment_notes: Optional[Dict[str, Any]] = None
    identified_date: datetime
    last_reaction_date: Optional[datetime] = None
    identified_by: int


class AllergyCreate(AllergyBase):
    """Schema for creating a new allergy."""
    pass


class AllergyUpdate(BaseModel):
    """Schema for updating allergy."""
    severity: Optional[AllergySeverity] = None
    status: Optional[MedicalRecordStatus] = None
    reaction: Optional[Dict[str, Any]] = None
    treatment_notes: Optional[Dict[str, Any]] = None
    last_reaction_date: Optional[datetime] = None


class AllergyResponse(AllergyBase):
    """Schema for allergy response."""
    id: int
    patient_id: int
    record_id: int
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class MedicalHistorySearch(BaseModel):
    """Schema for medical history search parameters."""
    record_type: Optional[MedicalRecordType] = None
    status: Optional[MedicalRecordStatus] = None
    provider_id: Optional[int] = None
    facility_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_archived: bool = False
    search_term: Optional[str] = None


class RecordType(str, Enum):
    """Medical record types."""
    VISIT = 'visit'
    PROCEDURE = 'procedure'
    TEST = 'test'
    CONSULTATION = 'consultation'
    REFERRAL = 'referral'


class RecordStatus(str, Enum):
    """Medical record status."""
    ACTIVE = 'active'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    ARCHIVED = 'archived'


class MedicalRecordBase(BaseModel):
    """Base schema for medical records."""
    record_type: RecordType
    record_date: datetime
    follow_up_date: Optional[datetime] = None
    diagnosis: Optional[Dict[str, Any]] = None
    treatment: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    provider_notes: Optional[str] = None
    status: RecordStatus = RecordStatus.ACTIVE


class MedicalRecordCreate(MedicalRecordBase):
    """Schema for creating a medical record."""
    patient_id: int
    territory_id: int
    organization_id: int


class MedicalRecordUpdate(BaseModel):
    """Schema for updating a medical record."""
    record_type: Optional[RecordType] = None
    record_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    diagnosis: Optional[Dict[str, Any]] = None
    treatment: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    provider_notes: Optional[str] = None
    status: Optional[RecordStatus] = None


class MedicalRecordResponse(MedicalRecordBase):
    """Schema for medical record response."""
    id: int
    patient_id: int
    version: int
    previous_version_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None

    class Config:
        orm_mode = True


class MedicalConditionBase(BaseModel):
    """Base schema for medical conditions."""
    condition_name: str
    icd10_code: str
    diagnosis_date: datetime
    resolution_date: Optional[datetime] = None
    severity: str
    notes: Optional[str] = None
    status: str = 'active'


class MedicalConditionCreate(MedicalConditionBase):
    """Schema for creating a medical condition."""
    medical_record_id: int
    patient_id: int
    territory_id: int
    organization_id: int


class MedicalConditionUpdate(BaseModel):
    """Schema for updating a medical condition."""
    condition_name: Optional[str] = None
    icd10_code: Optional[str] = None
    diagnosis_date: Optional[datetime] = None
    resolution_date: Optional[datetime] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class MedicalConditionResponse(MedicalConditionBase):
    """Schema for medical condition response."""
    id: int
    medical_record_id: int
    patient_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None

    class Config:
        orm_mode = True


class MedicationBase(BaseModel):
    """Base schema for medications."""
    medication_name: str
    dosage: str
    frequency: str
    start_date: datetime
    end_date: Optional[datetime] = None
    prescribing_doctor: str
    pharmacy: Optional[str] = None
    notes: Optional[str] = None
    status: str = 'active'


class MedicationCreate(MedicationBase):
    """Schema for creating a medication."""
    medical_record_id: int
    patient_id: int
    territory_id: int
    organization_id: int


class MedicationUpdate(BaseModel):
    """Schema for updating a medication."""
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    prescribing_doctor: Optional[str] = None
    pharmacy: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class MedicationResponse(MedicationBase):
    """Schema for medication response."""
    id: int
    medical_record_id: int
    patient_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None

    class Config:
        orm_mode = True


class AllergyBase(BaseModel):
    """Base schema for allergies."""
    allergen: str
    reaction_type: str
    severity: str
    onset_date: datetime
    notes: Optional[str] = None
    status: str = 'active'


class AllergyCreate(AllergyBase):
    """Schema for creating an allergy."""
    medical_record_id: int
    patient_id: int
    territory_id: int
    organization_id: int


class AllergyUpdate(BaseModel):
    """Schema for updating an allergy."""
    allergen: Optional[str] = None
    reaction_type: Optional[str] = None
    severity: Optional[str] = None
    onset_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class AllergyResponse(AllergyBase):
    """Schema for allergy response."""
    id: int
    medical_record_id: int
    patient_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None

    class Config:
        orm_mode = True


class MedicalHistorySearch(BaseModel):
    """Schema for searching medical history."""
    patient_id: Optional[int] = None
    record_type: Optional[RecordType] = None
    status: Optional[RecordStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    territory_id: Optional[int] = None
    organization_id: Optional[int] = None
    include_archived: bool = False
    skip: int = 0
    limit: int = 10


class PatientSearchRequest(BaseModel):
    """Schema for patient search request."""
    query: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    medical_record_number: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    territory_id: Optional[int] = None
    organization_id: Optional[int] = None
    provider_id: Optional[int] = None
    facility_id: Optional[int] = None
    status: Optional[PatientStatus] = None
    insurance_verified: Optional[bool] = None
    sort_by: Optional[str] = 'created_at'
    sort_order: Optional[str] = 'desc'
    skip: int = 0
    limit: int = 10

    @validator('sort_by')
    def validate_sort_by(cls, v):
        """Validate sort field."""
        allowed_fields = [
            'created_at', 'updated_at', 'last_name',
            'date_of_birth', 'medical_record_number'
        ]
        if v not in allowed_fields:
            raise ValueError(f"Invalid sort field. Must be one of: {allowed_fields}")
        return v

    @validator('sort_order')
    def validate_sort_order(cls, v):
        """Validate sort order."""
        if v not in ['asc', 'desc']:
            raise ValueError("Sort order must be 'asc' or 'desc'")
        return v


class PatientSearchResponse(BaseModel):
    """Schema for patient search response."""
    total: int
    items: List[PatientResponse]
    has_more: bool
    next_skip: Optional[int]


class AdvancedSearchFilters(BaseModel):
    """Schema for advanced search filters."""
    age_range: Optional[Tuple[int, int]] = None
    diagnosis_codes: Optional[List[str]] = None
    medication_codes: Optional[List[str]] = None
    allergy_types: Optional[List[str]] = None
    insurance_types: Optional[List[InsuranceType]] = None
    consent_status: Optional[List[ConsentStatus]] = None
    provider_specialties: Optional[List[str]] = None
    facility_types: Optional[List[str]] = None
    visit_dates: Optional[Tuple[datetime, datetime]] = None
    last_visit_within_days: Optional[int] = None


class BulkSearchRequest(BaseModel):
    """Schema for bulk patient search."""
    search_terms: List[str]
    territory_ids: Optional[List[int]] = None
    organization_ids: Optional[List[int]] = None
    match_type: str = 'exact'  # exact, fuzzy, partial
    max_results_per_term: int = 5

    @validator('match_type')
    def validate_match_type(cls, v):
        """Validate match type."""
        if v not in ['exact', 'fuzzy', 'partial']:
            raise ValueError("Match type must be 'exact', 'fuzzy', or 'partial'")
        return v

    @validator('max_results_per_term')
    def validate_max_results(cls, v):
        """Validate max results per term."""
        if v < 1 or v > 100:
            raise ValueError("Max results per term must be between 1 and 100")
        return v


class SearchAuditLog(BaseModel):
    """Schema for search audit logging."""
    search_id: str
    user_id: int
    territory_id: Optional[int]
    organization_id: Optional[int]
    search_type: str  # basic, advanced, bulk
    search_terms: List[str]
    filters_used: Dict[str, Any]
    results_count: int
    execution_time_ms: float
    ip_address: str
    user_agent: str
    timestamp: datetime
    rate_limit_remaining: int 