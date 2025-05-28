"""Token schemas."""
from uuid import UUID
from pydantic import BaseModel


class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data schema."""
    email: str | None = None
    id: UUID | None = None
    organization_id: UUID | None = None
    permissions: list[str] = []
    role: str | None = None 