from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID, uuid4

from app.db.base_class import Base


class Order(Base):
    """Order model."""
    __tablename__ = "orders"

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
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
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