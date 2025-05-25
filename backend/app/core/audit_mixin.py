"""Audit mixin for tracking model changes."""
from datetime import datetime
from uuid import UUID as PyUUID
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declared_attr, Mapped, mapped_column


class AuditMixin:
    """Mixin class for adding audit fields to models."""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )

    # Relationships
    @declared_attr
    def created_by(cls):
        """Relationship to user who created the record."""
        return relationship(
            "User",
            foreign_keys=[cls.created_by_id],
            backref="created_records"
        )

    @declared_attr
    def updated_by(cls):
        """Relationship to user who last updated the record."""
        return relationship(
            "User",
            foreign_keys=[cls.updated_by_id],
            backref="updated_records"
        ) 