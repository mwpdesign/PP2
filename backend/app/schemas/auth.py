"""Authentication schemas."""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
from app.core.security import PasswordValidator


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    role: str = Field(default="user", max_length=50)


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, max_length=100)
    organization_id: str
    primary_territory_id: Optional[str] = None
    
    @validator("password")
    def validate_password(cls, v):
        """Validate password strength."""
        is_valid, error = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError(error)
        return v


class UserLogin(BaseModel):
    """User login schema."""
    username: str
    password: str
    mfa_token: Optional[str] = None


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str


class RefreshToken(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    role: Optional[str] = None
    organization_id: Optional[str] = None
    primary_territory_id: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    id: str
    is_active: bool = True
    is_superuser: bool = False
    role: str
    organization_id: str
    primary_territory_id: Optional[str] = None
    mfa_enabled: bool = False
    force_password_change: bool = False
    last_login: Optional[str] = None
    
    class Config:
        """Pydantic config."""
        from_attributes = True


class LogoutResponse(BaseModel):
    """Logout response schema."""
    message: str 