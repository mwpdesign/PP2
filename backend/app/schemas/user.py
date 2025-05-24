"""User schema definitions."""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, constr


class UserBase(BaseModel):
    """Base user schema."""
    username: constr(min_length=3, max_length=50)
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization_id: UUID
    role_id: UUID
    primary_territory_id: Optional[UUID] = None
    assigned_territories: Optional[List[UUID]] = None
    security_groups: Optional[List[str]] = None
    mfa_enabled: bool = False
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    """User creation schema."""
    password: constr(min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[UUID] = None
    organization_id: Optional[UUID] = None
    primary_territory_id: Optional[UUID] = None
    assigned_territories: Optional[List[UUID]] = None
    security_groups: Optional[List[str]] = None
    mfa_enabled: Optional[bool] = None
    password: Optional[constr(min_length=8)] = None


class UserInDB(UserBase):
    """Internal user schema with hashed password."""
    encrypted_password: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    failed_login_attempts: int
    locked_until: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None
    force_password_change: bool

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    cognito_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class UserLogin(BaseModel):
    """User login schema."""
    username: str
    password: str
    mfa_token: Optional[str] = None


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    user_id: UUID

    class Config:
        """Pydantic configuration."""
        from_attributes = True 