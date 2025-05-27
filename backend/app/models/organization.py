"""Organization model for the healthcare IVR platform."""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Organization(Base):
    """Model for healthcare organizations."""

    __tablename__ = "organizations"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    settings: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default='{}'
    )
    security_policy: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default='{}'
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=datetime.utcnow
    )

    # Relationships
    users = relationship("User", back_populates="organization")
    facilities = relationship("Facility", back_populates="organization")
    territories = relationship("Territory", back_populates="organization")
    roles = relationship("Role", back_populates="organization")
    patients = relationship("Patient", back_populates="organization")

    def __repr__(self):
        """String representation of the organization."""
        return f"<Organization(name='{self.name}')>"