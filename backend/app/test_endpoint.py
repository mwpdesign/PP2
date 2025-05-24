from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SimplePatient(BaseModel):
    first_name: str
    last_name: str
    email: str

@router.post("/test")
def create_test_patient(patient: SimplePatient):
    return {"message": "success", "data": patient} 