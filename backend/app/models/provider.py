from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID as PyUUID, uuid4

from app.core.database import Base


class Provider(Base):
    """Healthcare Provider model"""
    __tablename__ = "providers"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        unique=True,
        nullable=False
    )
    # Basic Information
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    npi: Mapped[str] = mapped_column(
        String(10),  # National Provider Identifier
        unique=True,
        nullable=False,
        index=True
    )
    tax_id: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        nullable=False,
        comment="ENCRYPTED"
    )

    # Contact Information
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    fax: Mapped[str] = mapped_column(
        String(20),
        nullable=True
    )
    address_line1: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    address_line2: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    state: Mapped[str] = mapped_column(
        String(2),
        nullable=False
    )
    zip_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )

    # Provider Details
    specialty: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    accepting_new_patients: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    insurance_networks: Mapped[str] = mapped_column(
        Text,  # Stored as JSON string
        nullable=True
    )
    office_hours: Mapped[str] = mapped_column(
        Text,  # Stored as JSON string
        nullable=True
    )

    # Metadata
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
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
        ForeignKey("users.id"),
        nullable=False
    )

    # Relationships
    created_by = relationship("User", back_populates="providers")
    patients = relationship("Patient", back_populates="provider")
    orders = relationship("Order", back_populates="provider") 