"""Secondary insurance model for the healthcare IVR platform."""

from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SecondaryInsurance(Base):
    """Secondary insurance model for patients."""

    __tablename__ = "secondary_insurance"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    insurance_provider: Mapped[str] = mapped_column(
        String(100), nullable=False)
    insurance_id: Mapped[str] = mapped_column(String(100), nullable=False)
    insurance_group: Mapped[str] = mapped_column(String(100), nullable=True)
    insurance_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    coverage_start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    coverage_end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )
    verification_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True, onupdate=datetime.utcnow
    )

    # Relationships
    patient = relationship("Patient", back_populates="secondary_insurance")
    created_by = relationship(
        "User", foreign_keys=[created_by_id], back_populates="secondary_insurance"
    )

    def __repr__(self):
        """String representation of secondary insurance."""
        return f"<SecondaryInsurance(id='{self.id}', provider='{self.insurance_provider}')>"
