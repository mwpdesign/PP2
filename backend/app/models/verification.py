from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID, uuid4

from app.db.base_class import Base


class Verification(Base):
    """Verification model."""
    __tablename__ = "verifications"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        unique=True,
        nullable=False
    )
    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("patients.id"),
        nullable=False
    )
    provider_id: Mapped[UUID] = mapped_column(
        ForeignKey("providers.id"),
        nullable=False
    )
    insurance_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    insurance_group: Mapped[str] = mapped_column(
        String(50),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    notes: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )
    created_by_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
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