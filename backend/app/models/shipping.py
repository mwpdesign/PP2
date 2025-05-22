"""
Database models for shipping-related entities.
"""
from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, JSON, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.security import encrypt_field, decrypt_field
from app.services.shipping_service import ShippingServiceType, PackageType


class ShippingAddress(Base):
    """Model for storing shipping addresses."""
    __tablename__ = 'shipping_addresses'

    id = Column(UUID, primary_key=True, default=uuid4)
    order_id = Column(UUID, ForeignKey('orders.id'), nullable=False)
    address_type = Column(
        Enum('from', 'to', name='address_type_enum'),
        nullable=False
    )
    _street1 = Column(String(500), nullable=False)  # Encrypted
    _street2 = Column(String(500))  # Encrypted
    _city = Column(String(500), nullable=False)  # Encrypted
    _state = Column(String(500), nullable=False)  # Encrypted
    _postal_code = Column(String(500), nullable=False)  # Encrypted
    _country = Column(String(500), nullable=False)  # Encrypted
    is_residential = Column(Boolean, default=True)
    _phone = Column(String(500))  # Encrypted
    _email = Column(String(500))  # Encrypted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    order = relationship("Order", back_populates="shipping_addresses")

    @property
    def street1(self) -> str:
        """Get decrypted street1."""
        return decrypt_field(self._street1)

    @street1.setter
    def street1(self, value: str):
        self._street1 = encrypt_field(value)

    @property
    def street2(self) -> str:
        """Get decrypted street2."""
        return decrypt_field(self._street2) if self._street2 else None

    @street2.setter
    def street2(self, value: str):
        self._street2 = encrypt_field(value) if value else None

    @property
    def city(self) -> str:
        """Get decrypted city."""
        return decrypt_field(self._city)

    @city.setter
    def city(self, value: str):
        self._city = encrypt_field(value)

    @property
    def state(self) -> str:
        """Get decrypted state."""
        return decrypt_field(self._state)

    @state.setter
    def state(self, value: str):
        self._state = encrypt_field(value)

    @property
    def postal_code(self) -> str:
        """Get decrypted postal code."""
        return decrypt_field(self._postal_code)

    @postal_code.setter
    def postal_code(self, value: str):
        self._postal_code = encrypt_field(value)

    @property
    def country(self) -> str:
        """Get decrypted country."""
        return decrypt_field(self._country)

    @country.setter
    def country(self, value: str):
        self._country = encrypt_field(value)

    @property
    def phone(self) -> str:
        """Get decrypted phone."""
        return decrypt_field(self._phone) if self._phone else None

    @phone.setter
    def phone(self, value: str):
        self._phone = encrypt_field(value) if value else None

    @property
    def email(self) -> str:
        """Get decrypted email."""
        return decrypt_field(self._email) if self._email else None

    @email.setter
    def email(self, value: str):
        self._email = encrypt_field(value) if value else None


class ShipmentPackage(Base):
    """Model for storing package information."""
    __tablename__ = 'shipment_packages'

    id = Column(UUID, primary_key=True, default=uuid4)
    shipment_id = Column(UUID, ForeignKey('shipments.id'), nullable=False)
    package_type = Column(
        Enum(PackageType),
        nullable=False
    )
    weight = Column(String(500), nullable=False)  # Encrypted
    length = Column(String(500))  # Encrypted
    width = Column(String(500))  # Encrypted
    height = Column(String(500))  # Encrypted
    value = Column(String(500))  # Encrypted
    reference = Column(String(100))
    requires_signature = Column(Boolean, default=True)
    is_temperature_controlled = Column(Boolean, default=False)
    temperature_range = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    shipment = relationship("Shipment", back_populates="packages")


class Shipment(Base):
    """Model for storing shipment information."""
    __tablename__ = 'shipments'

    id = Column(UUID, primary_key=True, default=uuid4)
    order_id = Column(UUID, ForeignKey('orders.id'), nullable=False)
    carrier = Column(String(50), nullable=False)
    service_type = Column(
        Enum(ShippingServiceType),
        nullable=False
    )
    tracking_number = Column(String(100))
    status = Column(
        Enum(
            'pending',
            'label_created',
            'picked_up',
            'in_transit',
            'delivered',
            'exception',
            name='shipment_status_enum'
        ),
        nullable=False,
        default='pending'
    )
    _rate = Column(String(500))  # Encrypted
    currency = Column(String(3), default='USD')
    label_url = Column(String(500))
    estimated_delivery = Column(DateTime)
    actual_delivery = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    order = relationship("Order", back_populates="shipments")
    packages = relationship(
        "ShipmentPackage",
        back_populates="shipment",
        cascade="all, delete-orphan"
    )
    tracking_events = relationship(
        "ShipmentTracking",
        back_populates="shipment",
        cascade="all, delete-orphan"
    )

    @property
    def rate(self) -> float:
        """Get decrypted rate."""
        return float(decrypt_field(self._rate)) if self._rate else 0.0

    @rate.setter
    def rate(self, value: float):
        self._rate = encrypt_field(str(value))


class ShipmentTracking(Base):
    """Model for storing shipment tracking events."""
    __tablename__ = 'shipment_tracking'

    id = Column(UUID, primary_key=True, default=uuid4)
    shipment_id = Column(UUID, ForeignKey('shipments.id'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    status = Column(
        Enum(
            'pending',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'exception',
            'returned',
            name='tracking_status_enum'
        ),
        nullable=False
    )
    _location = Column(String(500))  # Encrypted
    _description = Column(String(1000))  # Encrypted
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    shipment = relationship("Shipment", back_populates="tracking_events")

    @property
    def location(self) -> str:
        """Get decrypted location."""
        return decrypt_field(self._location) if self._location else None

    @location.setter
    def location(self, value: str):
        self._location = encrypt_field(value) if value else None

    @property
    def description(self) -> str:
        """Get decrypted description."""
        return decrypt_field(self._description) if self._description else None

    @description.setter
    def description(self, value: str):
        self._description = encrypt_field(value) if value else None 