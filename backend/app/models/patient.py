"""Patient data models with field-level encryption for PHI."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Patient(Base):
    """Patient model with encrypted PHI fields."""
    __tablename__ = "patients"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True
    )
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime)
    insurance_provider: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    insurance_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    territory_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("territories.id")
    )

    # Add timestamp fields directly
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    documents: Mapped[list["PatientDocument"]] = relationship(
        "PatientDocument",
        back_populates="patient"
    )


class PatientDocument(Base):
    """Patient document model for storing document metadata."""
    __tablename__ = "patient_documents"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True
    )
    patient_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("patients.id")
    )
    document_type: Mapped[str] = mapped_column(String(50))
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    document_category: Mapped[str] = mapped_column(String(50))
    document_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_by: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id")
    )
    territory_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("territories.id")
    )

    # Add timestamp fields directly
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="documents"
    )

    @property
    def full_name(self) -> str:
        """Get patient's full name."""
        return f"{self.first_name} {self.last_name}" 