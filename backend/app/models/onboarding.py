"""Onboarding models for the healthcare IVR platform."""

from datetime import datetime
from sqlalchemy import (
    String, Boolean, DateTime, Integer, ForeignKey, Column, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from typing import TYPE_CHECKING

from app.core.database import Base

if TYPE_CHECKING:
    from .user import User  # noqa: F401


class OnboardingProgress(Base):
    """Onboarding progress tracking model."""

    __tablename__ = "onboarding_progress"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid4, index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    step_name = Column(String(100), nullable=False)
    step_order = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    data = Column(JSON, default=dict)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="onboarding_steps")

    def __repr__(self) -> str:
        """String representation of the onboarding progress."""
        return (
            f"<OnboardingProgress(user_id='{self.user_id}', "
            f"step='{self.step_name}', completed={self.completed})>"
        )

    def mark_completed(self) -> None:
        """Mark this step as completed."""
        self.completed = True
        self.completed_at = datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "step_name": self.step_name,
            "step_order": self.step_order,
            "completed": self.completed,
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "data": self.data,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat() if self.updated_at else None
            ),
        }