"""
Database models for shipping-related entities.
"""

from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base
from app.core.encryption import encrypt_field, decrypt_field
from app.services.shipping_types import ShippingServiceType, TrackingStatus


class ShippingAddress(Base):
    """Model for storing shipping addresses."""

    __tablename__ = "shipping_addresses"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False
    )
    address_type: Mapped[str] = mapped_column(
        Enum("from", "to", name="address_type_enum"), nullable=False
    )
    _street1: Mapped[str] = mapped_column(String(500), nullable=False)  # Encrypted
    _street2: Mapped[str] = mapped_column(String(500))  # Encrypted
    _city: Mapped[str] = mapped_column(String(500), nullable=False)  # Encrypted
    _state: Mapped[str] = mapped_column(String(500), nullable=False)  # Encrypted
    _zip_code: Mapped[str] = mapped_column(String(500), nullable=False)  # Encrypted
    _country: Mapped[str] = mapped_column(
        String(500), nullable=False, default="US"
    )  # Encrypted
    _phone: Mapped[str] = mapped_column(String(500))  # Encrypted
    _email: Mapped[str] = mapped_column(String(500))  # Encrypted
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=datetime.utcnow
    )

    # Relationships
    order = relationship("Order", back_populates="shipping_addresses")

    @property
    def street1(self) -> str:
        """Get decrypted street1."""
        if self._street1:
            return decrypt_field(self._street1)
        return None

    @street1.setter
    def street1(self, value: str):
        """Set encrypted street1."""
        if value is not None:
            self._street1 = encrypt_field(value)
        else:
            self._street1 = None

    @property
    def street2(self) -> str:
        """Get decrypted street2."""
        if self._street2:
            return decrypt_field(self._street2)
        return None

    @street2.setter
    def street2(self, value: str):
        """Set encrypted street2."""
        if value is not None:
            self._street2 = encrypt_field(value)
        else:
            self._street2 = None

    @property
    def city(self) -> str:
        """Get decrypted city."""
        if self._city:
            return decrypt_field(self._city)
        return None

    @city.setter
    def city(self, value: str):
        """Set encrypted city."""
        if value is not None:
            self._city = encrypt_field(value)
        else:
            self._city = None

    @property
    def state(self) -> str:
        """Get decrypted state."""
        if self._state:
            return decrypt_field(self._state)
        return None

    @state.setter
    def state(self, value: str):
        """Set encrypted state."""
        if value is not None:
            self._state = encrypt_field(value)
        else:
            self._state = None

    @property
    def zip_code(self) -> str:
        """Get decrypted zip_code."""
        if self._zip_code:
            return decrypt_field(self._zip_code)
        return None

    @zip_code.setter
    def zip_code(self, value: str):
        """Set encrypted zip_code."""
        if value is not None:
            self._zip_code = encrypt_field(value)
        else:
            self._zip_code = None

    @property
    def country(self) -> str:
        """Get decrypted country."""
        if self._country:
            return decrypt_field(self._country)
        return None

    @country.setter
    def country(self, value: str):
        """Set encrypted country."""
        if value is not None:
            self._country = encrypt_field(value)
        else:
            self._country = None

    @property
    def phone(self) -> str:
        """Get decrypted phone."""
        if self._phone:
            return decrypt_field(self._phone)
        return None

    @phone.setter
    def phone(self, value: str):
        """Set encrypted phone."""
        if value is not None:
            self._phone = encrypt_field(value)
        else:
            self._phone = None

    @property
    def email(self) -> str:
        """Get decrypted email."""
        if self._email:
            return decrypt_field(self._email)
        return None

    @email.setter
    def email(self, value: str):
        """Set encrypted email."""
        if value is not None:
            self._email = encrypt_field(value)
        else:
            self._email = None


class ShipmentPackage(Base):
    """Model for storing package information."""

    __tablename__ = "shipment_packages"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    shipment_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False
    )
    weight: Mapped[str] = mapped_column(String(500), nullable=False)  # Encrypted
    length: Mapped[str] = mapped_column(String(500))  # Encrypted
    width: Mapped[str] = mapped_column(String(500))  # Encrypted
    height: Mapped[str] = mapped_column(String(500))  # Encrypted
    value: Mapped[str] = mapped_column(String(500))  # Encrypted
    reference: Mapped[str] = mapped_column(String(100))
    requires_signature: Mapped[bool] = mapped_column(Boolean, default=True)
    is_hazardous: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=datetime.utcnow
    )

    # Relationships
    shipment = relationship("Shipment", back_populates="packages")


class Shipment(Base):
    """Model for storing shipment information."""

    __tablename__ = "shipments"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False
    )
    service_type: Mapped[ShippingServiceType] = mapped_column(
        Enum(ShippingServiceType), nullable=False
    )
    carrier_id: Mapped[str] = mapped_column(String(100), nullable=False)
    tracking_number: Mapped[str] = mapped_column(String(100))
    status: Mapped[TrackingStatus] = mapped_column(
        Enum(TrackingStatus), nullable=False, default=TrackingStatus.PENDING
    )
    label_url: Mapped[str] = mapped_column(String(500))
    shipping_cost: Mapped[str] = mapped_column(String(500))  # Encrypted
    insurance_cost: Mapped[str] = mapped_column(String(500))  # Encrypted
    shipment_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=datetime.utcnow
    )

    # Relationships
    order = relationship("Order", back_populates="shipments")
    packages = relationship(
        "ShipmentPackage", back_populates="shipment", cascade="all, delete-orphan"
    )
    tracking_events = relationship(
        "ShipmentTracking", back_populates="shipment", cascade="all, delete-orphan"
    )


class ShipmentTracking(Base):
    """Model for storing shipment tracking events."""

    __tablename__ = "shipment_tracking"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    shipment_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False
    )
    status: Mapped[TrackingStatus] = mapped_column(Enum(TrackingStatus), nullable=False)
    location: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(500))
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    tracking_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Relationships
    shipment = relationship("Shipment", back_populates="tracking_events")
