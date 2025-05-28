from typing import Optional
from pydantic import BaseModel, EmailStr, Field, constr


class UserRegistration(BaseModel):
    """User registration request model."""
    email: EmailStr
    password: constr(min_length=8)
    first_name: str
    last_name: str
    phone_number: Optional[str] = None


class UserLogin(BaseModel):
    """User login request model."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Authentication token response model."""
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    expires_in: Optional[int] = None


class PasswordReset(BaseModel):
    """Password reset request model."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation model."""
    email: EmailStr
    confirmation_code: str
    new_password: constr(min_length=8)


class UserProfile(BaseModel):
    """User profile response model."""
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    email_verified: bool = Field(default=False)
    created_at: Optional[str] = None
