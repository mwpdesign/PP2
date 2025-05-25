"""IVR models for request tracking and workflow management."""
from sqlalchemy import (
    String, ForeignKey, DateTime,
    JSON, Integer, Enum
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import enum
from sqlalchemy.dialects.postgresql import UUID
from uuid import UUID as PyUUID, uuid4

from app.core.database import Base


class IVRStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    CANCELLED = "cancelled"


class IVRPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class IVRRequest(Base):
    __tablename__ = "ivr_requests"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    facility_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("facilities.id"),
        nullable=False
    )
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("territories.id"),
        nullable=False
    )
    
    # Request Details
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[IVRPriority] = mapped_column(
        Enum(IVRPriority),
        default=IVRPriority.MEDIUM
    )
    status: Mapped[IVRStatus] = mapped_column(
        Enum(IVRStatus),
        default=IVRStatus.SUBMITTED
    )
    current_reviewer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    
    # Metadata
    request_metadata: Mapped[dict] = mapped_column(JSON, default={})
    notes: Mapped[str] = mapped_column(String(1000), nullable=True)
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
    patient = relationship("Patient", back_populates="ivr_requests")
    provider = relationship("Provider", back_populates="ivr_requests")
    facility = relationship("Facility", back_populates="ivr_requests")
    territory = relationship("Territory", back_populates="ivr_requests")
    current_reviewer = relationship(
        "User",
        foreign_keys=[current_reviewer_id],
        back_populates="ivr_reviews"
    )
    status_history = relationship(
        "IVRStatusHistory",
        back_populates="ivr_request"
    )
    approvals = relationship(
        "IVRApproval",
        back_populates="ivr_request"
    )
    escalations = relationship(
        "IVREscalation",
        back_populates="ivr_request"
    )
    reviews = relationship(
        "IVRReview",
        back_populates="ivr_request"
    )
    documents = relationship(
        "IVRDocument",
        back_populates="ivr_request"
    )


class IVRStatusHistory(Base):
    __tablename__ = "ivr_status_history"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=False
    )
    from_status: Mapped[IVRStatus] = mapped_column(
        Enum(IVRStatus),
        nullable=True
    )
    to_status: Mapped[IVRStatus] = mapped_column(
        Enum(IVRStatus),
        nullable=False
    )
    changed_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="status_history")
    changed_by = relationship("User", back_populates="ivr_status_changes")


class IVRApproval(Base):
    __tablename__ = "ivr_approvals"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=False
    )
    approver_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    approval_level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False
    )
    decision: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="approvals")
    approver = relationship("User", back_populates="ivr_approvals")


class IVREscalation(Base):
    __tablename__ = "ivr_escalations"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=False
    )
    escalated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    escalated_to_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    resolved: Mapped[str] = mapped_column(
        String(10),
        default="pending",
        nullable=False
    )
    resolution_notes: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    resolved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="escalations")
    escalated_by = relationship(
        "User",
        foreign_keys=[escalated_by_id],
        back_populates="ivr_escalations_created"
    )
    escalated_to = relationship(
        "User",
        foreign_keys=[escalated_to_id],
        back_populates="ivr_escalations_assigned"
    )


class IVRReview(Base):
    __tablename__ = "ivr_reviews"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=False
    )
    reviewer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="assigned",
        nullable=False
    )
    notes: Mapped[str] = mapped_column(
        String(1000),
        nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="reviews")
    reviewer = relationship("User", back_populates="ivr_reviews")


class IVRDocument(Base):
    __tablename__ = "ivr_documents"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=False
    )
    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    document_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    uploaded_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )
    verification_notes: Mapped[str] = mapped_column(
        String(500),
        nullable=True
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
    ivr_request = relationship("IVRRequest", back_populates="documents")
    uploaded_by = relationship("User", back_populates="uploaded_documents")


class IVRSession(Base):
    """IVR session model."""

    __tablename__ = "ivr_sessions"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("territories.id"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default='pending'
    )
    insurance_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=True
    )
    session_metadata: Mapped[dict] = mapped_column(
        JSON,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    patient = relationship(
        "Patient",
        back_populates="ivr_sessions"
    )
    provider = relationship(
        "Provider",
        back_populates="ivr_sessions"
    )
    territory = relationship(
        "Territory",
        back_populates="ivr_sessions"
    )
    items = relationship(
        "IVRSessionItem",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class IVRSessionItem(Base):
    """IVR session item model."""

    __tablename__ = "ivr_session_items"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    session_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_sessions.id"),
        nullable=False
    )
    product_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    notes: Mapped[str] = mapped_column(
        String(1000),
        nullable=True
    )
    insurance_coverage: Mapped[dict] = mapped_column(
        JSON,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    session = relationship("IVRSession", back_populates="items")
    product = relationship("Product") 