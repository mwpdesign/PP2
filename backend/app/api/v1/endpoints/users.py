"""User endpoints for the API."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_permissions
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserPreferences
from app.services.users import UserService

router = APIRouter()


@router.post("", response_model=UserResponse)
@require_permissions(["users:write"])
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Create a new user."""
    user_service = UserService(db)

    user = await user_service.create_user(user_in, created_by_id=current_user["id"])
    return user


@router.get("", response_model=List[UserResponse])
@require_permissions(["users:read"])
async def get_users(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[UserResponse]:
    """Get users."""
    user_service = UserService(db)

    users = await user_service.get_users(
        organization_id=current_user["organization_id"], skip=skip, limit=limit
    )
    return users


@router.get("/{user_id}", response_model=UserResponse)
@require_permissions(["users:read"])
async def get_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get a user by ID."""
    user_service = UserService(db)

    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check organization access
    if user.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
@require_permissions(["users:write"])
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID,
    user_in: UserUpdate,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Update a user."""
    user_service = UserService(db)

    # Get existing user
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check organization access
    if user.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    user = await user_service.update_user(
        user_id, user_in, updated_by_id=current_user["id"]
    )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permissions(["users:write"])
async def delete_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """Delete a user."""
    user_service = UserService(db)

    # Get existing user
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check organization access
    if user.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    await user_service.delete_user(user_id)


@router.put("/{user_id}/preferences", response_model=UserResponse)
@require_permissions(["users:write"])
async def update_user_preferences(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID,
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Update user preferences."""
    user_service = UserService(db)

    # Get existing user
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check organization access
    if user.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    user = await user_service.update_user_preferences(
        user_id, preferences, updated_by_id=current_user["id"]
    )
    return user
