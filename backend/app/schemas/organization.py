"""Organization schema definitions."""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, constr, EmailStr


class OrganizationBase(BaseModel):
    """Base organization schema."""
    name: constr(min_length=1, max_length=255)
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    security_policy: Optional[Dict[str, Any]] = None
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str = "US"
    is_active: bool = True


class OrganizationCreate(OrganizationBase):
    """Organization creation schema."""
    pass


class OrganizationUpdate(OrganizationBase):
    """Organization update schema."""
    name: Optional[constr(min_length=1, max_length=255)] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    security_policy: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class OrganizationInDB(OrganizationBase):
    """Internal organization schema."""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class OrganizationResponse(OrganizationInDB):
    """Organization response schema."""
    pass 