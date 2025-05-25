from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from uuid import UUID


class PatientRegistration(BaseModel):
    """Schema for patient registration."""
    first_name: str
    last_name: str
    email: EmailStr
    date_of_birth: str = Field(..., description="Date in YYYY-MM-DD format")
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        }


class Patient(BaseModel):
    """Response schema for patient."""
    id: UUID
    first_name: str
    last_name: str
    email: str
    date_of_birth: datetime
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        }


class PatientUpdate(BaseModel):
    """Schema for updating patient information."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[str] = Field(
        None,
        description="Date in YYYY-MM-DD format"
    )
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        }


class PatientDocument(BaseModel):
    """Schema for patient document."""
    id: UUID
    patient_id: UUID
    document_type: str
    file_name: str
    file_path: str
    document_category: str
    document_metadata: Optional[Dict] = None
    created_by: UUID
    territory_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        }


class PatientSearchResults(BaseModel):
    """Schema for paginated patient search results."""
    total: int
    patients: List[Patient]

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        } 