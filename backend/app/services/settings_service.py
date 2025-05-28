from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.settings import SystemSettings
from app.schemas.settings import SystemSettingsCreate, SystemSettingsUpdate
from app.core.security import generate_uuid


async def get_system_settings(db: AsyncSession) -> Optional[SystemSettings]:
    """Get the system settings."""
    result = await db.execute(
        "SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 1"
    )
    return result.scalar_one_or_none()


async def create_system_settings(
    db: AsyncSession, settings: SystemSettingsCreate
) -> SystemSettings:
    """Create new system settings."""
    db_settings = SystemSettings(
        id=generate_uuid(),
        **settings.model_dump()
    )
    db.add(db_settings)
    await db.commit()
    await db.refresh(db_settings)
    return db_settings


async def update_system_settings(
    db: AsyncSession,
    current_settings: SystemSettings,
    settings_update: SystemSettingsUpdate,
) -> SystemSettings:
    """Update system settings."""
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_settings, field, value)

    await db.commit()
    await db.refresh(current_settings)
    return current_settings 