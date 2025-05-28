from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.schemas.settings import (
    SystemSettings,
    SystemSettingsCreate,
    SystemSettingsUpdate,
)
from app.services import settings_service
from app.core.security import get_current_admin_user

router = APIRouter()


@router.get("/system", response_model=SystemSettings)
async def get_system_settings(
    db: AsyncSession = Depends(deps.get_db),
    _: dict = Depends(get_current_admin_user),
) -> SystemSettings:
    """
    Get system settings.
    """
    settings = await settings_service.get_system_settings(db)
    if not settings:
        raise HTTPException(
            status_code=404,
            detail="System settings not found"
        )
    return settings


@router.post("/system", response_model=SystemSettings)
async def create_system_settings(
    settings: SystemSettingsCreate,
    db: AsyncSession = Depends(deps.get_db),
    _: dict = Depends(get_current_admin_user),
) -> SystemSettings:
    """
    Create new system settings.
    """
    existing_settings = await settings_service.get_system_settings(db)
    if existing_settings:
        raise HTTPException(
            status_code=400,
            detail="System settings already exist. Use PUT to update."
        )
    return await settings_service.create_system_settings(db, settings)


@router.put("/system", response_model=SystemSettings)
async def update_system_settings(
    settings_update: SystemSettingsUpdate,
    db: AsyncSession = Depends(deps.get_db),
    _: dict = Depends(get_current_admin_user),
) -> SystemSettings:
    """
    Update system settings.
    """
    current_settings = await settings_service.get_system_settings(db)
    if not current_settings:
        raise HTTPException(
            status_code=404,
            detail="System settings not found"
        )
    return await settings_service.update_system_settings(
        db,
        current_settings,
        settings_update,
    ) 