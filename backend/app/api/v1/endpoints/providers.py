from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.provider import Provider
from app.models.user import User
from app.schemas.provider import (
    Provider as ProviderSchema,
    ProviderCreate,
    ProviderUpdate,
    ProviderSearchResults,
)
from app.services.encryption import encrypt_provider_data, decrypt_provider_data

router = APIRouter()


@router.post("", response_model=ProviderSchema, status_code=status.HTTP_201_CREATED)
async def create_provider(
    *,
    db: AsyncSession = Depends(get_db),
    provider_in: ProviderCreate,
    current_user: User = Depends(get_current_user)
) -> Provider:
    """Create new healthcare provider"""
    try:
        # Encrypt sensitive data (tax_id)
        encrypted_data = encrypt_provider_data(provider_in.dict())
        
        # Create provider object
        db_provider = Provider(
            **encrypted_data,
            created_by_id=current_user.id
        )
        
        db.add(db_provider)
        await db.commit()
        await db.refresh(db_provider)
        
        # Decrypt data for response
        return decrypt_provider_data(db_provider)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{provider_id}", response_model=ProviderSchema)
async def get_provider(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Provider:
    """Get provider by ID"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    # Decrypt sensitive data
    return decrypt_provider_data(provider)


@router.put("/{provider_id}", response_model=ProviderSchema)
async def update_provider(
    *,
    db: AsyncSession = Depends(get_db),
    provider_id: UUID,
    provider_in: ProviderUpdate,
    current_user: User = Depends(get_current_user)
) -> Provider:
    """Update provider information"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    try:
        # Encrypt sensitive data
        encrypted_data = encrypt_provider_data(
            provider_in.dict(exclude_unset=True)
        )
        
        # Update provider
        for field, value in encrypted_data.items():
            setattr(provider, field, value)
            
        await db.commit()
        await db.refresh(provider)
        
        # Decrypt data for response
        return decrypt_provider_data(provider)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete provider"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    await db.delete(provider)
    await db.commit()


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
    
    # Decrypt provider data
    decrypted_providers = [decrypt_provider_data(p) for p in providers]
    
    return ProviderSearchResults(
        total=total,
        providers=decrypted_providers
    ) 