from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, constr

# Base Schemas
class TerritoryBase(BaseModel):
    name: str
    boundary_data: dict
    parent_id: Optional[str] = None

class FacilityBase(BaseModel):
    name: str
    address: str
    territory_id: Optional[str] = None
    facility_metadata: Optional[dict] = None

class ProviderBase(BaseModel):
    facility_id: str
    npi: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    specialty: str
    provider_metadata: Optional[dict] = None

class CredentialBase(BaseModel):
    provider_id: str
    credential_type: str
    credential_number: str
    issuing_authority: str
    issue_date: datetime
    expiry_date: datetime

class RelationshipBase(BaseModel):
    provider_id: str
    related_provider_id: str
    relationship_type: str
    start_date: datetime
    end_date: Optional[datetime] = None

# Create Schemas
class TerritoryCreate(TerritoryBase):
    pass

class FacilityCreate(FacilityBase):
    pass

class ProviderCreate(ProviderBase):
    pass

class CredentialCreate(CredentialBase):
    pass

class RelationshipCreate(RelationshipBase):
    pass

# Response Schemas
class TerritoryResponse(TerritoryBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FacilityResponse(FacilityBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    territory: Optional[TerritoryResponse] = None

    class Config:
        from_attributes = True

class CredentialResponse(CredentialBase):
    id: str
    verification_status: str
    document_key: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProviderResponse(ProviderBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    facility: Optional[FacilityResponse] = None
    credentials: List[CredentialResponse] = []
    territories: List[TerritoryResponse] = []

    class Config:
        from_attributes = True

class RelationshipResponse(RelationshipBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Search Schemas
class ProviderSearchParams(BaseModel):
    territory_id: Optional[str] = None
    facility_id: Optional[str] = None
    specialty: Optional[str] = None
    name: Optional[str] = None
    npi: Optional[str] = None
    status: Optional[str] = "active"

class ProviderSearchResponse(BaseModel):
    items: List[ProviderResponse]
    total: int
    page: int
    size: int 