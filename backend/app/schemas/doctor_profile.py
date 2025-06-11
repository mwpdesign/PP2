"""Pydantic schemas for doctor profiles."""

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, Field, validator
from uuid import UUID

if TYPE_CHECKING:
    from .user import UserResponse


class DoctorProfileBase(BaseModel):
    """Base schema for doctor profile."""

    # Personal Information
    professional_title: Optional[str] = Field(None, max_length=100)
    specialty: Optional[str] = Field(None, max_length=200)

    # Professional Credentials
    medical_license_number: Optional[str] = Field(None, max_length=50)
    medical_license_state: Optional[str] = Field(None, max_length=2)
    npi_number: Optional[str] = Field(None, max_length=10)
    medicare_ptan: Optional[str] = Field(None, max_length=20)
    medicaid_provider_number: Optional[str] = Field(None, max_length=50)
    tax_id: Optional[str] = Field(None, max_length=20)
    dea_number: Optional[str] = Field(None, max_length=20)

    # Facility Information
    primary_facility_name: Optional[str] = Field(None, max_length=200)
    facility_address_line1: Optional[str] = Field(None, max_length=200)
    facility_address_line2: Optional[str] = Field(None, max_length=200)
    facility_city: Optional[str] = Field(None, max_length=100)
    facility_state: Optional[str] = Field(None, max_length=2)
    facility_zip_code: Optional[str] = Field(None, max_length=10)
    facility_phone: Optional[str] = Field(None, max_length=20)
    facility_fax: Optional[str] = Field(None, max_length=20)
    office_contact_name: Optional[str] = Field(None, max_length=100)
    office_contact_phone: Optional[str] = Field(None, max_length=20)
    office_contact_email: Optional[str] = Field(None, max_length=255)

    # Shipping Information
    shipping_address_line1: Optional[str] = Field(None, max_length=200)
    shipping_address_line2: Optional[str] = Field(None, max_length=200)
    shipping_city: Optional[str] = Field(None, max_length=100)
    shipping_state: Optional[str] = Field(None, max_length=2)
    shipping_zip_code: Optional[str] = Field(None, max_length=10)
    shipping_contact_name: Optional[str] = Field(None, max_length=100)
    shipping_contact_phone: Optional[str] = Field(None, max_length=20)
    delivery_instructions: Optional[str] = None
    preferred_delivery_time: Optional[str] = Field(None, max_length=100)

    # Professional Information
    professional_bio: Optional[str] = None
    years_in_practice: Optional[int] = Field(None, ge=0, le=100)
    board_certifications: Optional[List[str]] = []
    hospital_affiliations: Optional[List[str]] = []

    # Practice Details
    practice_type: Optional[str] = Field(None, max_length=50)
    patient_volume_per_month: Optional[int] = Field(None, ge=0)
    wound_care_percentage: Optional[int] = Field(None, ge=0, le=100)

    # Insurance and Billing
    accepts_medicare: Optional[bool] = True
    accepts_medicaid: Optional[bool] = True
    preferred_insurance_carriers: Optional[List[str]] = []
    billing_contact_name: Optional[str] = Field(None, max_length=100)
    billing_contact_phone: Optional[str] = Field(None, max_length=20)
    billing_contact_email: Optional[str] = Field(None, max_length=255)

    @validator('npi_number')
    def validate_npi_number(cls, v):
        """Validate NPI number format."""
        if v and not v.isdigit() or len(v) != 10:
            raise ValueError('NPI number must be exactly 10 digits')
        return v

    @validator('medical_license_state', 'facility_state', 'shipping_state')
    def validate_state_codes(cls, v):
        """Validate state codes are uppercase."""
        if v and len(v) != 2:
            raise ValueError('State code must be exactly 2 characters')
        return v.upper() if v else v


class DoctorProfileCreate(DoctorProfileBase):
    """Schema for creating a doctor profile."""
    user_id: UUID


class DoctorProfileUpdate(DoctorProfileBase):
    """Schema for updating a doctor profile."""
    pass


class DoctorProfileInDBBase(DoctorProfileBase):
    """Base schema for doctor profile in database."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[UUID] = None
    updated_by_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class DoctorProfile(DoctorProfileInDBBase):
    """Schema for doctor profile response."""
    pass


class DoctorProfileInDB(DoctorProfileInDBBase):
    """Schema for doctor profile in database with all fields."""
    pass


class DoctorProfileSummary(BaseModel):
    """Summary schema for doctor profile."""
    id: UUID
    user_id: UUID
    professional_title: Optional[str]
    specialty: Optional[str]
    primary_facility_name: Optional[str]
    facility_city: Optional[str]
    facility_state: Optional[str]
    npi_number: Optional[str]
    accepts_medicare: Optional[bool]
    accepts_medicaid: Optional[bool]
    wound_care_percentage: Optional[int]

    class Config:
        from_attributes = True


class DoctorProfileWithUser(DoctorProfile):
    """Doctor profile with user information."""
    user: Optional["UserResponse"] = None

    class Config:
        from_attributes = True