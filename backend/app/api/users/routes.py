"""
Role management API endpoints with territory-based access control.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...core.security import get_current_user
from .models import User, Role, Permission, Territory
from .schemas import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
    TerritoryCreate,
    TerritoryUpdate,
    TerritoryResponse,
    UserRoleAssign
)

router = APIRouter(prefix="/users", tags=["user-management"])


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new role."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can create roles"
        )

    db_role = Role(**role.dict())
    db.add(db_role)
    await db.commit()
    await db.refresh(db_role)
    return db_role


@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all roles."""
    roles = await db.query(Role).all()
    return roles


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific role."""
    role = await db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_update: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a role."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can update roles"
        )

    db_role = await db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    for field, value in role_update.dict(exclude_unset=True).items():
        setattr(db_role, field, value)

    await db.commit()
    await db.refresh(db_role)
    return db_role


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a role."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can delete roles"
        )

    db_role = await db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    if db_role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system roles"
        )

    await db.delete(db_role)
    await db.commit()
    return {"message": "Role deleted successfully"}


@router.post("/roles/{role_id}/permissions")
async def assign_permissions(
    role_id: int,
    permission_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign permissions to a role."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can assign permissions"
        )

    db_role = await db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    permissions = await db.query(Permission).filter(
        Permission.id.in_(permission_ids)
    ).all()

    db_role.permissions = permissions
    await db.commit()
    return {"message": "Permissions assigned successfully"}


@router.post("/roles/{role_id}/hierarchy")
async def set_role_hierarchy(
    role_id: int,
    parent_role_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set role hierarchy."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can set role hierarchy"
        )

    db_role = await db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    parent_roles = await db.query(Role).filter(
        Role.id.in_(parent_role_ids)
    ).all()

    db_role.parent_roles = parent_roles
    await db.commit()
    return {"message": "Role hierarchy set successfully"}


@router.post("/users/{user_id}/roles")
async def assign_user_roles(
    user_id: int,
    role_assignments: List[UserRoleAssign],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign roles and territories to a user."""
    if not current_user.is_superuser and not current_user.has_permission('assign_roles'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    db_user = await db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify roles and territories exist
    for assignment in role_assignments:
        role = await db.query(Role).filter(Role.id == assignment.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role {assignment.role_id} not found"
            )

        if assignment.territory_id:
            territory = await db.query(Territory).filter(
                Territory.id == assignment.territory_id
            ).first()
            if not territory:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Territory {assignment.territory_id} not found"
                )

    # Update user roles and territories
    db_user.roles = []
    db_user.territories = []

    for assignment in role_assignments:
        role = await db.query(Role).filter(Role.id == assignment.role_id).first()
        db_user.roles.append(role)

        if assignment.territory_id:
            territory = await db.query(Territory).filter(
                Territory.id == assignment.territory_id
            ).first()
            db_user.territories.append(territory)

    await db.commit()
    return {"message": "User roles and territories assigned successfully"}