"""Role-Based Access Control API endpoints."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.rbac import Role, Permission
from app.models.user import User
from app.schemas.rbac import (
    RoleCreate,
    RoleResponse,
    RoleUpdate,
    PermissionCreate,
    PermissionResponse,
    PermissionUpdate,
)
from app.core.audit import AuditLogger


router = APIRouter()
audit_logger = AuditLogger()


@router.post(
    "/roles/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED
)
async def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    """
    Create a new role with permissions.

    Args:
        role: Role creation data
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Created role object

    Raises:
        HTTPException: If creation fails or user lacks permission
    """
    # Verify user has permission to create roles
    if not current_user.role.permissions.get("create_roles"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create roles",
        )

    try:
        # Validate organization access
        if (
            role.organization_id != current_user.organization_id
            and not current_user.role.permissions.get("manage_all_organizations")
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create roles for this organization",
            )

        # Create role
        db_role = Role(
            name=role.name,
            description=role.description,
            organization_id=role.organization_id,
            parent_role_id=role.parent_role_id,
            permissions=role.permissions,
        )

        db.add(db_role)

        # Add permissions
        for permission_id in role.permission_ids:
            permission = db.query(Permission).get(permission_id)
            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission {permission_id} not found",
                )
            db_role.assigned_permissions.append(permission)

        db.commit()
        db.refresh(db_role)

        # Log role creation
        audit_logger.log_action(
            action="role_created",
            user_id=current_user.id,
            resource_id=db_role.id,
            resource_type="role",
            organization_id=role.organization_id,
            details={
                "name": db_role.name,
                "permission_ids": [str(p) for p in role.permission_ids],
            },
        )

        return db_role

    except IntegrityError as e:
        db.rollback()
        if "name" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists in this organization",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error"
        )


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    """
    Get role by ID.

    Args:
        role_id: Role ID
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Role object

    Raises:
        HTTPException: If role not found or access denied
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Check access
    if (
        role.organization_id != current_user.organization_id
        and not current_user.role.permissions.get("view_all_roles")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this role",
        )

    return role


@router.get("/roles/", response_model=List[RoleResponse])
async def list_roles(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> List[Role]:
    """
    List roles based on user's permissions.

    Args:
        db: Database session
        current_user: Currently authenticated user

    Returns:
        List of role objects
    """
    # Check if user can view all roles
    if current_user.role.permissions.get("view_all_roles"):
        return db.query(Role).all()

    # Otherwise, return only roles from user's organization
    return (
        db.query(Role)
        .filter(Role.organization_id == current_user.organization_id)
        .all()
    )


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: UUID,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Role:
    """
    Update role details.

    Args:
        role_id: Role ID to update
        role_update: Update data
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Updated role object

    Raises:
        HTTPException: If update fails or access denied
    """
    # Get role
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    # Check permissions
    if not current_user.role.permissions.get("update_roles"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update roles",
        )

    if (
        role.organization_id != current_user.organization_id
        and not current_user.role.permissions.get("manage_all_organizations")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update roles in this organization",
        )

    try:
        # Update basic fields
        update_data = role_update.dict(exclude={"permission_ids"}, exclude_unset=True)
        for field, value in update_data.items():
            setattr(role, field, value)

        # Update permissions if provided
        if role_update.permission_ids is not None:
            role.assigned_permissions = []
            for permission_id in role_update.permission_ids:
                permission = db.query(Permission).get(permission_id)
                if not permission:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Permission {permission_id} not found",
                    )
                role.assigned_permissions.append(permission)

        db.commit()
        db.refresh(role)

        # Log role update
        audit_logger.log_action(
            action="role_updated",
            user_id=current_user.id,
            resource_id=role.id,
            resource_type="role",
            organization_id=role.organization_id,
            details={
                "updated_fields": list(update_data.keys()),
                "permission_ids_updated": role_update.permission_ids is not None,
            },
        )

        return role

    except IntegrityError as e:
        db.rollback()
        if "name" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists in this organization",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error"
        )


@router.post(
    "/permissions/",
    response_model=PermissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_permission(
    permission: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Permission:
    """
    Create a new permission.

    Args:
        permission: Permission creation data
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Created permission object

    Raises:
        HTTPException: If creation fails or user lacks permission
    """
    # Verify user has permission to create permissions
    if not current_user.role.permissions.get("create_permissions"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create permissions",
        )

    try:
        # Create permission
        db_permission = Permission(
            name=permission.name,
            description=permission.description,
            resource_type=permission.resource_type,
            action=permission.action,
            conditions=permission.conditions or {},
        )

        db.add(db_permission)
        db.commit()
        db.refresh(db_permission)

        # Log permission creation
        audit_logger.log_action(
            action="permission_created",
            user_id=current_user.id,
            resource_id=db_permission.id,
            resource_type="permission",
            organization_id=current_user.organization_id,
            details={
                "name": db_permission.name,
                "resource_type": db_permission.resource_type,
                "action": db_permission.action,
            },
        )

        return db_permission

    except IntegrityError as e:
        db.rollback()
        if "name" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission name already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error"
        )


@router.get("/permissions/{permission_id}", response_model=PermissionResponse)
async def get_permission(
    permission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Permission:
    """
    Get permission by ID.

    Args:
        permission_id: Permission ID
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Permission object

    Raises:
        HTTPException: If permission not found or access denied
    """
    # Check if user can view permissions
    if not current_user.role.permissions.get("view_permissions"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view permissions",
        )

    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    return permission


@router.get("/permissions/", response_model=List[PermissionResponse])
async def list_permissions(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> List[Permission]:
    """
    List all permissions.

    Args:
        db: Database session
        current_user: Currently authenticated user

    Returns:
        List of permission objects

    Raises:
        HTTPException: If user lacks permission
    """
    # Check if user can view permissions
    if not current_user.role.permissions.get("view_permissions"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view permissions",
        )

    return db.query(Permission).all()


@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: UUID,
    permission_update: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Permission:
    """
    Update permission details.

    Args:
        permission_id: Permission ID to update
        permission_update: Update data
        db: Database session
        current_user: Currently authenticated user

    Returns:
        Updated permission object

    Raises:
        HTTPException: If update fails or access denied
    """
    # Check if user can update permissions
    if not current_user.role.permissions.get("update_permissions"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update permissions",
        )

    # Get permission
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    try:
        # Update fields
        update_data = permission_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(permission, field, value)

        db.commit()
        db.refresh(permission)

        # Log permission update
        audit_logger.log_action(
            action="permission_updated",
            user_id=current_user.id,
            resource_id=permission.id,
            resource_type="permission",
            organization_id=current_user.organization_id,
            details={"updated_fields": list(update_data.keys())},
        )

        return permission

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error"
        )
