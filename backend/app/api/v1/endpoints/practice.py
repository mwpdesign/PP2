"""
Practice Staff Management API Endpoints
Phase 3.2C: Practice-Level User Delegation

API endpoints for managing practice staff members.
Only doctors can invite and manage staff.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.practice import (
    StaffInvitationCreate,
    AcceptInvitationRequest,
    StaffMemberResponse,
    PracticeStatistics,
    StaffListResponse,
)
from app.schemas.token import TokenData
from app.services.practice_service import PracticeService
# from app.services.comprehensive_audit_service import ComprehensiveAuditService

logger = logging.getLogger(__name__)

router = APIRouter()


def require_doctor_role(current_user: TokenData) -> None:
    """Ensure current user is a doctor."""
    user_role = current_user.role.lower() if current_user.role else ""
    if user_role != 'doctor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this endpoint"
        )


async def get_current_user_model(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get the current user as a User model instance."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.get("/staff", response_model=StaffListResponse)
async def list_practice_staff(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    current_user_model: User = Depends(get_current_user_model)
) -> StaffListResponse:
    """
    List all staff members in the current doctor's practice.

    Only doctors can access this endpoint.
    Returns staff members with their roles, status, and when they were added.
    """
    require_doctor_role(current_user)

    try:
        # Get staff members
        staff_members = await PracticeService.get_practice_staff(
            db, current_user_model
        )

        # Get practice statistics
        statistics = await PracticeService.get_practice_statistics(
            db, current_user_model
        )

        # Convert to response models
        staff_responses = [
            StaffMemberResponse(
                id=staff.id,
                email=staff.email,
                username=staff.username,
                first_name=staff.first_name,
                last_name=staff.last_name,
                practice_role=staff.practice_role,
                is_active=staff.is_active,
                created_at=staff.created_at,
                invited_at=staff.invited_at,
                parent_doctor_id=staff.parent_doctor_id
            )
            for staff in staff_members
        ]

        # Log audit event
        # await ComprehensiveAuditService.log_action(
        #     db=db,
        #     user_id=current_user.id,
        #     action="PRACTICE_STAFF_VIEWED",
        #     resource_type="practice",
        #     resource_id=str(current_user.id),
        #     details={"staff_count": len(staff_members)}
        # )

        return StaffListResponse(
            staff_members=staff_responses,
            statistics=PracticeStatistics(**statistics)
        )

    except ValueError as e:
        logger.error(f"Practice staff list error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error listing practice staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve practice staff"
        )


@router.post("/staff/invite", response_model=dict)
async def invite_staff_member(
    *,
    db: AsyncSession = Depends(get_db),
    invitation: StaffInvitationCreate,
    current_user: TokenData = Depends(get_current_user),
    current_user_model: User = Depends(get_current_user_model)
) -> dict:
    """
    Invite a staff member to join the practice.

    Only doctors can invite staff members.
    Creates an invitation with a 7-day expiry token.
    Does not return the token in response for security.
    """
    require_doctor_role(current_user)

    try:
        # Create staff invitation
        invitation_data = await PracticeService.create_staff_invitation(
            db=db,
            doctor=current_user_model,
            email=invitation.email,
            practice_role=invitation.practice_role,
            first_name=invitation.first_name,
            last_name=invitation.last_name
        )

        # Log audit event
        # await ComprehensiveAuditService.log_action(
        #     db=db,
        #     user_id=current_user.id,
        #     action="STAFF_INVITATION_CREATED",
        #     resource_type="practice",
        #     resource_id=str(invitation_data["user_id"]),
        #     details={
        #         "invited_email": invitation.email,
        #         "practice_role": invitation.practice_role,
        #         "expires_at": invitation_data["expires_at"].isoformat()
        #     }
        # )

        # Return response without token for security
        return {
            "message": "Staff invitation sent successfully",
            "user_id": invitation_data["user_id"],
            "email": invitation_data["email"],
            "practice_role": invitation_data["practice_role"],
            "invited_at": invitation_data["invited_at"],
            "expires_at": invitation_data["expires_at"]
        }

    except ValueError as e:
        logger.error(f"Staff invitation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error creating staff invitation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create staff invitation"
        )


@router.post("/accept-invitation", response_model=dict)
async def accept_staff_invitation(
    *,
    db: AsyncSession = Depends(get_db),
    invitation_data: AcceptInvitationRequest
) -> dict:
    """
    Accept a staff invitation and complete registration.

    This is a public endpoint (no authentication required).
    Returns authentication tokens after successful registration.
    """
    try:
        # Accept the invitation
        user = await PracticeService.accept_invitation(
            db=db,
            invitation_token=invitation_data.invitation_token,
            password=invitation_data.password,
            username=invitation_data.username
        )

        # Create access token for the new user
        from app.core.security import create_access_token
        from datetime import timedelta

        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )

        # Log audit event
        # await ComprehensiveAuditService.log_action(
        #     db=db,
        #     user_id=user.id,
        #     action="STAFF_INVITATION_ACCEPTED",
        #     resource_type="practice",
        #     resource_id=str(user.parent_doctor_id),
        #     details={
        #         "user_email": user.email,
        #         "practice_role": user.practice_role
        #     }
        # )

        return {
            "message": "Invitation accepted successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "practice_role": user.practice_role,
                "parent_doctor_id": user.parent_doctor_id
            }
        }

    except ValueError as e:
        logger.error(f"Invitation acceptance error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error accepting invitation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept invitation"
        )


@router.put("/staff/{user_id}/deactivate", response_model=dict)
async def deactivate_staff_member(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    current_user_model: User = Depends(get_current_user_model)
) -> dict:
    """
    Deactivate a staff member.

    Only the doctor who added the staff member can deactivate them.
    """
    require_doctor_role(current_user)

    try:
        # Deactivate staff member
        success = await PracticeService.deactivate_staff_member(
            db=db,
            doctor=current_user_model,
            staff_user_id=user_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to deactivate staff member"
            )

        # Log audit event
        # await ComprehensiveAuditService.log_action(
        #     db=db,
        #     user_id=current_user.id,
        #     action="STAFF_MEMBER_DEACTIVATED",
        #     resource_type="practice",
        #     resource_id=str(user_id),
        #     details={
        #         "deactivated_by": current_user.id,
        #         "practice_id": current_user.id
        #     }
        # )

        return {
            "message": "Staff member deactivated successfully",
            "user_id": user_id
        }

    except ValueError as e:
        logger.error(f"Staff deactivation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error deactivating staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate staff member"
        )


@router.get("/statistics", response_model=PracticeStatistics)
async def get_practice_statistics(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    current_user_model: User = Depends(get_current_user_model)
) -> PracticeStatistics:
    """
    Get practice statistics for the dashboard.

    Only doctors can access this endpoint.
    Returns metrics about staff members and practice activity.
    """
    require_doctor_role(current_user)

    try:
        # Get practice statistics
        statistics = await PracticeService.get_practice_statistics(
            db, current_user_model
        )

        # Log audit event
        # await ComprehensiveAuditService.log_action(
        #     db=db,
        #     user_id=current_user.id,
        #     action="PRACTICE_STATISTICS_VIEWED",
        #     resource_type="practice",
        #     resource_id=str(current_user.id),
        #     details=statistics
        # )

        return PracticeStatistics(**statistics)

    except ValueError as e:
        logger.error(f"Practice statistics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error getting practice statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve practice statistics"
        )