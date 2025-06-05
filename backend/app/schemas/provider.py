"""Provider schema definitions."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional, List, Any


class ProviderBase(BaseModel):
    """Base provider schema"""

    name: str
    npi: str = Field(..., pattern=r"^\d{10}$")
    tax_id: str = Field(..., pattern=r"^\d{2}-\d{7}$")
    email: EmailStr
    phone: str = Field(..., pattern=r"^\+?1?\d{9,15}$")
    fax: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str = Field(..., pattern=r"^[A-Z]{2}$")
    zip_code: str = Field(..., pattern=r"^\d{5}(-\d{4})?$")
    specialty: Optional[str] = None
    accepting_new_patients: bool = True
    insurance_networks: Optional[Any] = None
    office_hours: Optional[Any] = None
    is_active: bool = True


class ProviderCreate(ProviderBase):
    """Schema for creating a new provider"""

    organization_id: UUID4


class ProviderUpdate(BaseModel):
    """Schema for updating a provider"""

    name: Optional[str] = None
    npi: Optional[str] = Field(None, pattern=r"^\d{10}$")
    tax_id: Optional[str] = Field(None, pattern=r"^\d{2}-\d{7}$")
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?1?\d{9,15}$")
    fax: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = Field(None, pattern=r"^[A-Z]{2}$")
    zip_code: Optional[str] = Field(None, pattern=r"^\d{5}(-\d{4})?$")
    specialty: Optional[str] = None
    accepting_new_patients: Optional[bool] = None
    insurance_networks: Optional[Any] = None
    office_hours: Optional[Any] = None
    is_active: Optional[bool] = None


class ProviderResponse(ProviderBase):
    """Schema for provider response"""

    id: UUID4
    organization_id: UUID4
    created_at: datetime
    updated_at: datetime
    created_by_id: UUID4
    updated_by_id: Optional[UUID4] = None
    assigned_territories: Optional[List[UUID4]] = None

    class Config:
        from_attributes = True


class ProviderSearchResults(BaseModel):
    """Schema for provider search results"""

    total: int
    providers: List[ProviderResponse]

    class Config:
        from_attributes = True
