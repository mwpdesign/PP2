from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
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
        orm_mode = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        } 