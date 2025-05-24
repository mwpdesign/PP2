"""Role-Based Access Control schema definitions."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, constr


class PermissionBase(BaseModel):
    """Base permission schema."""
    name: constr(min_length=1, max_length=50)
    description: Optional[str] = None
    resource_type: constr(min_length=1, max_length=50)
    action: constr(min_length=1, max_length=50)
    conditions: Optional[Dict[str, Any]] = None


class PermissionCreate(PermissionBase):
    """Permission creation schema."""
    pass


class PermissionUpdate(BaseModel):
    """Permission update schema."""
    description: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None


class PermissionInDB(PermissionBase):
    """Internal permission schema."""
    id: UUID
    created_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class PermissionResponse(PermissionInDB):
    """Permission response schema."""
    pass


class RoleBase(BaseModel):
    """Base role schema."""
    name: constr(min_length=1, max_length=50)
    description: Optional[str] = None
    organization_id: UUID
    parent_role_id: Optional[UUID] = None
    permissions: Dict[str, Any] = {}


class RoleCreate(RoleBase):
    """Role creation schema."""
    permission_ids: List[UUID]


class RoleUpdate(BaseModel):
    """Role update schema."""
    name: Optional[constr(min_length=1, max_length=50)] = None
    description: Optional[str] = None
    parent_role_id: Optional[UUID] = None
    permissions: Optional[Dict[str, Any]] = None
    permission_ids: Optional[List[UUID]] = None


class RoleInDB(RoleBase):
    """Internal role schema."""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class RoleResponse(RoleInDB):
    """Role response schema."""
    assigned_permissions: List[PermissionResponse] 