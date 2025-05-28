from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID as PyUUID, uuid4
from typing import Optional

from app.core.database import Base


class Provider(Base):
    """Healthcare Provider model"""
    __tablename__ = "providers"
    __table_args__ = {'extend_existing': True}

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        unique=True,
        nullable=False
    )
    # Organization
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
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
    organization = relationship("Organization", back_populates="providers")
    created_by = relationship("User", back_populates="providers")
    patients = relationship(
        "Patient",
        foreign_keys="Patient.provider_id",
        back_populates="provider"
    )
    orders = relationship("Order", back_populates="provider")
    credentials = relationship(
        "ProviderCredentials",
        back_populates="provider",
        cascade="all, delete-orphan"
    )

    # IVR relationships
    ivr_requests = relationship(
        "IVRRequest",
        back_populates="provider",
        cascade="all, delete-orphan"
    )
    ivr_sessions = relationship(
        "IVRSession",
        back_populates="provider",
        cascade="all, delete-orphan"
    )

    # Provider relationships
    provider_relationships = relationship(
        "ProviderRelationship",
        foreign_keys="ProviderRelationship.provider_id",
        back_populates="provider",
        cascade="all, delete-orphan"
    )
    related_provider_relationships = relationship(
        "ProviderRelationship",
        foreign_keys="ProviderRelationship.related_provider_id",
        back_populates="related_provider",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Provider(id={self.id}, name={self.name})>"


class ProviderCredentials(Base):
    """Provider credentials and certification information."""
    __tablename__ = "provider_credentials"
    __table_args__ = {'extend_existing': True}

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    credential_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="License, Certificate, etc."
    )
    credential_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="ENCRYPTED"
    )
    issuing_authority: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    issue_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    expiration_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False
    )
    document_key: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="S3 key for stored document"
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

    # Relationships
    provider = relationship("Provider", back_populates="credentials")


class ProviderRelationship(Base):
    """Provider relationship model for managing provider-to-provider
    relationships."""
    __tablename__ = "provider_relationships"
    __table_args__ = {'extend_existing': True}

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    related_provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    relationship_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
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

    # Relationships
    provider = relationship(
        "Provider",
        foreign_keys=[provider_id],
        back_populates="provider_relationships"
    )
    related_provider = relationship(
        "Provider",
        foreign_keys=[related_provider_id],
        back_populates="related_provider_relationships"
    )

    def __repr__(self):
        return (
            f"<ProviderRelationship("
            f"provider_id={self.provider_id}, "
            f"related_provider_id={self.related_provider_id}, "
            f"type={self.relationship_type})>"
        )