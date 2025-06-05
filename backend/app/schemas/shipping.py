"""
Pydantic schemas for shipping-related entities.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

from app.services.shipping_types import ShippingServiceType, TrackingStatus


class ShippingAddressBase(BaseModel):
    """Base schema for shipping address."""

    street1: str = Field(..., min_length=1, max_length=200)
    street2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=2, max_length=50)
    postal_code: str = Field(..., min_length=5, max_length=10)
    country: str = Field(default="US", min_length=2, max_length=2)
    is_residential: bool = True
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None


class ShippingAddressCreate(ShippingAddressBase):
    """Schema for creating a shipping address."""

    address_type: str = Field(..., pattern="^(from|to)$")


class ShippingAddressUpdate(ShippingAddressBase):
    """Schema for updating a shipping address."""

    street1: Optional[str] = Field(None, min_length=1, max_length=200)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=50)
    postal_code: Optional[str] = Field(None, min_length=5, max_length=10)
    country: Optional[str] = Field(None, min_length=2, max_length=2)


class ShippingAddressResponse(ShippingAddressBase):
    """Schema for shipping address response."""

    id: UUID
    order_id: UUID
    address_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShipmentPackageBase(BaseModel):
    """Base schema for shipment package."""

    weight: float = Field(..., gt=0)
    length: Optional[float] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    value: Optional[float] = Field(None, ge=0)
    reference: Optional[str] = Field(None, max_length=100)
    requires_signature: bool = True
    is_temperature_controlled: bool = False
    temperature_range: Optional[Dict[str, float]] = None


class ShipmentPackageCreate(ShipmentPackageBase):
    """Schema for creating a shipment package."""

    pass


class ShipmentPackageUpdate(BaseModel):
    """Schema for updating a shipment package."""

    weight: Optional[float] = Field(None, gt=0)
    length: Optional[float] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    value: Optional[float] = Field(None, ge=0)
    reference: Optional[str] = Field(None, max_length=100)
    requires_signature: Optional[bool] = None
    is_temperature_controlled: Optional[bool] = None
    temperature_range: Optional[Dict[str, float]] = None


class ShipmentPackageResponse(ShipmentPackageBase):
    """Schema for shipment package response."""

    id: UUID
    shipment_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShipmentTrackingBase(BaseModel):
    """Base schema for shipment tracking."""

    timestamp: datetime
    status: TrackingStatus
    location: Optional[str] = Field(None, max_length=200)
    description: str = Field(..., max_length=500)
    details: Optional[Dict] = None
    tracking_metadata: Optional[Dict] = None


class ShipmentTrackingCreate(ShipmentTrackingBase):
    """Schema for creating a shipment tracking event."""

    pass


class ShipmentTrackingResponse(ShipmentTrackingBase):
    """Schema for shipment tracking response."""

    id: UUID
    shipment_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ShipmentBase(BaseModel):
    """Base schema for shipment."""

    carrier: str = Field(..., min_length=1, max_length=50)
    service_type: ShippingServiceType
    tracking_number: Optional[str] = Field(None, max_length=100)
    rate: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    label_url: Optional[str] = Field(None, max_length=500)
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    shipment_metadata: Optional[Dict] = None


class ShipmentCreate(ShipmentBase):
    """Schema for creating a shipment."""

    packages: List[ShipmentPackageCreate]


class ShipmentUpdate(BaseModel):
    """Schema for updating a shipment."""

    carrier: Optional[str] = Field(None, min_length=1, max_length=50)
    service_type: Optional[ShippingServiceType] = None
    tracking_number: Optional[str] = Field(None, max_length=100)
    rate: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    label_url: Optional[str] = Field(None, max_length=500)
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    status: Optional[str] = Field(
        None,
        pattern=(
            "^(pending|label_created|picked_up|in_transit|delivered|exception)$"
        )
    )


class ShipmentResponse(ShipmentBase):
    """Schema for shipment response."""

    id: UUID
    order_id: UUID
    status: str
    packages: List[ShipmentPackageResponse]
    tracking_events: List[ShipmentTrackingResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
