"""User schemas."""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    user_metadata: Dict = {}


class UserCreate(UserBase):
    """User creation schema."""
    username: str
    password: str
    organization_id: UUID
    role_id: UUID
    security_groups: List[str] = []
    mfa_enabled: bool = False


class UserInDB(UserBase):
    """User database schema."""
    id: UUID
    organization_id: UUID
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    security_groups: Optional[List[str]] = None
    mfa_enabled: Optional[bool] = None


class UserPreferences(BaseModel):
    """User preferences schema."""
    theme: Optional[str] = None
    notifications_enabled: bool = True
    language: str = "en"


class UserResponse(UserBase):
    """User response schema."""
    id: UUID
    organization_id: UUID
    role_id: UUID
    username: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    mfa_enabled: bool = False
    security_groups: List[str] = []

    class Config:
        """Pydantic config."""
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