"""User schemas."""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel


class RoleBase(BaseModel):
    """Base role schema."""
    name: str
    description: Optional[str] = None
    permissions: List[str] = []
    role_metadata: Dict = {}


class RoleCreate(RoleBase):
    """Role creation schema."""
    organization_id: UUID


class RoleUpdate(RoleBase):
    """Role update schema."""
    pass


class RoleResponse(RoleBase):
    """Role response schema."""
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class UserRoleAssign(BaseModel):
    """User role assignment schema."""
    role_id: UUID 