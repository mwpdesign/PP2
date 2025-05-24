"""
API router configuration.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import patients

api_router = APIRouter()

# Include only patients router for now
api_router.include_router(
    patients.router,
    prefix="/patients",
    tags=["Patients"]
) 