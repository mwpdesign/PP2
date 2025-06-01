"""Provider API models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, constr

from app.models.provider import Provider


class ProviderBase(BaseModel):
    """Base provider model."""

    name: str
    npi: constr(min_length=10, max_length=10)
    tax_id: str
    email: EmailStr
    phone: str
    fax: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    specialty: Optional[str] = None
    accepting_new_patients: bool = True
    insurance_networks: Optional[str] = None
    office_hours: Optional[str] = None
    is_active: bool = True


class ProviderCreate(ProviderBase):
    """Provider creation model."""

    pass


class ProviderUpdate(ProviderBase):
    """Provider update model."""

    pass


class ProviderInDB(ProviderBase):
    """Provider database model."""

    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by_id: UUID

    class Config:
        """Pydantic config."""

        from_attributes = True


class ProviderResponse(ProviderInDB):
    """Provider response model."""

    pass
