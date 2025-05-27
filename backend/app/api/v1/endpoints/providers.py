from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, require_permissions
from app.models.provider import Provider
from app.models.user import User
from app.schemas.provider import (
    ProviderCreate,
    ProviderUpdate,
    ProviderSearchResults,
    ProviderResponse
)
from app.services.providers import ProviderService

router = APIRouter()


@router.post("", response_model=ProviderResponse)
@require_permissions(["providers:write"])
async def create_provider(
    *,
    db: AsyncSession = Depends(get_db),
    provider_in: ProviderCreate,
    current_user: dict = Depends(get_current_user)
) -> ProviderResponse:
    """Create a new provider."""
    provider_service = ProviderService(db)

    provider = await provider_service.create_provider(
        provider_in,
        created_by_id=current_user["id"]
    )
    return provider


@router.get("", response_model=List[ProviderResponse])
@require_permissions(["providers:read"])
async def get_providers(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> List[ProviderResponse]:
    """Get providers."""
    provider_service = ProviderService(db)

    providers = await provider_service.get_providers(
        organization_id=current_user["organization_id"],
        skip=skip,
        limit=limit
    )
    return providers


@router.get("/{provider_id}", response_model=ProviderResponse)
@require_permissions(["providers:read"])
async def get_provider(
    *,
    db: AsyncSession = Depends(get_db),
    provider_id: UUID,
    current_user: dict = Depends(get_current_user)
) -> ProviderResponse:
    """Get a provider by ID."""
    provider_service = ProviderService(db)

    provider = await provider_service.get_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )

    # Check organization access
    if provider.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return provider


@router.put("/{provider_id}", response_model=ProviderResponse)
@require_permissions(["providers:write"])
async def update_provider(
    *,
    db: AsyncSession = Depends(get_db),
    provider_id: UUID,
    provider_in: ProviderUpdate,
    current_user: dict = Depends(get_current_user)
) -> ProviderResponse:
    """Update a provider."""
    provider_service = ProviderService(db)

    # Get existing provider
    provider = await provider_service.get_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )

    # Check organization access
    if provider.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    provider = await provider_service.update_provider(
        provider_id,
        provider_in,
        updated_by_id=current_user["id"]
    )
    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permissions(["providers:write"])
async def delete_provider(
    *,
    db: AsyncSession = Depends(get_db),
    provider_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Delete a provider."""
    provider_service = ProviderService(db)

    # Get existing provider
    provider = await provider_service.get_provider(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )

    # Check organization access
    if provider.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    await provider_service.delete_provider(provider_id)


@router.get("", response_model=ProviderSearchResults)
async def search_providers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    query: Optional[str] = None,
    specialty: Optional[str] = None,
    accepting_new_patients: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> ProviderSearchResults:
    """Search providers with filters and pagination"""
    # Base query
    query_filter = select(Provider)

    # Apply search filters
    if query:
        search_filter = or_(
            Provider.name.ilike(f"%{query}%"),
            Provider.npi.ilike(f"%{query}%"),
            Provider.email.ilike(f"%{query}%")
        )
        query_filter = query_filter.where(search_filter)

    if specialty:
        query_filter = query_filter.where(Provider.specialty == specialty)

    if accepting_new_patients is not None:
        query_filter = query_filter.where(
            Provider.accepting_new_patients == accepting_new_patients
        )

    # Get total count
    total = await db.scalar(
        select(func.count()).select_from(query_filter.subquery())
    )

    # Apply pagination
    query_filter = query_filter.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query_filter)
    providers = result.scalars().all()

    return ProviderSearchResults(
        total=total,
        providers=providers
    )