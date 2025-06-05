"""
Role-based access control models.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID as PyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Role(Base):
    """Role model for access control."""

    __tablename__ = "roles"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    permissions: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    role_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    users = relationship(
        "User", secondary="user_roles", back_populates="roles")


class User(Base):
    """Extended user model with role associations."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    organization_id: Mapped[UUID] = mapped_column(
        PyUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    user_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    organization = relationship("Organization", back_populates="users")
    roles = relationship(
        "Role",
        secondary="user_roles",
        back_populates="users"
    )
    audit_logs = relationship("AuditLog", back_populates="user")

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        if self.is_superuser:
            return True

        return any(permission in role.permissions for role in self.roles)

    def has_any_permission(self, permissions: List[str]) -> bool:
        """Check if user has any of the specified permissions."""
        if self.is_superuser:
            return True

        return any(
            any(p in role.permissions for p in permissions) for role in self.roles
        )
