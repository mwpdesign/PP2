from datetime import date, datetime
from pydantic import BaseModel, EmailStr, UUID4, constr
from typing import Optional


class PatientBase(BaseModel):
    """Base patient schema with HIPAA-compliant fields"""
    first_name: str
    last_name: str
    date_of_birth: date
    ssn: constr(pattern=r'^\d{3}-\d{2}-\d{4}$')
    email: Optional[EmailStr] = None
    phone: constr(pattern=r'^\+?1?\d{9,15}$')
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: constr(pattern=r'^[A-Z]{2}$')
    zip_code: constr(pattern=r'^\d{5}(-\d{4})?$')
    
    # Insurance Information
    insurance_provider: str
    insurance_id: str
    insurance_group: Optional[str] = None
    insurance_phone: Optional[str] = None
    
    # Medical Information
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None


class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    provider_id: UUID4


class PatientUpdate(PatientBase):
    """Schema for updating a patient"""
    pass


class PatientInDBBase(PatientBase):
    """Base schema for patient in database"""
    id: UUID4
    created_at: datetime
    updated_at: datetime
    created_by_id: UUID4
    provider_id: UUID4

    class Config:
        from_attributes = True


class Patient(PatientInDBBase):
    """Schema for patient response"""
    pass


class PatientSearchResults(BaseModel):
    """Schema for patient search results"""
    total: int
    patients: list[Patient]

    class Config:
        from_attributes = True 