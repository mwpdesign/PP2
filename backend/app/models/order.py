"""
Order model for managing medical supply orders.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, UUID, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.audit import AuditMixin


class Order(Base, AuditMixin):
    """Order model for managing medical supply orders."""
    __tablename__ = 'orders'

    id = Column(UUID, primary_key=True, default=uuid4)
    order_number = Column(String(50), unique=True, nullable=False)
    patient_id = Column(UUID, ForeignKey('patients.id'), nullable=False)
    provider_id = Column(UUID, ForeignKey('providers.id'), nullable=False)
    territory_id = Column(UUID, ForeignKey('territories.id'), nullable=False)
    ivr_session_id = Column(String(100))
    status = Column(
        Enum(
            'pending',
            'verified',
            'approved',
            'processing',
            'completed',
            'cancelled',
            name='order_status_enum'
        ),
        nullable=False,
        default='pending'
    )
    _total_amount = Column(String(500))  # Encrypted
    _notes = Column(String(1000))  # Encrypted
    _insurance_data = Column(String(2000))  # Encrypted JSON
    _payment_info = Column(String(2000))  # Encrypted JSON
    _delivery_info = Column(String(2000))  # Encrypted JSON
    completion_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    patient = relationship("Patient", back_populates="orders")
    provider = relationship("Provider", back_populates="orders")
    territory = relationship("Territory", back_populates="orders")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    status_history = relationship(
        "OrderStatus",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    approvals = relationship(
        "OrderApproval",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    shipping_addresses = relationship(
        "ShippingAddress",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    shipments = relationship(
        "Shipment",
        back_populates="order",
        cascade="all, delete-orphan"
    ) 