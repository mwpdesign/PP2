"""IVR models for the healthcare platform."""

from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, JSON, Enum, Integer, Numeric
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.enums import IVRPriority, IVRStatus


class IVRRequest(Base):
    __tablename__ = "ivr_requests"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False
    )
    facility_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("facilities.id"), nullable=False
    )

    # Request Details
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[IVRPriority] = mapped_column(
        Enum(IVRPriority), default=IVRPriority.MEDIUM
    )
    status: Mapped[IVRStatus] = mapped_column(
        Enum(IVRStatus), default=IVRStatus.SUBMITTED
    )
    current_reviewer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Metadata
    request_metadata: Mapped[dict] = mapped_column(JSON, default={})
    notes: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Simplified Communication Fields
    doctor_comment: Mapped[str] = mapped_column(Text, nullable=True)
    ivr_response: Mapped[str] = mapped_column(Text, nullable=True)
    comment_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    patient = relationship("Patient", back_populates="ivr_requests")
    provider = relationship("Provider", back_populates="ivr_requests")
    facility = relationship("Facility", back_populates="ivr_requests")
    current_reviewer = relationship(
        "User", foreign_keys=[current_reviewer_id],
        back_populates="current_ivr_reviews"
    )
    status_history = relationship(
        "IVRStatusHistory", back_populates="ivr_request"
    )
    approvals = relationship("IVRApproval", back_populates="ivr_request")
    escalations = relationship("IVREscalation", back_populates="ivr_request")
    reviews = relationship("IVRReview", back_populates="ivr_request")
    documents = relationship("IVRDocument", back_populates="ivr_request")
    products = relationship(
        "IVRProduct", back_populates="ivr_request",
        cascade="all, delete-orphan"
    )
    communication_messages = relationship(
        "IVRCommunicationMessage", back_populates="ivr_request",
        cascade="all, delete-orphan",
        order_by="IVRCommunicationMessage.created_at"
    )


class IVRProduct(Base):
    """IVR Product model for multi-size product selection."""

    __tablename__ = "ivr_products"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    q_code: Mapped[str] = mapped_column(String(50), nullable=False)
    total_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_cost: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.00
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="products")
    sizes = relationship(
        "IVRProductSize", back_populates="ivr_product",
        cascade="all, delete-orphan"
    )


class IVRProductSize(Base):
    """IVR Product Size model for individual size variants and quantities."""

    __tablename__ = "ivr_product_sizes"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_product_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_products.id"), nullable=False
    )
    size: Mapped[str] = mapped_column(String(10), nullable=False)  # "2X2", "2X3", etc.
    dimensions: Mapped[str] = mapped_column(String(20), nullable=False)  # "2x2 cm", etc.
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    ivr_product = relationship("IVRProduct", back_populates="sizes")


class IVRStatusHistory(Base):
    __tablename__ = "ivr_status_history"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    from_status: Mapped[IVRStatus] = mapped_column(
        Enum(IVRStatus), nullable=True)
    to_status: Mapped[IVRStatus] = mapped_column(
        Enum(IVRStatus),
        nullable=False
    )
    changed_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="status_history")
    changed_by = relationship("User", back_populates="ivr_status_changes")


class IVRApproval(Base):
    __tablename__ = "ivr_approvals"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    approver_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    approval_level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False
    )
    decision: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="approvals")
    approver = relationship("User", back_populates="ivr_approvals")


class IVREscalation(Base):
    __tablename__ = "ivr_escalations"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    escalated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    escalated_to_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    resolved: Mapped[str] = mapped_column(
        String(10),
        default="pending",
        nullable=False
    )
    resolution_notes: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    resolved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="escalations")
    escalated_by = relationship(
        "User", foreign_keys=[escalated_by_id], back_populates="ivr_escalations_created"
    )
    escalated_to = relationship(
        "User",
        foreign_keys=[escalated_to_id],
        back_populates="ivr_escalations_assigned",
    )


class IVRReview(Base):
    __tablename__ = "ivr_reviews"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    reviewer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="assigned",
        nullable=False
    )
    notes: Mapped[str] = mapped_column(String(1000), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="reviews")
    reviewer = relationship("User", back_populates="ivr_reviews")


class IVRDocument(Base):
    __tablename__ = "ivr_documents"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    document_key: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )
    verification_notes: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="documents")
    uploaded_by = relationship("User", back_populates="uploaded_documents")


class IVRSession(Base):
    """IVR session model."""

    __tablename__ = "ivr_sessions"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending"
    )
    insurance_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    session_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    patient = relationship("Patient", back_populates="ivr_sessions")
    provider = relationship("Provider", back_populates="ivr_sessions")
    items = relationship("IVRSessionItem", back_populates="session")


class IVRSessionItem(Base):
    """IVR session item model."""

    __tablename__ = "ivr_session_items"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    session_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_sessions.id"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)
    item_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Relationships
    session = relationship("IVRSession", back_populates="items")


class IVRCommunicationMessage(Base):
    """IVR communication message model for doctor-IVR specialist communication."""

    __tablename__ = "ivr_communication_messages"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ivr_requests.id"), nullable=False
    )
    author_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Message content
    message: Mapped[str] = mapped_column(String(2000), nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="text"
    )  # text, file, system
    author_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # doctor, ivr_specialist, system
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Attachments (stored as JSON array)
    attachments: Mapped[dict] = mapped_column(JSON, default=[])

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    ivr_request = relationship("IVRRequest", back_populates="communication_messages")
    author = relationship("User")
