from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class PatientBase(BaseModel):
    """Base patient schema."""
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: datetime


class PatientCreate(PatientBase):
    """Patient creation schema."""
    pass


class PatientUpdate(PatientBase):
    """Patient update schema."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class Patient(PatientBase):
    """Patient schema (response model)."""
    id: UUID
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PatientSearchResults(BaseModel):
    """Patient search results schema."""
    total: int
    patients: List[Patient] 