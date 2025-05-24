"""Audit mixin for tracking model changes."""
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declared_attr


class AuditMixin:
    """Mixin class for adding audit fields to models."""
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id = Column(
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