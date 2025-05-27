from typing import Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime

from app.api.providers.models import (
    Facility,
    Provider,
    ProviderCredentials,
    ProviderTerritory,
    ProviderRelationship,
)
from app.api.providers.schemas import (
    FacilityCreate,
    ProviderCreate,
    CredentialCreate,
    TerritoryCreate,
    RelationshipCreate,
    ProviderSearchParams,
)
from app.core.security import verify_territory_access, get_current_user
from app.services.document_service import DocumentService
from app.core.exceptions import (
    NotFoundException,
    UnauthorizedError,
)


class ProviderService:
    """Service for managing healthcare providers."""

    def __init__(self, db: Session):
        self.db = db
        self.document_service = DocumentService()

    def create_facility(self, facility_data: FacilityCreate) -> Facility:
        """Create a new healthcare facility."""
        # Verify territory access
        if facility_data.territory_id:
            if not verify_territory_access(
                get_current_user(),
                facility_data.territory_id
            ):
                raise UnauthorizedError("No access to specified territory")

        facility = Facility(**facility_data.dict())
        self.db.add(facility)
        self.db.commit()
        self.db.refresh(facility)
        return facility

    def create_provider(self, provider_data: ProviderCreate) -> Provider:
        """Create a new healthcare provider."""
        # Verify facility exists and user has access
        facility = self.db.query(Facility).filter_by(
            id=provider_data.facility_id
        ).first()
        if not facility:
            raise NotFoundException("Facility not found")

        if not verify_territory_access(
            get_current_user(),
            facility.territory_id
        ):
            raise UnauthorizedError("No access to facility's territory")

        provider = Provider(**provider_data.dict())
        self.db.add(provider)
        self.db.commit()
        self.db.refresh(provider)
        return provider

    def update_provider_credentials(
        self, provider_id: str, credential_data: CredentialCreate
    ) -> ProviderCredentials:
        """Update or create provider credentials with document storage."""
        provider = self.db.query(Provider).filter_by(id=provider_id).first()
        if not provider:
            raise NotFoundException("Provider not found")

        # Verify territory access
        if not any(
            verify_territory_access(get_current_user(), t.id)
            for t in provider.territories
        ):
            raise UnauthorizedError("No access to provider's territory")

        # Create or update credentials
        credentials = ProviderCredentials(**credential_data.dict())
        self.db.add(credentials)
        self.db.commit()
        self.db.refresh(credentials)
        return credentials

    def create_territory(
        self,
        territory_data: TerritoryCreate
    ) -> ProviderTerritory:
        """Create a new provider territory."""
        # Verify parent territory access if specified
        if territory_data.parent_id:
            if not verify_territory_access(
                get_current_user(),
                territory_data.parent_id
            ):
                raise UnauthorizedError("No access to parent territory")

        territory = ProviderTerritory(**territory_data.dict())
        self.db.add(territory)
        self.db.commit()
        self.db.refresh(territory)
        return territory

    def create_provider_relationship(
        self,
        relationship_data: RelationshipCreate
    ) -> ProviderRelationship:
        """Create a relationship between providers."""
        # Verify both providers exist and user has access
        provider = self.db.query(Provider).filter_by(
            id=relationship_data.provider_id
        ).first()
        related_provider = self.db.query(Provider).filter_by(
            id=relationship_data.related_provider_id
        ).first()

        if not provider or not related_provider:
            raise NotFoundException("One or both providers not found")

        # Verify territory access for both providers
        if not (
            any(
                verify_territory_access(get_current_user(), t.id)
                for t in provider.territories
            )
            and any(
                verify_territory_access(get_current_user(), t.id)
                for t in related_provider.territories
            )
        ):
            raise UnauthorizedError(
                "No access to one or both providers' territories"
            )

        relationship = ProviderRelationship(**relationship_data.dict())
        self.db.add(relationship)
        self.db.commit()
        self.db.refresh(relationship)
        return relationship

    def search_providers(
        self,
        search_params: ProviderSearchParams,
        page: int = 1,
        size: int = 20
    ) -> Dict:
        """Search providers with territory-based access control."""
        query = self.db.query(Provider)

        # Apply search filters
        if search_params.territory_id:
            if not verify_territory_access(
                get_current_user(),
                search_params.territory_id
            ):
                raise UnauthorizedError("No access to specified territory")
            query = query.join(Provider.territories).filter(
                ProviderTerritory.id == search_params.territory_id
            )

        if search_params.facility_id:
            query = query.filter(
                Provider.facility_id == search_params.facility_id
            )

        if search_params.specialty:
            query = query.filter(
                Provider.specialty == search_params.specialty
            )

        if search_params.name:
            search_term = f"%{search_params.name}%"
            query = query.filter(
                or_(
                    Provider.encrypted_first_name.ilike(search_term),
                    Provider.encrypted_last_name.ilike(search_term),
                )
            )

        if search_params.npi:
            query = query.filter(Provider.encrypted_npi == search_params.npi)

        if search_params.status:
            query = query.filter(Provider.status == search_params.status)

        # Apply pagination
        total = query.count()
        providers = query.offset((page - 1) * size).limit(size).all()

        return {
            "items": providers,
            "total": total,
            "page": page,
            "size": size,
        }

    def verify_provider_credentials(
        self,
        credential_id: str
    ) -> ProviderCredentials:
        """Verify provider credentials and update status."""
        credentials = self.db.query(ProviderCredentials).filter_by(
            id=credential_id
        ).first()
        if not credentials:
            raise NotFoundException("Credentials not found")

        # Verify territory access
        provider = credentials.provider
        if not any(
            verify_territory_access(get_current_user(), t.id)
            for t in provider.territories
        ):
            raise UnauthorizedError("No access to provider's territory")

        # Implement credential verification logic here
        # This could involve third-party verification services
        credentials.verification_status = "verified"
        credentials.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(credentials)
        return credentials
