"""Role-Based Access Control models for the healthcare IVR platform."""

from datetime import datetime
from typing import Optional
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base


class RolePermission(Base):
    """Association model for role-permission relationship."""

    __tablename__ = "role_permissions"

    role_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    )
    permission_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permissions.id"), primary_key=True
    )
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    granted_by: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )


class Role(Base):
    """Role model for RBAC."""

    __tablename__ = "roles"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String(255))
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    parent_role_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True
    )
    permissions: Mapped[dict] = mapped_column(
        JSON, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    parent_role = relationship("Role", remote_side=[id])
    users = relationship("User", back_populates="role")
    assigned_permissions = relationship(
        "Permission", secondary="role_permissions", back_populates="roles"
    )

    def __repr__(self):
        """String representation of the role."""
        return f"<Role(name='{self.name}')>"


class Permission(Base):
    """Permission model for RBAC."""

    __tablename__ = "permissions"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    conditions: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Relationships
    roles = relationship(
        "Role", secondary="role_permissions", back_populates="assigned_permissions"
    )

    def __repr__(self):
        """String representation of the permission."""
        return f"<Permission(name='{self.name}')>"
