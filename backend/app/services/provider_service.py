from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.providers.models import ProviderCreate, ProviderUpdate, ProviderInDB
from app.models.provider import Provider


class ProviderService:
    """Service for managing healthcare providers."""

    def __init__(self, db: AsyncSession):
        """Initialize the provider service."""
        self.db = db

    async def create_provider(
        self, provider_data: ProviderCreate, created_by_id: UUID
    ) -> Provider:
        """Create a new provider."""
        provider = Provider(**provider_data.model_dump(), created_by_id=created_by_id)
        self.db.add(provider)
        await self.db.commit()
        await self.db.refresh(provider)
        return provider

    async def get_provider(self, provider_id: UUID) -> Optional[Provider]:
        """Get a provider by ID."""
        result = await self.db.execute(
            select(Provider).where(Provider.id == provider_id)
        )
        return result.scalar_one_or_none()

    async def get_providers(self, skip: int = 0, limit: int = 100) -> List[Provider]:
        """Get a list of providers."""
        result = await self.db.execute(select(Provider).offset(skip).limit(limit))
        return result.scalars().all()

    async def update_provider(
        self, provider_id: UUID, provider_data: ProviderUpdate
    ) -> Optional[Provider]:
        """Update a provider."""
        provider = await self.get_provider(provider_id)
        if not provider:
            return None

        for field, value in provider_data.model_dump(exclude_unset=True).items():
            setattr(provider, field, value)

        await self.db.commit()
        await self.db.refresh(provider)
        return provider

    async def delete_provider(self, provider_id: UUID) -> bool:
        """Delete a provider."""
        provider = await self.get_provider(provider_id)
        if not provider:
            return False

        await self.db.delete(provider)
        await self.db.commit()
        return True
