"""Patient data models with field-level encryption for PHI."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON, ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.core.encrypted_types import (
    EncryptedString, EncryptedText
)
from app.models.user import User


class Patient(Base):
    """Patient model with encrypted PHI fields."""

    __tablename__ = "patients"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    external_id: Mapped[Optional[str]] = mapped_column(
        String(100), unique=True, nullable=True
    )
    # Encrypted PHI fields using our new encryption types
    # Map to the actual database column names
    first_name: Mapped[str] = mapped_column(
        EncryptedString(field_name="first_name"),
        name="encrypted_first_name",
        nullable=False
    )
    last_name: Mapped[str] = mapped_column(
        EncryptedString(field_name="last_name"),
        name="encrypted_last_name",
        nullable=False
    )
    date_of_birth: Mapped[str] = mapped_column(
        EncryptedString(field_name="date_of_birth"),
        name="encrypted_dob",
        nullable=False
    )
    ssn: Mapped[Optional[str]] = mapped_column(
        EncryptedString(field_name="ssn"),
        name="encrypted_ssn",
        nullable=True
    )
    phone: Mapped[Optional[str]] = mapped_column(
        EncryptedString(field_name="phone"),
        name="encrypted_phone",
        nullable=True
    )
    email: Mapped[Optional[str]] = mapped_column(
        EncryptedString(field_name="email"),
        name="encrypted_email",
        nullable=True
    )
    address: Mapped[Optional[str]] = mapped_column(
        EncryptedText(field_name="address"),
        name="encrypted_address",
        nullable=True
    )
    # Medical history stored as encrypted JSON - need to add column to database
    # medical_history: Mapped[Optional[dict]] = mapped_column(
    #     EncryptedJSON(field_name="medical_history"),
    #     name="encrypted_medical_history",
    #     nullable=True
    # )
    # Insurance information stored as encrypted JSON - need to add column
    # insurance_info: Mapped[Optional[dict]] = mapped_column(
    #     EncryptedJSON(field_name="insurance_info"),
    #     name="encrypted_insurance_info",
    #     nullable=True
    # )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Audit fields
    created_by_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    updated_by_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Organization
    organization_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Facility and Provider
    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False
    )
    provider_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("providers.id"), nullable=False
    )

    # Relationships
    created_by: Mapped[User] = relationship(
        "User", foreign_keys=[created_by_id], back_populates="patients"
    )
    updated_by: Mapped[Optional[User]] = relationship(
        "User", foreign_keys=[updated_by_id], back_populates="updated_patients"
    )
    organization = relationship("Organization", back_populates="patients")
    facility = relationship("Facility", back_populates="patients")
    provider = relationship("Provider", back_populates="patients")
    orders = relationship("Order", back_populates="patient")
    documents: Mapped[list["PatientDocument"]] = relationship(
        "PatientDocument", back_populates="patient"
    )
    secondary_insurance = relationship(
        "SecondaryInsurance", back_populates="patient", uselist=False
    )
    phi_access_logs = relationship("PHIAccess", back_populates="patient")
    ivr_requests = relationship(
        "IVRRequest", back_populates="patient", cascade="all, delete-orphan"
    )
    ivr_sessions = relationship(
        "IVRSession", back_populates="patient", cascade="all, delete-orphan"
    )


class PatientDocument(Base):
    """Patient document model for storing document metadata."""

    __tablename__ = "patient_documents"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    patient_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("patients.id")
    )
    document_type: Mapped[str] = mapped_column(String(50))
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    document_category: Mapped[str] = mapped_column(String(50))
    document_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Add timestamp fields directly
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Add audit fields
    created_by_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    updated_by_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Organization field for access control
    organization_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="documents"
    )
    created_by: Mapped[User] = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_documents"
    )
    updated_by: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[updated_by_id],
        back_populates="updated_documents"
    )
    organization = relationship(
        "Organization",
        back_populates="patient_documents"
    )

    @property
    def full_name(self) -> str:
        """Get patient's full name from encrypted fields."""
        return f"{self.first_name} {self.last_name}"
