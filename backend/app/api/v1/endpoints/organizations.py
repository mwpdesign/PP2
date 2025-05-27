"""Organization management API endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate
)
from app.core.audit import AuditLogger


router = APIRouter()
audit_logger = AuditLogger()


@router.post(
    "/",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_organization(
    org: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Organization:
    """
    Create a new organization.

    Args:
        org: Organization creation data
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Created organization object

    Raises:
        HTTPException: If creation fails or user lacks permission
    """
    # Verify user has permission to create organizations
    if not current_user.role.permissions.get("create_organizations"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create organizations"
        )

    try:
        # Create organization
        db_org = Organization(
            name=org.name,
            description=org.description,
            settings=org.settings or {},
            security_policy=org.security_policy or {}
        )

        db.add(db_org)
        db.commit()
        db.refresh(db_org)

        # Log organization creation
        audit_logger.log_action(
            action="organization_created",
            user_id=current_user.id,
            resource_id=db_org.id,
            resource_type="organization",
            organization_id=db_org.id,
            details={"name": db_org.name}
        )

        return db_org

    except IntegrityError as e:
        db.rollback()
        if "name" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )


@router.get(
    "/{org_id}",
    response_model=OrganizationResponse
)
async def get_organization(
    org_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Organization:
    """
    Get organization by ID.

    Args:
        org_id: Organization ID
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Organization object

    Raises:
        HTTPException: If organization not found or access denied
    """
    # Check if user has access to the organization
    if (
        current_user.organization_id != org_id and
        not current_user.role.permissions.get("view_all_organizations")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this organization"
        )

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    return org


@router.get(
    "/",
    response_model=List[OrganizationResponse]
)
async def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Organization]:
    """
    List organizations based on user's permissions.

    Args:
        db: Database session
        current_user: Currently authenticated user

    Returns:
        List of organization objects
    """
    # Check if user can view all organizations
    if current_user.role.permissions.get("view_all_organizations"):
        return db.query(Organization).all()

    # Otherwise, return only user's organization
    return [
        db.query(Organization)
        .filter(Organization.id == current_user.organization_id)
        .first()
    ]


@router.put(
    "/{org_id}",
    response_model=OrganizationResponse
)
async def update_organization(
    org_id: UUID,
    org_update: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Organization:
    """
    Update organization details.

    Args:
        org_id: Organization ID to update
        org_update: Update data
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Updated organization object

    Raises:
        HTTPException: If update fails or access denied
    """
    # Check if user has permission to update organizations
    if not current_user.role.permissions.get("update_organizations"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update organizations"
        )

    # Get organization
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    try:
        # Update fields
        update_data = org_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(org, field, value)

        db.commit()
        db.refresh(org)

        # Log organization update
        audit_logger.log_action(
            action="organization_updated",
            user_id=current_user.id,
            resource_id=org.id,
            resource_type="organization",
            organization_id=org.id,
            details={
                "updated_fields": list(update_data.keys())
            }
        )

        return org

    except IntegrityError as e:
        db.rollback()
        if "name" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )