from datetime import datetime
from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str


class UserUpdate(UserBase):
    """Schema for updating a user"""
    password: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: UUID4
    cognito_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for access token"""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Schema for token payload"""
    sub: Optional[UUID4] = None 