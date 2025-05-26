from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class VerificationBase(BaseModel):
    """Base verification schema."""
    patient_id: UUID
    provider_id: UUID
    insurance_id: str
    insurance_group: Optional[str] = None
    status: str
    notes: Optional[str] = None


class VerificationCreate(VerificationBase):
    """Verification creation schema."""
    pass


class VerificationUpdate(VerificationBase):
    """Verification update schema."""
    insurance_id: Optional[str] = None
    insurance_group: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class VerificationInDB(VerificationBase):
    """Verification in DB schema."""
    id: UUID
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Verification(VerificationInDB):
    """Verification schema (response model)."""
    pass


class VerificationRequest(BaseModel):
    """Schema for insurance verification requests."""
    patient_id: UUID
    provider_id: UUID
    insurance_id: str
    insurance_group: Optional[str] = None


class VerificationResponse(BaseModel):
    """Schema for insurance verification responses."""
    id: UUID
    patient_id: UUID
    provider_id: UUID
    insurance_id: str
    insurance_group: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 