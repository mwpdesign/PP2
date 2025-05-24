"""
Order model for managing medical supply orders.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.audit_mixin import AuditMixin
from app.core.security import encrypt_field, decrypt_field


class Order(Base, AuditMixin):
    """Order model for managing medical supply orders."""
    __tablename__ = 'orders'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    order_number = Column(String(50), unique=True, nullable=False)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey('patients.id'),
        nullable=False
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey('providers.id'),
        nullable=False
    )
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=False
    )
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=True
    )
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
    order_type = Column(
        Enum(
            'prescription',
            'medical_equipment',
            'lab_test',
            'referral',
            name='order_type_enum'
        ),
        nullable=False
    )
    priority = Column(
        Enum(
            'routine',
            'urgent',
            'emergency',
            name='order_priority_enum'
        ),
        nullable=False,
        default='routine'
    )
    _total_amount = Column(String(500))  # Encrypted
    _notes = Column(Text)  # Encrypted
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
    patient = relationship(
        "Patient",
        foreign_keys=[patient_id],
        back_populates="orders"
    )
    provider = relationship(
        "Provider",
        foreign_keys=[provider_id],
        back_populates="orders"
    )
    territory = relationship(
        "Territory",
        foreign_keys=[territory_id],
        back_populates="orders"
    )
    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        backref="created_orders"
    )
    updated_by = relationship(
        "User",
        foreign_keys=[updated_by_id],
        backref="updated_orders"
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