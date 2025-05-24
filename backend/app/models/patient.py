"""Patient model for storing patient information."""
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID, uuid4

from app.core.database import Base

class Patient(Base):
    """Patient model for storing patient information."""
    __tablename__ = "patients"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        nullable=False
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    insurance_provider: Mapped[str] = mapped_column(String(100), nullable=True)
    insurance_id: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    ) 