from sqlalchemy import Column, String, ForeignKey, DateTime, JSON, Integer, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base
from app.core.security import generate_uuid

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

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    provider_id = Column(String(36), ForeignKey("providers.id"), nullable=False)
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False)
    territory_id = Column(String(36), ForeignKey("provider_territories.id"), nullable=False)
    
    # Request Details
    service_type = Column(String(100), nullable=False)
    priority = Column(Enum(IVRPriority), default=IVRPriority.MEDIUM)
    status = Column(Enum(IVRStatus), default=IVRStatus.SUBMITTED)
    current_reviewer_id = Column(String(36), ForeignKey("users.id"))
    
    # Metadata
    metadata = Column(JSON, default={})
    notes = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient")
    provider = relationship("Provider")
    facility = relationship("Facility")
    territory = relationship("ProviderTerritory")
    current_reviewer = relationship("User", foreign_keys=[current_reviewer_id])
    status_history = relationship("IVRStatusHistory", back_populates="ivr_request")
    approvals = relationship("IVRApproval", back_populates="ivr_request")
    escalations = relationship("IVREscalation", back_populates="ivr_request")
    reviews = relationship("IVRReview", back_populates="ivr_request")
    documents = relationship("IVRDocument", back_populates="ivr_request")

class IVRStatusHistory(Base):
    __tablename__ = "ivr_status_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ivr_request_id = Column(String(36), ForeignKey("ivr_requests.id"), nullable=False)
    from_status = Column(Enum(IVRStatus))
    to_status = Column(Enum(IVRStatus), nullable=False)
    changed_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="status_history")
    changed_by = relationship("User")

class IVRApproval(Base):
    __tablename__ = "ivr_approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ivr_request_id = Column(String(36), ForeignKey("ivr_requests.id"), nullable=False)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    approval_level = Column(Integer, default=1)  # For multi-level approvals
    decision = Column(String(20), nullable=False)  # approved, rejected
    reason = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="approvals")
    approver = relationship("User")

class IVREscalation(Base):
    __tablename__ = "ivr_escalations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ivr_request_id = Column(String(36), ForeignKey("ivr_requests.id"), nullable=False)
    escalated_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    escalated_to_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(String(500), nullable=False)
    resolved = Column(String(10), default="pending")  # pending, resolved
    resolution_notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="escalations")
    escalated_by = relationship("User", foreign_keys=[escalated_by_id])
    escalated_to = relationship("User", foreign_keys=[escalated_to_id])

class IVRReview(Base):
    __tablename__ = "ivr_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ivr_request_id = Column(String(36), ForeignKey("ivr_requests.id"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="assigned")  # assigned, in_progress, completed
    notes = Column(String(1000))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="reviews")
    reviewer = relationship("User")

class IVRDocument(Base):
    __tablename__ = "ivr_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ivr_request_id = Column(String(36), ForeignKey("ivr_requests.id"), nullable=False)
    document_type = Column(String(50), nullable=False)  # insurance_card, prescription, etc.
    document_key = Column(String(255), nullable=False)  # S3 key
    uploaded_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, verified
    verification_notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="documents")
    uploaded_by = relationship("User")

class IVRSession(Base):
    """IVR session model."""

    __tablename__ = "ivr_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey("territories.id"),
        nullable=False
    )
    status = Column(
        String(20),
        nullable=False,
        default='pending'
    )
    insurance_data = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    updated_at = Column(
        DateTime,
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

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ivr_sessions.id"),
        nullable=False
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False
    )
    quantity = Column(Integer, nullable=False)
    notes = Column(String(1000), nullable=True)
    insurance_coverage = Column(JSON, nullable=True)
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    session = relationship("IVRSession", back_populates="items")
    product = relationship("Product") 