"""Role-Based Access Control models for the healthcare IVR platform."""

from datetime import datetime
from typing import Optional
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base


class UserRole(Base):
    """Association model for user-role relationship."""

    __tablename__ = "user_roles"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    role_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    assigned_by: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


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
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    organization_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    created_by: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    updated_by: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    users = relationship(
        "User",
        secondary="user_roles",
        primaryjoin="Role.id == user_roles.c.role_id",
        secondaryjoin="User.id == user_roles.c.user_id",
        back_populates="roles"
    )
    permissions = relationship(
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
        "Role", secondary="role_permissions",
        back_populates="permissions"
    )

    def __repr__(self):
        """String representation of the permission."""
        return f"<Permission(name='{self.name}')>"


class DelegationPermission(Base):
    """Model for delegation permissions allowing proxy user actions."""

    __tablename__ = "delegation_permissions"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Who is delegating (e.g., doctor)
    delegator_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Who is receiving delegation (e.g., office administrator)
    delegate_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Organization context
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Delegation details
    permissions: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list,
        comment="List of permissions being delegated "
                "(e.g., ['ivr:submit', 'patient:view'])"
    )

    # Delegation scope and constraints
    scope_restrictions: Mapped[dict] = mapped_column(
        JSON, nullable=False, server_default="{}",
        comment="Restrictions on delegation scope "
                "(e.g., specific patients, territories)"
    )

    # Status and validity
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="When this delegation expires (null = no expiration)"
    )

    # Approval workflow
    requires_approval: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="Whether delegated actions require approval"
    )
    approved_by_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Audit fields
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Additional metadata
    delegation_reason: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment="Reason for delegation (e.g., 'Vacation coverage', "
                "'Administrative support')"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment="Additional notes about the delegation"
    )

    # Relationships
    delegator = relationship(
        "User", foreign_keys=[delegator_id],
        back_populates="delegations_given"
    )
    delegate = relationship(
        "User", foreign_keys=[delegate_id],
        back_populates="delegations_received"
    )
    organization = relationship(
        "Organization", back_populates="delegation_permissions"
    )
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

    def __repr__(self):
        """String representation of the delegation permission."""
        return (f"<DelegationPermission(delegator={self.delegator_id}, "
                f"delegate={self.delegate_id})>")

    def is_valid(self) -> bool:
        """Check if delegation is currently valid."""
        if not self.is_active:
            return False

        if self.expires_at and self.expires_at < datetime.utcnow():
            return False

        if self.requires_approval and not self.approved_at:
            return False

        return True

    def has_permission(self, permission: str) -> bool:
        """Check if this delegation includes a specific permission."""
        return permission in self.permissions or "*" in self.permissions
