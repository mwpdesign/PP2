"""
Role management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from ...core.database import get_db
from ...core.security import get_current_user
from .models import User, Role
from .schemas import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
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
    role_id: UUID,
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
    role_id: UUID,
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
    role_id: UUID,
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
    role_id: UUID,
    permissions: List[str],
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

    db_role.permissions = permissions
    await db.commit()
    return {"message": "Permissions assigned successfully"}


@router.post("/roles/{role_id}/hierarchy")
async def set_role_hierarchy(
    role_id: UUID,
    parent_role_ids: List[UUID],
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
    user_id: UUID,
    role_assignments: List[UserRoleAssign],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Assign roles to a user."""
    if not current_user.is_superuser and not current_user.has_permission(
        'assign_roles'
    ):
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

    # Verify roles exist
    for assignment in role_assignments:
        role = await db.query(Role).filter(
            Role.id == assignment.role_id
        ).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role {assignment.role_id} not found"
            )

    # Update user roles
    db_user.roles = []
    for assignment in role_assignments:
        role = await db.query(Role).filter(
            Role.id == assignment.role_id
        ).first()
        db_user.roles.append(role)

    await db.commit()
    return {"message": "User roles assigned successfully"}