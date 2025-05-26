from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db
from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
from app.schemas.verification import (
    VerificationRequest,
    VerificationResponse
)
from app.services.verification_service import VerificationService

router = APIRouter()


@router.post("/verify", response_model=VerificationResponse)
async def verify_insurance(
    *,
    db: AsyncSession = Depends(get_db),
    verification_request: VerificationRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Verify insurance coverage for a patient.
    """
    result = await VerificationService(db).verify_insurance(
        verification_request
    )
    return result


@router.get("/history", response_model=List[VerificationResponse])
async def get_verification_history(
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Get verification history.
    """
    history = await VerificationService(db).get_verification_history(
        skip=skip,
        limit=limit
    )
    return history


@router.get("/{verification_id}", response_model=VerificationResponse)
async def get_verification(
    verification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get specific verification result by ID.
    """
    verification = await VerificationService(db).get_verification(
        verification_id
    )
    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification record not found"
        )
    return verification 