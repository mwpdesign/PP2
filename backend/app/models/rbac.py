"""Role-Based Access Control models for the healthcare IVR platform."""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Table, JSON, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

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
        DateTime(timezone=True),
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

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String(255))
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id')
    )
    parent_role_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('roles.id')
    )
    permissions: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default='{}'
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=datetime.utcnow
    )

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    parent_role = relationship("Role", remote_side=[id])
    users = relationship("User", back_populates="role")
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

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(String(255))
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    conditions: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default='{}'
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    roles = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="assigned_permissions"
    )

    def __repr__(self):
        """String representation of the permission."""
        return f"<Permission(name='{self.name}')>"