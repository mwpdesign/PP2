"""
Permissions API Endpoints
Phase 2: Foundation Systems - Role-Based Permissions

API endpoints for managing roles, permissions, and user role assignments.
"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.services.permission_service import get_permission_service
from app.services.comprehensive_audit_service import create_audit_context
from app.middleware.permission_middleware import (
    requires_permission, requires_any_permission, CommonPermissions
)

logger = logging.getLogger(__name__)
router = APIRouter()


# Pydantic schemas for API requests/responses
class PermissionResponse(BaseModel):
    """Response schema for permission data."""
    id: str
    name: str
    display_name: str
    description: str
    resource: str
    action: str
    is_active: bool
    created_at: str


class RoleResponse(BaseModel):
    """Response schema for role data."""
    id: str
    name: str
    display_name: str
    description: str
    is_system_role: bool
    is_active: bool
    organization_id: str
    created_at: str
    updated_at: str


class UserRoleResponse(BaseModel):
    """Response schema for user role assignment."""
    id: str
    user_id: str
    role_id: str
    assigned_at: str
    assigned_by: Optional[str] = None
    is_active: bool
    expires_at: Optional[str] = None


class AssignRoleRequest(BaseModel):
    """Request schema for assigning a role to a user."""
    role_id: str = Field(..., description="Role ID to assign")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration date")


class CreateRoleRequest(BaseModel):
    """Request schema for creating a new role."""
    name: str = Field(..., description="Role name (unique)")
    display_name: str = Field(..., description="Human-readable display name")
    description: str = Field(..., description="Role description")
    permission_ids: List[str] = Field(..., description="List of permission IDs")


class StaffMemberResponse(BaseModel):
    """Response schema for staff member data."""
    id: str
    email: str
    first_name: str
    last_name: str
    roles: List[RoleResponse]
    created_at: str
    is_active: bool


@router.get("/permissions", response_model=dict)
async def get_all_permissions(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get all available permissions.

    Requires: settings.read permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="settings.read",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: settings.read required"
        )

    permissions = await permission_service.get_all_permissions()

    return {
        "permissions": permissions,
        "total": len(permissions)
    }


@router.get("/roles", response_model=dict)
async def get_all_roles(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get all available roles for the current user's organization.

    Requires: settings.read permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="settings.read",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: settings.read required"
        )

    roles = await permission_service.get_all_roles(
        organization_id=current_user.organization_id
    )

    return {
        "roles": roles,
        "total": len(roles)
    }


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: CreateRoleRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Create a new role with specified permissions.

    Requires: settings.permissions permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="settings.permissions",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: settings.permissions required"
        )

    # Convert string UUIDs to UUID objects
    permission_uuids = [UUID(pid) for pid in role_data.permission_ids]

    role = await permission_service.create_role(
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
        organization_id=current_user.organization_id,
        permission_ids=permission_uuids,
        created_by=current_user.id,
        audit_context=audit_context
    )

    return role.to_dict()


@router.get("/users/{user_id}/roles", response_model=dict)
async def get_user_roles(
    user_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get all roles assigned to a specific user.

    Requires: user.read permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="user.read",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: user.read required"
        )

    roles = await permission_service.get_user_roles(user_id)

    return {
        "user_id": str(user_id),
        "roles": roles,
        "total": len(roles)
    }


@router.post("/users/{user_id}/roles", response_model=UserRoleResponse)
async def assign_role_to_user(
    user_id: UUID,
    role_assignment: AssignRoleRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Assign a role to a user.

    Requires: user.assign_roles permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="user.assign_roles",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: user.assign_roles required"
        )

    user_role = await permission_service.assign_role_to_user(
        user_id=user_id,
        role_id=UUID(role_assignment.role_id),
        assigned_by=current_user.id,
        expires_at=role_assignment.expires_at,
        audit_context=audit_context
    )

    return user_role.to_dict()


@router.delete("/users/{user_id}/roles/{role_id}")
async def revoke_role_from_user(
    user_id: UUID,
    role_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Revoke a role from a user.

    Requires: user.assign_roles permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="user.assign_roles",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: user.assign_roles required"
        )

    success = await permission_service.revoke_role_from_user(
        user_id=user_id,
        role_id=role_id,
        revoked_by=current_user.id,
        audit_context=audit_context
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found"
        )

    return {"message": "Role revoked successfully"}


@router.get("/users/{user_id}/permissions", response_model=dict)
async def get_user_permissions(
    user_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get all permissions for a specific user.

    Requires: user.read permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="user.read",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: user.read required"
        )

    permissions = await permission_service.get_user_permissions(user_id)

    return {
        "user_id": str(user_id),
        "permissions": list(permissions),
        "total": len(permissions)
    }


@router.get("/staff", response_model=dict)
async def get_staff_members(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get all staff members for the current organization.

    Requires: user.read permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="user.read",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: user.read required"
        )

    # This would typically query the users table with role information
    # For now, return mock data structure
    staff_members = []

    return {
        "staff": staff_members,
        "total": len(staff_members)
    }


@router.post("/check-permission")
async def check_user_permission(
    permission_name: str,
    resource_id: Optional[UUID] = None,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Check if the current user has a specific permission.

    This endpoint can be used by the frontend to check permissions
    before showing/hiding UI elements.
    """
    permission_service = get_permission_service(db)

    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name=permission_name,
        resource_id=resource_id,
        audit_context=audit_context
    )

    return {
        "user_id": str(current_user.id),
        "permission_name": permission_name,
        "resource_id": str(resource_id) if resource_id else None,
        "has_permission": has_permission
    }


@router.get("/my-permissions", response_model=dict)
async def get_my_permissions(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all permissions for the current user.

    This endpoint can be used by the frontend to determine
    what UI elements to show/hide.
    """
    permission_service = get_permission_service(db)

    permissions = await permission_service.get_user_permissions(current_user.id)
    roles = await permission_service.get_user_roles(current_user.id)

    return {
        "user_id": str(current_user.id),
        "permissions": list(permissions),
        "roles": roles,
        "permission_count": len(permissions),
        "role_count": len(roles)
    }


@router.get("/permission-matrix", response_model=dict)
async def get_permission_matrix(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get the complete permission matrix showing which roles have which permissions.

    Requires: settings.read permission
    """
    permission_service = get_permission_service(db)

    # Check permission
    audit_context = create_audit_context(current_user, request)
    has_permission = await permission_service.check_permission(
        user=current_user,
        permission_name="settings.read",
        audit_context=audit_context
    )

    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: settings.read required"
        )

    # Get all roles and permissions
    roles = await permission_service.get_all_roles(current_user.organization_id)
    permissions = await permission_service.get_all_permissions()

    # Build permission matrix
    matrix = {}
    for role in roles:
        matrix[role['name']] = {
            'role_info': role,
            'permissions': {}
        }

        # Get permissions for this role (would need to implement this in service)
        # For now, return basic structure
        for permission in permissions:
            matrix[role['name']]['permissions'][permission['name']] = False

    return {
        "matrix": matrix,
        "roles": roles,
        "permissions": permissions
    }