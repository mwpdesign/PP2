from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID, uuid4

from app.core.database import Base


class Patient(Base):
    """Patient model with HIPAA-compliant data fields"""
    __tablename__ = "patients"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        unique=True,
        nullable=False
    )
    # Basic Information (Encrypted)
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="ENCRYPTED"
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="ENCRYPTED"
    )
    date_of_birth: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="ENCRYPTED"
    )
    ssn: Mapped[str] = mapped_column(
        String(11),  # Format: XXX-XX-XXXX
        nullable=False,
        comment="ENCRYPTED"
    )

    # Contact Information (Encrypted)
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        comment="ENCRYPTED"
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="ENCRYPTED"
    )
    address_line1: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="ENCRYPTED"
    )
    address_line2: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        comment="ENCRYPTED"
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="ENCRYPTED"
    )
    state: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
        comment="ENCRYPTED"
    )
    zip_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="ENCRYPTED"
    )

    # Insurance Information (Encrypted)
    insurance_provider: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="ENCRYPTED"
    )
    insurance_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="ENCRYPTED"
    )
    insurance_group: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
        comment="ENCRYPTED"
    )
    insurance_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=True,
        comment="ENCRYPTED"
    )

    # Medical Information (Encrypted)
    medical_history: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="ENCRYPTED"
    )
    allergies: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="ENCRYPTED"
    )
    medications: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="ENCRYPTED"
    )

    # Metadata
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
    created_by_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )
    provider_id: Mapped[UUID] = mapped_column(
        ForeignKey("providers.id"),
        nullable=False
    )

    # Relationships
    created_by = relationship("User", back_populates="patients")
    provider = relationship("Provider", back_populates="patients")
    orders = relationship("Order", back_populates="patient") 