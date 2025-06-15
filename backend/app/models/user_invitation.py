"""User Invitation model for the healthcare IVR platform."""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class UserInvitation(Base):
    """User invitation model for tracking invitations across all user types."""

    __tablename__ = "user_invitations"

    # Primary key
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4, index=True
    )

    # Invitation details
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    invitation_token: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    invitation_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # 'doctor', 'sales', 'distributor', etc.

    # User information
    first_name: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    last_name: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    organization_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)

    # Invitation status and lifecycle
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", index=True
    )  # 'pending', 'sent', 'accepted', 'expired', 'cancelled', 'failed'
    invited_by_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    invited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # Hierarchy relationships (for sales chain invitations)
    parent_sales_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    parent_distributor_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    parent_master_distributor_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    parent_doctor_id: Mapped[Optional[PyUUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Additional invitation data
    invitation_message: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    invitation_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )

    # Email tracking
    email_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    last_email_sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    email_delivery_status: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # 'pending', 'delivered', 'bounced', 'failed'

    # Security and audit
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    organization = relationship("Organization", back_populates="invitations")
    invited_by = relationship(
        "User",
        foreign_keys=[invited_by_id],
        back_populates="sent_invitations"
    )
    parent_sales = relationship(
        "User",
        foreign_keys=[parent_sales_id],
        back_populates="sales_invitations"
    )
    parent_distributor = relationship(
        "User",
        foreign_keys=[parent_distributor_id],
        back_populates="distributor_invitations"
    )
    parent_master_distributor = relationship(
        "User",
        foreign_keys=[parent_master_distributor_id],
        back_populates="master_distributor_invitations"
    )
    parent_doctor = relationship(
        "User",
        foreign_keys=[parent_doctor_id],
        back_populates="practice_invitations"
    )

    # Reverse relationship to users created from this invitation
    created_user = relationship(
        "User",
        foreign_keys="User.original_invitation_id",
        back_populates="original_invitation",
        uselist=False
    )

    def __repr__(self) -> str:
        """String representation of the invitation."""
        return (f"<UserInvitation(email='{self.email}', "
                f"type='{self.invitation_type}', "
                f"status='{self.status}')>")

    @property
    def full_name(self) -> Optional[str]:
        """Get the invitee's full name if available."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return None

    @property
    def is_expired(self) -> bool:
        """Check if the invitation has expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def is_pending(self) -> bool:
        """Check if the invitation is still pending."""
        return self.status == "pending" and not self.is_expired

    @property
    def is_accepted(self) -> bool:
        """Check if the invitation has been accepted."""
        return self.status == "accepted" and self.accepted_at is not None

    @property
    def days_until_expiry(self) -> int:
        """Get the number of days until expiry."""
        if self.is_expired:
            return 0
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)

    def mark_as_sent(self) -> None:
        """Mark the invitation as sent."""
        self.status = "sent"
        self.sent_at = datetime.utcnow()
        # Ensure email_attempts is initialized
        if self.email_attempts is None:
            self.email_attempts = 0
        self.email_attempts += 1
        self.last_email_sent_at = datetime.utcnow()

    def mark_as_accepted(self) -> None:
        """Mark the invitation as accepted."""
        self.status = "accepted"
        self.accepted_at = datetime.utcnow()

    def mark_as_expired(self) -> None:
        """Mark the invitation as expired."""
        self.status = "expired"

    def mark_as_cancelled(self) -> None:
        """Mark the invitation as cancelled."""
        self.status = "cancelled"

    def mark_as_failed(self, reason: Optional[str] = None) -> None:
        """Mark the invitation as failed."""
        self.status = "failed"
        self.email_delivery_status = "failed"
        if reason:
            # Ensure invitation_metadata is initialized
            if self.invitation_metadata is None:
                self.invitation_metadata = {}
            self.invitation_metadata["failure_reason"] = reason

    def increment_email_attempts(self) -> None:
        """Increment the email attempt counter."""
        # Ensure email_attempts is initialized
        if self.email_attempts is None:
            self.email_attempts = 0
        self.email_attempts += 1
        self.last_email_sent_at = datetime.utcnow()

    def set_email_delivery_status(self, status: str) -> None:
        """Set the email delivery status."""
        valid_statuses = ["pending", "delivered", "bounced", "failed"]
        if status in valid_statuses:
            self.email_delivery_status = status

    def extend_expiry(self, days: int = 7) -> None:
        """Extend the invitation expiry by the specified number of days."""
        self.expires_at = datetime.utcnow() + timedelta(days=days)

    def get_invitation_url(self, base_url: str) -> str:
        """Generate the invitation acceptance URL."""
        return f"{base_url}/accept-invitation?token={self.invitation_token}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert the invitation to a dictionary."""
        return {
            "id": str(self.id),
            "email": self.email,
            "invitation_token": self.invitation_token,
            "invitation_type": self.invitation_type,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "organization_id": (
                str(self.organization_id) if self.organization_id else None
            ),
            "role_name": self.role_name,
            "status": self.status,
            "invited_by_id": (
                str(self.invited_by_id) if self.invited_by_id else None
            ),
            "invited_at": (
                self.invited_at.isoformat() if self.invited_at else None
            ),
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "accepted_at": (
                self.accepted_at.isoformat() if self.accepted_at else None
            ),
            "expires_at": (
                self.expires_at.isoformat() if self.expires_at else None
            ),
            "invitation_message": self.invitation_message,
            "invitation_metadata": self.invitation_metadata,
            "email_attempts": self.email_attempts,
            "email_delivery_status": self.email_delivery_status,
            "is_expired": self.is_expired,
            "is_pending": self.is_pending,
            "is_accepted": self.is_accepted,
            "days_until_expiry": self.days_until_expiry,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat() if self.updated_at else None
            ),
        }

    @classmethod
    def create_invitation(
        cls,
        email: str,
        invitation_type: str,
        role_name: str,
        invited_by_id: PyUUID,
        organization_id: Optional[PyUUID] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        invitation_message: Optional[str] = None,
        expires_in_days: int = 7,
        **hierarchy_kwargs
    ) -> "UserInvitation":
        """Create a new invitation with default values."""
        import secrets

        invitation_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        return cls(
            email=email,
            invitation_token=invitation_token,
            invitation_type=invitation_type,
            first_name=first_name,
            last_name=last_name,
            organization_id=organization_id,
            role_name=role_name,
            invited_by_id=invited_by_id,
            expires_at=expires_at,
            invitation_message=invitation_message,
            status="pending",
            email_attempts=0,  # Explicitly set default value
            invitation_metadata={},  # Explicitly set default value
            **hierarchy_kwargs
        )