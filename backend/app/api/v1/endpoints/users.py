from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db
from app.core.security import get_current_active_user
from app.schemas.user import UserCreate, UserUpdate, UserInDB
from app.services.user_service import UserService

router = APIRouter()

@router.get("/", response_model=List[UserInDB])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve users.
    """
    users = await UserService(db).get_users(skip=skip, limit=limit)
    return users

@router.post("/", response_model=UserInDB)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Create new user.
    """
    user = await UserService(db).create_user(user_in)
    return user

@router.put("/{user_id}", response_model=UserInDB)
async def update_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: str,
    user_in: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Update a user.
    """
    user = await UserService(db).update_user(user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}", response_model=UserInDB)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get user by ID.
    """
    user = await UserService(db).get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 