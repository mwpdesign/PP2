"""
Delegation API endpoints for Healthcare IVR Platform

Provides REST API endpoints for managing delegation permissions,
allowing office administrators to submit IVRs on doctor's behalf.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.delegationService import DelegationService
from app.schemas.delegation import (
    DelegationCreate,
    DelegationResponse,
    DelegationListResponse,
    DelegationValidate,
    DelegationValidationResponse,
    ProxySubmission,
    ProxySubmissionResponse,
)
from app.models.rbac import DelegationPermission

router = APIRouter()


@router.post("/", response_model=DelegationResponse)
async def create_delegation(
    delegation_data: DelegationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new delegation permission."""
    try:
        delegation_service = DelegationService(db, current_user)
        delegation = await delegation_service.create_delegation(
            delegator_id=delegation_data.delegator_id,
            delegate_id=delegation_data.delegate_id,
            permissions=delegation_data.permissions,
            organization_id=delegation_data.organization_id,
            expires_at=delegation_data.expires_at,
            requires_approval=delegation_data.requires_approval,
            delegation_reason=delegation_data.delegation_reason,
            scope_restrictions=delegation_data.scope_restrictions,
            notes=delegation_data.notes,
        )
        return DelegationResponse.model_validate(delegation)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create delegation: {str(e)}"
        )


@router.get("/", response_model=DelegationListResponse)
async def list_delegations(
    delegation_type: str = "all",
    user_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List delegations for current user or specified user."""
    try:
        delegation_service = DelegationService(db, current_user)
        target_user_id = user_id or current_user["id"]

        delegations = await delegation_service.get_user_delegations(
            user_id=target_user_id,
            delegation_type=delegation_type
        )

        delegation_responses = [
            DelegationResponse.model_validate(d) for d in delegations
        ]

        return DelegationListResponse(
            delegations=delegation_responses,
            total_count=len(delegation_responses)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list delegations: {str(e)}"
        )


@router.get("/{delegation_id}", response_model=DelegationResponse)
async def get_delegation(
    delegation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a specific delegation by ID."""
    try:
        delegation = await db.get(DelegationPermission, delegation_id)
        if not delegation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delegation not found"
            )

        # Check if user has access to this delegation
        current_user_id = current_user["id"]
        if (delegation.delegator_id != current_user_id and
                delegation.delegate_id != current_user_id and
                current_user.get("role") != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this delegation"
            )

        return DelegationResponse.model_validate(delegation)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get delegation: {str(e)}"
        )


@router.put("/{delegation_id}/approve", response_model=DelegationResponse)
async def approve_delegation(
    delegation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Approve a delegation that requires approval."""
    try:
        delegation_service = DelegationService(db, current_user)
        success = await delegation_service.approve_delegation(delegation_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to approve delegation"
            )

        # Return updated delegation
        delegation = await db.get(DelegationPermission, delegation_id)
        return DelegationResponse.model_validate(delegation)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve delegation: {str(e)}"
        )


@router.delete("/{delegation_id}")
async def revoke_delegation(
    delegation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Revoke a delegation permission."""
    try:
        delegation_service = DelegationService(db, current_user)
        success = await delegation_service.revoke_delegation(delegation_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to revoke delegation"
            )

        return {"message": "Delegation revoked successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke delegation: {str(e)}"
        )


@router.post("/validate", response_model=DelegationValidationResponse)
async def validate_delegation(
    validation_data: DelegationValidate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Validate if a user has delegation permission for a specific action."""
    try:
        delegation_service = DelegationService(db, current_user)
        delegation = await delegation_service.validate_delegation(
            delegate_id=validation_data.delegate_id,
            permission=validation_data.permission,
            delegator_id=validation_data.delegator_id
        )

        if delegation:
            return DelegationValidationResponse(
                is_valid=True,
                delegation_id=delegation.id,
                delegator_id=delegation.delegator_id,
                permissions=delegation.permissions,
                scope_restrictions=delegation.scope_restrictions,
                requires_approval=delegation.requires_approval,
                delegation_reason=delegation.delegation_reason,
                message="Valid delegation found"
            )
        else:
            return DelegationValidationResponse(
                is_valid=False,
                message="No valid delegation found for this action"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate delegation: {str(e)}"
        )


@router.post("/submit-on-behalf", response_model=ProxySubmissionResponse)
async def submit_on_behalf(
    submission_data: ProxySubmission,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Submit an action on behalf of another user."""
    try:
        delegation_service = DelegationService(db, current_user)
        result = await delegation_service.submit_on_behalf(
            delegate_id=submission_data.delegate_id,
            delegator_id=submission_data.delegator_id,
            action=submission_data.action,
            resource_data=submission_data.resource_data,
            delegation_context=submission_data.delegation_context,
        )

        return ProxySubmissionResponse(
            success=True,
            delegation_id=result["delegation_id"],
            delegator_id=result["delegator_id"],
            delegate_id=result["delegate_id"],
            on_behalf_of=result["on_behalf_of"],
            delegation_reason=result["delegation_reason"],
            requires_approval=result["requires_approval"],
            message="Action submitted successfully on behalf of user"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit on behalf: {str(e)}"
        )