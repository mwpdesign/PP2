from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

router = APIRouter()

class PatientRegistration(BaseModel):
    """Simple patient registration schema."""
    first_name: str
    last_name: str
    email: EmailStr
    date_of_birth: str
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

@router.post("/register")
async def register_patient(patient: PatientRegistration):
    """Simple endpoint that just returns the received data."""
    return {
        "message": "Patient registration received",
        "patient": patient.dict()
    }