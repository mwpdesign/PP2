"""Role-Based Access Control models for the healthcare IVR platform."""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Table, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


# Association table for role-permission relationship
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column(
        'role_id',
        UUID(as_uuid=True),
        ForeignKey('roles.id'),
        primary_key=True
    ),
    Column(
        'permission_id',
        UUID(as_uuid=True),
        ForeignKey('permissions.id'),
        primary_key=True
    ),
    Column(
        'granted_at',
        DateTime,
        nullable=False,
        default=datetime.utcnow
    ),
    Column(
        'granted_by',
        UUID(as_uuid=True),
        ForeignKey('users.id')
    )
)


class Role(Base):
    """Role model for RBAC."""
    
    __tablename__ = 'roles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    description = Column(String(255))
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id')
    )
    parent_role_id = Column(
        UUID(as_uuid=True),
        ForeignKey('roles.id')
    )
    permissions = Column(JSON, nullable=False, server_default='{}')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    parent_role = relationship("Role", remote_side=[id])
    assigned_permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles"
    )
    accessible_territories = relationship(
        "Territory",
        secondary="territory_role_access",
        back_populates="allowed_roles"
    )

    def __repr__(self):
        """String representation of the role."""
        return f"<Role(name='{self.name}')>"


class Permission(Base):
    """Permission model for RBAC."""
    
    __tablename__ = 'permissions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(String(255))
    resource_type = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    conditions = Column(JSON, nullable=False, server_default='{}')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    roles = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="assigned_permissions"
    )

    def __repr__(self):
        """String representation of the permission."""
        return f"<Permission(name='{self.name}')>" 