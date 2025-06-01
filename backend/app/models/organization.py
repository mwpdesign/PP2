"""Organization model for the healthcare IVR platform."""

from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import Optional

from app.core.database import Base


class Organization(Base):
    """Model for healthcare organizations."""

    __tablename__ = "organizations"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    security_policy: Mapped[dict] = mapped_column(
        JSON, nullable=False, server_default="{}"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    users = relationship("User", back_populates="organization")
    facilities = relationship("Facility", back_populates="organization")
    providers = relationship("Provider", back_populates="organization")
    patients = relationship("Patient", back_populates="organization")
    orders = relationship("Order", back_populates="organization")
    audit_logs = relationship("AuditLog", back_populates="organization")
    roles = relationship("Role", back_populates="organization")
    patient_documents = relationship("PatientDocument", back_populates="organization")

    def __repr__(self):
        """String representation of the organization."""
        return f"<Organization(name='{self.name}')>"
