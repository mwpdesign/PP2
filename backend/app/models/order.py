"""
Order model for managing medical supply orders.
"""

from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base
from app.core.audit_mixin import AuditMixin
from app.core.encryption import encrypt_field, decrypt_field


class Order(Base, AuditMixin):
    """Order model for managing medical supply orders."""

    __tablename__ = "orders"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    # Organization
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    order_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False)
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    provider_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False
    )
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # IVR Integration Fields (NEW)
    ivr_request_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=True,
        unique=True
    )
    shipping_address: Mapped[dict] = mapped_column(JSONB, nullable=True)
    products: Mapped[dict] = mapped_column(JSONB, nullable=True)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    shipped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    received_by: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Legacy fields
    ivr_session_id: Mapped[str] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "verified",
            "approved",
            "processing",
            "shipped",
            "received",
            "completed",
            "cancelled",
            name="order_status_enum",
        ),
        nullable=False,
        default="pending",
    )
    order_type: Mapped[str] = mapped_column(
        Enum(
            "prescription",
            "medical_equipment",
            "medical_supplies",
            "lab_test",
            "referral",
            name="order_type_enum",
        ),
        nullable=False,
        default="medical_supplies",
    )
    priority: Mapped[str] = mapped_column(
        Enum("routine", "urgent", "emergency", name="order_priority_enum"),
        nullable=False,
        default="routine",
    )
    _total_amount: Mapped[str] = mapped_column(
        String(500), nullable=True
    )  # Encrypted
    _notes: Mapped[str] = mapped_column(Text, nullable=True)  # Encrypted
    _insurance_data: Mapped[str] = mapped_column(
        String(2000), nullable=True
    )  # Encrypted JSON
    _payment_info: Mapped[str] = mapped_column(
        String(2000), nullable=True
    )  # Encrypted JSON
    _delivery_info: Mapped[str] = mapped_column(
        String(2000), nullable=True
    )  # Encrypted JSON
    completion_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    organization = relationship("Organization", back_populates="orders")
    patient = relationship(
        "Patient", foreign_keys=[patient_id], back_populates="orders"
    )
    provider = relationship(
        "Provider", foreign_keys=[provider_id], back_populates="orders"
    )
    created_by = relationship(
        "User", foreign_keys=[created_by_id], back_populates="created_orders"
    )
    updated_by = relationship(
        "User", foreign_keys=[updated_by_id], back_populates="updated_orders"
    )
    received_by_user = relationship(
        "User", foreign_keys=[received_by], back_populates="received_orders"
    )
    ivr_request = relationship(
        "IVRRequest", foreign_keys=[ivr_request_id], back_populates="order"
    )
    shipping_addresses = relationship(
        "ShippingAddress", back_populates="order", cascade="all, delete-orphan"
    )
    shipments = relationship(
        "Shipment", back_populates="order", cascade="all, delete-orphan"
    )
    fulfillment_orders = relationship(
        "FulfillmentOrder", back_populates="order", cascade="all, delete-orphan"
    )
    status_history = relationship(
        "OrderStatusHistory", back_populates="order", cascade="all, delete-orphan"
    )
    documents = relationship(
        "OrderDocument", back_populates="order", cascade="all, delete-orphan"
    )
    treatment_records = relationship(
        "TreatmentRecord",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    @property
    def total_amount(self) -> float:
        """Get decrypted total amount."""
        if self._total_amount:
            return float(decrypt_field(self._total_amount))
        return None

    @total_amount.setter
    def total_amount(self, value: float):
        """Set encrypted total amount."""
        if value is not None:
            self._total_amount = encrypt_field(str(value))
        else:
            self._total_amount = None

    @property
    def notes(self) -> str:
        """Get decrypted notes."""
        if self._notes:
            return decrypt_field(self._notes)
        return None

    @notes.setter
    def notes(self, value: str):
        """Set encrypted notes."""
        if value is not None:
            self._notes = encrypt_field(value)
        else:
            self._notes = None

    @property
    def insurance_data(self) -> dict:
        """Get decrypted insurance data."""
        if self._insurance_data:
            return decrypt_field(self._insurance_data)
        return None

    @insurance_data.setter
    def insurance_data(self, value: dict):
        """Set encrypted insurance data."""
        if value is not None:
            self._insurance_data = encrypt_field(str(value))
        else:
            self._insurance_data = None

    @property
    def payment_info(self) -> dict:
        """Get decrypted payment info."""
        if self._payment_info:
            return decrypt_field(self._payment_info)
        return None

    @payment_info.setter
    def payment_info(self, value: dict):
        """Set encrypted payment info."""
        if value is not None:
            self._payment_info = encrypt_field(str(value))
        else:
            self._payment_info = None

    @property
    def delivery_info(self) -> dict:
        """Get decrypted delivery info."""
        if self._delivery_info:
            return decrypt_field(self._delivery_info)
        return None

    @delivery_info.setter
    def delivery_info(self, value: dict):
        """Set encrypted delivery info."""
        if value is not None:
            self._delivery_info = encrypt_field(str(value))
        else:
            self._delivery_info = None


class OrderStatusHistory(Base):
    """History of order status changes."""

    __tablename__ = "order_status_history"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False
    )
    from_status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "verified",
            "approved",
            "processing",
            "shipped",
            "received",
            "completed",
            "cancelled",
            name="order_status_enum",
        ),
        nullable=True,
    )
    to_status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "verified",
            "approved",
            "processing",
            "shipped",
            "received",
            "completed",
            "cancelled",
            name="order_status_enum",
        ),
        nullable=False,
    )
    changed_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    order = relationship("Order", back_populates="status_history")
    changed_by = relationship(
        "User", foreign_keys=[changed_by_id], back_populates="order_status_changes"
    )


class OrderDocument(Base):
    """Order document model for shipping documents, tracking, POD, etc."""

    __tablename__ = "order_documents"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False
    )
    document_type: Mapped[str] = mapped_column(
        Enum(
            "shipping_label",
            "tracking_info",
            "proof_of_delivery",
            "invoice",
            "packing_slip",
            "insurance_form",
            "other",
            name="order_document_type_enum",
        ),
        nullable=False,
    )
    document_key: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=True)
    uploaded_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
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
    order = relationship("Order", back_populates="documents")
    uploaded_by = relationship(
        "User", back_populates="uploaded_order_documents"
    )
