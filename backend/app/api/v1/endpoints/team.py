"""
Team Management API Endpoints
Phase 2: Foundation Systems - Practice-Level Delegation

API endpoints for managing practice team members and invitations.
"""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.services.practice_service import get_practice_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/team", tags=["team"])


# Pydantic schemas
class StaffInvitationCreate(BaseModel):
    """Schema for creating staff invitations."""
    name: str
    email: EmailStr
    practice_role: str  # 'office_admin' or 'medical_staff'


class StaffInvitationResponse(BaseModel):
    """Schema for staff invitation response."""
    id: str
    email: str
    name: str
    practice_role: str
    invitation_token: str
    invitation_link: str
    expires_at: str


class AcceptInvitationRequest(BaseModel):
    """Schema for accepting invitations."""
    token: str
    password: str


class StaffMemberResponse(BaseModel):
    """Schema for staff member response."""
    id: str
    name: str
    email: str
    practice_role: str
    status: str
    added_date: str
    invited_at: str = None


@router.post("/invite", response_model=StaffInvitationResponse)
async def create_staff_invitation(
    invitation: StaffInvitationCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a staff invitation for the current doctor's practice.
    Only doctors can create staff invitations.
    """
    # Verify user is a doctor
    if current_user.role != 'Doctor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create staff invitations"
        )

    practice_service = get_practice_service(db)

    try:
        result = await practice_service.create_staff_invitation(
            doctor_id=current_user.id,
            name=invitation.name,
            email=invitation.email,
            practice_role=invitation.practice_role
        )

        logger.info(f"Staff invitation created by doctor {current_user.id} for {invitation.email}")
        return StaffInvitationResponse(**result)

    except Exception as e:
        logger.error(f"Error creating staff invitation: {str(e)}")
        raise


@router.post("/accept-invitation")
async def accept_staff_invitation(
    request: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a staff invitation and activate the account.
    This endpoint does not require authentication.
    """
    practice_service = get_practice_service(db)

    try:
        result = await practice_service.accept_invitation(
            token=request.token,
            password=request.password
        )

        logger.info(f"Staff invitation accepted for user {result['email']}")
        return {
            "message": "Invitation accepted successfully",
            "user": result
        }

    except Exception as e:
        logger.error(f"Error accepting invitation: {str(e)}")
        raise


@router.get("/staff", response_model=List[StaffMemberResponse])
async def get_practice_staff(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all staff members for the current doctor's practice.
    Only doctors can view their practice staff.
    """
    # Verify user is a doctor
    if current_user.role != 'Doctor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view practice staff"
        )

    practice_service = get_practice_service(db)

    try:
        staff_list = await practice_service.get_practice_staff(current_user.id)

        logger.info(f"Retrieved {len(staff_list)} staff members for doctor {current_user.id}")
        return [StaffMemberResponse(**staff) for staff in staff_list]

    except Exception as e:
        logger.error(f"Error retrieving practice staff: {str(e)}")
        raise


@router.put("/staff/{staff_id}/deactivate")
async def deactivate_staff_member(
    staff_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a staff member.
    Only doctors can deactivate their practice staff.
    """
    # Verify user is a doctor
    if current_user.role != 'Doctor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can deactivate practice staff"
        )

    practice_service = get_practice_service(db)

    try:
        success = await practice_service.deactivate_staff_member(
            doctor_id=current_user.id,
            staff_id=staff_id
        )

        if success:
            logger.info(f"Staff member {staff_id} deactivated by doctor {current_user.id}")
            return {"message": "Staff member deactivated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to deactivate staff member"
            )

    except Exception as e:
        logger.error(f"Error deactivating staff member: {str(e)}")
        raise


@router.get("/practice-scope")
async def get_practice_scope(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the practice scope for the current user.
    Returns the doctor ID that owns the practice.
    """
    practice_service = get_practice_service(db)

    try:
        practice_scope = await practice_service.get_practice_scope_from_db(current_user.id)

        return {
            "user_id": str(current_user.id),
            "practice_scope": str(practice_scope),
            "is_doctor": current_user.role == 'Doctor'
        }

    except Exception as e:
        logger.error(f"Error getting practice scope: {str(e)}")
        raise