"""
API endpoints for User Invitation System
Task ID: mbvu8p4nc9bidurxtvc
Phase 2: Service Layer Implementation

These endpoints handle all invitation-related operations including:
- Creating invitations for all user types
- Managing invitation lifecycle
- Accepting invitations
- Bulk operations and statistics
"""

from typing import List, Optional
from uuid import UUID as PyUUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.exceptions import (
    NotFoundException,
    ValidationError,
    AuthorizationError,
    ConflictError
)
from app.services.invitation_service import InvitationService
from app.schemas.invitation import (
    InvitationCreateRequest,
    DoctorInvitationRequest,
    SalesInvitationRequest,
    PracticeStaffInvitationRequest,
    InvitationAcceptRequest,
    InvitationResponse,
    InvitationListResponse,
    InvitationAcceptResponse,
    InvitationStatisticsResponse,
    InvitationUrlResponse,
    InvitationValidationResponse,
    BulkInvitationRequest,
    BulkInvitationResponse,
    BulkOperationResponse,
    InvitationErrorResponse
)
from app.schemas.token import TokenData

router = APIRouter()


# ==================== INVITATION CREATION ====================

@router.post(
    "/",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new invitation",
    description="Create a new invitation for any user type with hierarchy support"
)
async def create_invitation(
    invitation_data: InvitationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Create a new invitation."""
    import logging
    logger = logging.getLogger(__name__)

    logger.info("🔍 CREATE INVITATION ENDPOINT CALLED")
    logger.info(f"📧 Current user: {current_user.email if current_user else 'None'}")
    logger.info(f"👤 Current user ID: {current_user.id if current_user else 'None'}")
    logger.info(f"👤 Current user role: {current_user.role if current_user else 'None'}")
    logger.info(f"🏢 Current user org: {current_user.organization_id if current_user else 'None'}")
    logger.info(f"📋 Invitation data: {invitation_data}")

    try:
        logger.info(f"🎯 Starting invitation creation for user: "
                    f"{current_user.email}")
        logger.info(f"📧 Current user ID: {current_user.id}")
        logger.info(f"🏢 Current user organization: "
                    f"{current_user.organization_id}")
        logger.info(f"👤 Current user role: {current_user.role}")
        logger.info(f"📝 Invitation data: {invitation_data.dict()}")

        service = InvitationService(db)

        logger.info("🔧 InvitationService created successfully")

        # Create the invitation
        invitation = await service.create_invitation(
            email=invitation_data.email,
            invitation_type=invitation_data.invitation_type,
            role_name=invitation_data.role_name,
            invited_by_id=current_user.id,
            organization_id=invitation_data.organization_id,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            invitation_message=invitation_data.invitation_message,
            expires_in_days=invitation_data.expires_in_days,
            parent_sales_id=invitation_data.parent_sales_id,
            parent_distributor_id=invitation_data.parent_distributor_id,
            parent_master_distributor_id=invitation_data.parent_master_distributor_id,
            parent_doctor_id=invitation_data.parent_doctor_id
        )

        logger.info(f"✅ Invitation created successfully with ID: "
                    f"{invitation.id}")
        return InvitationResponse.from_orm(invitation)

    except ConflictError as e:
        logger.error(f"❌ Conflict error in create_invitation: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        logger.error(f"❌ Validation error in create_invitation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError as e:
        logger.error(f"❌ Authorization error in create_invitation: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"💥 UNEXPECTED ERROR in create_invitation: "
                    f"{str(e)}")
        logger.error(f"🔍 Exception type: {type(e).__name__}")
        logger.error(f"📍 Exception args: {e.args}")

        # Import traceback for detailed error info
        import traceback
        logger.error(f"📋 Full traceback:\n{traceback.format_exc()}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post(
    "/doctors",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a doctor invitation",
    description="Create an invitation for a doctor with simplified parameters"
)
async def create_doctor_invitation(
    invitation_data: DoctorInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Create a doctor invitation."""
    try:
        service = InvitationService(db)

        invitation = await service.create_doctor_invitation(
            email=invitation_data.email,
            invited_by_id=current_user.id,
            organization_id=invitation_data.organization_id,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            invitation_message=invitation_data.invitation_message
        )

        return InvitationResponse.from_orm(invitation)

    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post(
    "/sales",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a sales representative invitation",
    description="Create an invitation for a sales representative"
)
async def create_sales_invitation(
    invitation_data: SalesInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Create a sales representative invitation."""
    try:
        service = InvitationService(db)

        invitation = await service.create_sales_invitation(
            email=invitation_data.email,
            invited_by_id=current_user.id,
            organization_id=invitation_data.organization_id,
            parent_distributor_id=invitation_data.parent_distributor_id,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            invitation_message=invitation_data.invitation_message
        )

        return InvitationResponse.from_orm(invitation)

    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post(
    "/practice-staff",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a practice staff invitation",
    description="Create an invitation for practice staff (office admin or medical staff)"
)
async def create_practice_staff_invitation(
    invitation_data: PracticeStaffInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Create a practice staff invitation."""
    try:
        service = InvitationService(db)

        invitation = await service.create_practice_staff_invitation(
            email=invitation_data.email,
            invited_by_id=current_user.id,
            organization_id=invitation_data.organization_id,
            staff_role=invitation_data.staff_role,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            invitation_message=invitation_data.invitation_message
        )

        return InvitationResponse.from_orm(invitation)

    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# ==================== INVITATION RETRIEVAL ====================

@router.get(
    "/",
    response_model=InvitationListResponse,
    summary="List invitations",
    description="Get a paginated list of invitations with filtering options"
)
async def list_invitations(
    organization_id: Optional[PyUUID] = Query(
        None, description="Filter by organization"
    ),
    invitation_type: Optional[str] = Query(
        None, description="Filter by invitation type"
    ),
    status: Optional[str] = Query(None, description="Filter by status"),
    invited_by_id: Optional[PyUUID] = Query(None, description="Filter by inviter"),
    limit: int = Query(
        50, ge=1, le=100, description="Number of items per page"
    ),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc or desc)"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationListResponse:
    """List invitations with filtering and pagination."""
    import logging
    logger = logging.getLogger(__name__)

    logger.info("🔍 INVITATION LIST ENDPOINT CALLED")
    logger.info(f"📧 Current user: {current_user.email if current_user else 'None'}")
    logger.info(f"👤 Current user role: {current_user.role if current_user else 'None'}")
    logger.info(f"🏢 Organization ID: {organization_id}")
    logger.info(f"📋 Invitation type: {invitation_type}")
    logger.info(f"📊 Status filter: {status}")
    logger.info(f"👥 Invited by ID: {invited_by_id}")
    logger.info(f"📄 Limit: {limit}, Offset: {offset}")

    try:
        service = InvitationService(db)

        # Apply role-based filtering
        if current_user.role not in ["admin", "chp_admin"]:
            # Non-admin users can only see invitations they created
            invited_by_id = current_user.id
            logger.info(f"🔒 Non-admin user - filtering by invited_by_id: {invited_by_id}")

        logger.info("🔄 Calling invitation service...")
        invitations, total_count = await service.list_invitations(
            organization_id=organization_id,
            invitation_type=invitation_type,
            status=status,
            invited_by_id=invited_by_id,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )

        logger.info(f"✅ Service returned {len(invitations)} invitations (total: {total_count})")

        invitation_responses = [
            InvitationResponse.from_orm(inv) for inv in invitations
        ]

        response = InvitationListResponse(
            invitations=invitation_responses,
            total_count=total_count,
            limit=limit,
            offset=offset,
            has_more=(offset + limit) < total_count
        )

        logger.info(f"📤 Returning response with {len(response.invitations)} invitations")
        return response

    except ValidationError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"💥 Unexpected error in list_invitations: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/{invitation_id}",
    response_model=InvitationResponse,
    summary="Get invitation by ID",
    description="Get a specific invitation by its ID"
)
async def get_invitation(
    invitation_id: PyUUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Get invitation by ID."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_id(invitation_id)

        # Check permissions
        if (current_user.role not in ["admin", "chp_admin"] and
            invitation.invited_by_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view this invitation"
            )

        return InvitationResponse.from_orm(invitation)

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/pending/list",
    response_model=List[InvitationResponse],
    summary="Get pending invitations",
    description="Get all pending invitations for the current user's organization"
)
async def get_pending_invitations(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of invitations"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> List[InvitationResponse]:
    """Get pending invitations."""
    service = InvitationService(db)

    # Filter by organization for non-admin users
    organization_id = None
    if current_user.role not in ["admin", "chp_admin"]:
        organization_id = current_user.organization_id

    invitations = await service.get_pending_invitations(
        organization_id=organization_id,
        limit=limit
    )

    return [InvitationResponse.from_orm(inv) for inv in invitations]


# ==================== INVITATION LIFECYCLE ====================

@router.post(
    "/{invitation_id}/send",
    response_model=InvitationResponse,
    summary="Send invitation",
    description="Mark invitation as sent and trigger email sending"
)
async def send_invitation(
    invitation_id: PyUUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Send an invitation."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_id(invitation_id)

        # Check permissions
        if (current_user.role not in ["admin", "chp_admin"] and
            invitation.invited_by_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to send this invitation"
            )

        updated_invitation = await service.send_invitation(invitation_id)
        return InvitationResponse.from_orm(updated_invitation)

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/{invitation_id}/resend",
    response_model=InvitationResponse,
    summary="Resend invitation",
    description="Resend an invitation and increment attempt counter"
)
async def resend_invitation(
    invitation_id: PyUUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Resend an invitation."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_id(invitation_id)

        # Check permissions
        if (current_user.role not in ["admin", "chp_admin"] and
            invitation.invited_by_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to resend this invitation"
            )

        updated_invitation = await service.resend_invitation(invitation_id)
        return InvitationResponse.from_orm(updated_invitation)

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/accept/{token}",
    response_model=InvitationAcceptResponse,
    summary="Accept invitation",
    description="Accept an invitation and create user account"
)
async def accept_invitation(
    token: str,
    acceptance_data: InvitationAcceptRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> InvitationAcceptResponse:
    """Accept an invitation."""
    try:
        service = InvitationService(db)

        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        # Prepare user data
        user_data = {
            "password": acceptance_data.password,
            "phone": acceptance_data.phone
        }

        # Add additional data if provided
        if acceptance_data.additional_data:
            user_data.update(acceptance_data.additional_data)

        invitation, user = await service.accept_invitation(
            token=token,
            user_data=user_data,
            ip_address=ip_address,
            user_agent=user_agent
        )

        return InvitationAcceptResponse(
            invitation=InvitationResponse.from_orm(invitation),
            user_id=user.id,
            message="Invitation accepted successfully. Welcome to the platform!"
        )

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )


@router.post(
    "/{invitation_id}/cancel",
    response_model=InvitationResponse,
    summary="Cancel invitation",
    description="Cancel a pending invitation"
)
async def cancel_invitation(
    invitation_id: PyUUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Cancel an invitation."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_id(invitation_id)

        # Check permissions
        if (current_user.role not in ["admin", "chp_admin"] and
            invitation.invited_by_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to cancel this invitation"
            )

        updated_invitation = await service.cancel_invitation(invitation_id, current_user.id)
        return InvitationResponse.from_orm(updated_invitation)

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post(
    "/{invitation_id}/extend",
    response_model=InvitationResponse,
    summary="Extend invitation expiry",
    description="Extend the expiry date of an invitation"
)
async def extend_invitation_expiry(
    invitation_id: PyUUID,
    days: int = Query(7, ge=1, le=30, description="Number of days to extend"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationResponse:
    """Extend invitation expiry."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_id(invitation_id)

        # Check permissions
        if (current_user.role not in ["admin", "chp_admin"] and
            invitation.invited_by_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to extend this invitation"
            )

        updated_invitation = await service.extend_invitation_expiry(invitation_id, days)
        return InvitationResponse.from_orm(updated_invitation)

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== INVITATION VALIDATION ====================

@router.get(
    "/validate/{token}",
    response_model=InvitationValidationResponse,
    summary="Validate invitation token",
    description="Validate an invitation token and check if it can be accepted"
)
async def validate_invitation_token(
    token: str,
    db: AsyncSession = Depends(get_db)
) -> InvitationValidationResponse:
    """Validate an invitation token."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_token(token)

        is_valid = (
            invitation.status == "sent" and
            not invitation.is_expired
        )

        return InvitationValidationResponse(
            is_valid=is_valid,
            invitation_type=invitation.invitation_type,
            organization_name=invitation.organization.name if invitation.organization else None,
            inviter_name=f"{invitation.invited_by.first_name} {invitation.invited_by.last_name}" if invitation.invited_by else None,
            expires_at=invitation.expires_at,
            error_message=None if is_valid else (
                "Invitation has expired" if invitation.is_expired else
                f"Invitation status is {invitation.status}"
            )
        )

    except NotFoundException:
        return InvitationValidationResponse(
            is_valid=False,
            invitation_type=None,
            organization_name=None,
            inviter_name=None,
            expires_at=None,
            error_message="Invalid invitation token"
        )


@router.get(
    "/{invitation_id}/url",
    response_model=InvitationUrlResponse,
    summary="Get invitation URL",
    description="Get the invitation acceptance URL for an invitation"
)
async def get_invitation_url(
    invitation_id: PyUUID,
    base_url: str = Query(..., description="Base URL for the invitation link"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationUrlResponse:
    """Get invitation URL."""
    try:
        service = InvitationService(db)
        invitation = await service.get_invitation_by_id(invitation_id)

        # Check permissions
        if (current_user.role not in ["admin", "chp_admin"] and
            invitation.invited_by_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view this invitation URL"
            )

        # Generate invitation URL
        invitation_url = f"{base_url.rstrip('/')}/accept-invitation/{invitation.invitation_token}"

        return InvitationUrlResponse(
            invitation_url=invitation_url,
            token=invitation.invitation_token,
            expires_at=invitation.expires_at
        )

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# ==================== STATISTICS ====================

@router.get(
    "/statistics/summary",
    response_model=InvitationStatisticsResponse,
    summary="Get invitation statistics",
    description="Get invitation statistics for the specified time period"
)
async def get_invitation_statistics(
    organization_id: Optional[PyUUID] = Query(None, description="Filter by organization"),
    days: int = Query(30, ge=1, le=365, description="Number of days to include"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> InvitationStatisticsResponse:
    """Get invitation statistics."""
    try:
        service = InvitationService(db)

        # Apply role-based filtering
        if current_user.role not in ["admin", "chp_admin"]:
            organization_id = current_user.organization_id

        stats = await service.get_invitation_statistics(
            organization_id=organization_id,
            days=days
        )

        # Map service data to response model format
        status_breakdown = stats.get("status_breakdown", {})

        return InvitationStatisticsResponse(
            total_invitations=stats.get("total_invitations", 0),
            by_status=status_breakdown,
            by_type=stats.get("type_breakdown", {}),
            acceptance_rate=stats.get("acceptance_rate", 0.0),
            average_acceptance_time_hours=24.0,  # Default value - can be calculated later
            pending_count=status_breakdown.get("pending", 0) + status_breakdown.get("sent", 0),
            expired_count=status_breakdown.get("expired", 0)
        )

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== BULK OPERATIONS ====================

@router.post(
    "/bulk/create",
    response_model=BulkInvitationResponse,
    summary="Create multiple invitations",
    description="Create multiple invitations in a single request"
)
async def create_bulk_invitations(
    bulk_request: BulkInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> BulkInvitationResponse:
    """Create multiple invitations."""
    service = InvitationService(db)

    successful_invitations = []
    failed_invitations = []

    for invitation_data in bulk_request.invitations:
        try:
            invitation = await service.create_invitation(
                email=invitation_data.email,
                invitation_type=invitation_data.invitation_type,
                role_name=invitation_data.role_name,
                invited_by_id=current_user.id,
                organization_id=invitation_data.organization_id,
                first_name=invitation_data.first_name,
                last_name=invitation_data.last_name,
                invitation_message=invitation_data.invitation_message,
                expires_in_days=invitation_data.expires_in_days,
                parent_sales_id=invitation_data.parent_sales_id,
                parent_distributor_id=invitation_data.parent_distributor_id,
                parent_master_distributor_id=invitation_data.parent_master_distributor_id,
                parent_doctor_id=invitation_data.parent_doctor_id
            )
            successful_invitations.append(InvitationResponse.from_orm(invitation))
        except Exception as e:
            failed_invitations.append(
                InvitationErrorResponse(
                    email=invitation_data.email,
                    error=str(e)
                )
            )

    return BulkInvitationResponse(
        successful_count=len(successful_invitations),
        failed_count=len(failed_invitations),
        successful_invitations=successful_invitations,
        failed_invitations=failed_invitations
    )


@router.post(
    "/bulk/expire-old",
    response_model=BulkOperationResponse,
    summary="Expire old invitations",
    description="Expire all invitations that have passed their expiry date"
)
async def expire_old_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> BulkOperationResponse:
    """Expire old invitations."""
    # Only admin users can perform bulk operations
    if current_user.role not in ["admin", "chp_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for bulk operations"
        )

    service = InvitationService(db)
    expired_count = await service.expire_old_invitations()

    return BulkOperationResponse(
        affected_count=expired_count,
        message=f"Expired {expired_count} old invitations"
    )


@router.delete(
    "/bulk/cleanup",
    response_model=BulkOperationResponse,
    summary="Cleanup old invitations",
    description="Delete old completed/failed invitations"
)
async def cleanup_old_invitations(
    days_old: int = Query(90, ge=30, le=365, description="Age threshold in days"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
) -> BulkOperationResponse:
    """Cleanup old invitations."""
    # Only admin users can perform bulk operations
    if current_user.role not in ["admin", "chp_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for bulk operations"
        )

    service = InvitationService(db)
    deleted_count = await service.cleanup_old_invitations(days_old)

    return BulkOperationResponse(
        affected_count=deleted_count,
        message=f"Cleaned up {deleted_count} old invitations"
    )