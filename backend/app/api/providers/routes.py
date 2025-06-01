from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.api.providers.schemas import (
    FacilityCreate,
    FacilityResponse,
    ProviderCreate,
    ProviderResponse,
    CredentialCreate,
    CredentialResponse,
    TerritoryCreate,
    TerritoryResponse,
    RelationshipCreate,
    RelationshipResponse,
    ProviderSearchParams,
    ProviderSearchResponse,
)
from app.services.provider_service import ProviderService
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.audit import audit_log

router = APIRouter(prefix="/providers", tags=["providers"])


@router.post("/facilities", response_model=FacilityResponse)
@audit_log("create_facility")
async def create_facility(
    facility_data: FacilityCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new healthcare facility."""
    provider_service = ProviderService(db, current_user)
    try:
        facility = provider_service.create_facility(facility_data)
        return facility
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/doctors", response_model=ProviderResponse)
@audit_log("create_provider")
async def create_provider(
    provider_data: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new healthcare provider."""
    provider_service = ProviderService(db, current_user)
    try:
        provider = provider_service.create_provider(provider_data)
        return provider
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{provider_id}/credentials", response_model=CredentialResponse)
@audit_log("update_credentials")
async def update_credentials(
    provider_id: str,
    credential_data: CredentialCreate,
    document: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update provider credentials with document upload."""
    provider_service = ProviderService(db, current_user)
    try:
        credentials = provider_service.update_provider_credentials(
            provider_id, credential_data
        )
        return credentials
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/territories", response_model=TerritoryResponse)
@audit_log("create_territory")
async def create_territory(
    territory_data: TerritoryCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new provider territory."""
    provider_service = ProviderService(db, current_user)
    try:
        territory = provider_service.create_territory(territory_data)
        return territory
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/relationships", response_model=RelationshipResponse)
@audit_log("create_relationship")
async def create_relationship(
    relationship_data: RelationshipCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a relationship between providers."""
    provider_service = ProviderService(db, current_user)
    try:
        relationship = provider_service.create_provider_relationship(relationship_data)
        return relationship
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search", response_model=ProviderSearchResponse)
@audit_log("search_providers")
async def search_providers(
    search_params: ProviderSearchParams = Depends(),
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Search providers with territory-based access control."""
    provider_service = ProviderService(db, current_user)
    try:
        results = provider_service.search_providers(search_params, page, size)
        return ProviderSearchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{credential_id}/verify", response_model=CredentialResponse)
@audit_log("verify_credentials")
async def verify_credentials(
    credential_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Verify provider credentials."""
    provider_service = ProviderService(db, current_user)
    try:
        credentials = provider_service.verify_provider_credentials(credential_id)
        return credentials
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
