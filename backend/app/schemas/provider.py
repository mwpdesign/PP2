from datetime import datetime
from pydantic import BaseModel, EmailStr, UUID4, constr, Json
from typing import Optional


class ProviderBase(BaseModel):
    """Base provider schema"""
    name: str
    npi: constr(pattern=r'^\d{10}$')
    tax_id: constr(pattern=r'^\d{2}-\d{7}$')
    email: EmailStr
    phone: constr(pattern=r'^\+?1?\d{9,15}$')
    fax: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: constr(pattern=r'^[A-Z]{2}$')
    zip_code: constr(pattern=r'^\d{5}(-\d{4})?$')
    specialty: Optional[str] = None
    accepting_new_patients: bool = True
    insurance_networks: Optional[Json] = None
    office_hours: Optional[Json] = None
    is_active: bool = True


class ProviderCreate(ProviderBase):
    """Schema for creating a new provider"""
    pass


class ProviderUpdate(ProviderBase):
    """Schema for updating a provider"""
    pass


class ProviderInDBBase(ProviderBase):
    """Base schema for provider in database"""
    id: UUID4
    created_at: datetime
    updated_at: datetime
    created_by_id: UUID4

    class Config:
        from_attributes = True


class Provider(ProviderInDBBase):
    """Schema for provider response"""
    pass


class ProviderSearchResults(BaseModel):
    """Schema for provider search results"""
    total: int
    providers: list[Provider]

    class Config:
        from_attributes = True 