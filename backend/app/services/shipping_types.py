"""
Shipping service type definitions and base classes.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class Address(BaseModel):
    """Shipping address model."""
    street1: str
    street2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "US"
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_residential: bool = True


class Package(BaseModel):
    """Package information model."""
    weight: float  # in pounds
    length: float  # in inches
    width: float  # in inches
    height: float  # in inches
    value: Optional[float] = None  # declared value in USD
    reference: Optional[str] = None
    description: Optional[str] = None
    requires_signature: bool = False
    is_temperature_controlled: bool = False
    temperature_range: Optional[Dict[str, float]] = None


class ShippingServiceType(str, Enum):
    """Shipping service types."""
    GROUND = "GROUND"
    EXPRESS = "EXPRESS"
    OVERNIGHT = "OVERNIGHT"
    PRIORITY = "PRIORITY"
    ECONOMY = "ECONOMY"


class TrackingStatus(str, Enum):
    """Shipment tracking status types."""
    PENDING = "PENDING"  # Initial state before carrier pickup
    CREATED = "CREATED"
    PICKUP = "PICKUP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    EXCEPTION = "EXCEPTION"
    UNKNOWN = "UNKNOWN"


class TrackingEvent(BaseModel):
    """Shipment tracking event."""
    status: TrackingStatus
    timestamp: datetime
    location: Optional[str] = None
    description: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ShippingRate(BaseModel):
    """Shipping rate information."""
    carrier: str
    service: ShippingServiceType
    rate: float
    currency: str = "USD"
    delivery_days: Optional[int] = None
    guaranteed_delivery: bool = False


class ShippingLabel(BaseModel):
    """Shipping label information."""
    carrier: str
    tracking_number: str
    label_url: str
    service: ShippingServiceType
    rate: float
    created_at: datetime


class TrackingInfo(BaseModel):
    """Shipment tracking information."""
    carrier: str
    tracking_number: str
    status: TrackingStatus
    status_detail: Optional[str] = None
    location: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    history: List[TrackingEvent] = []


class ShippingProvider:
    """Base class for shipping carrier implementations."""

    def __init__(self, api_key: str, test_mode: bool = False):
        """Initialize shipping provider."""
        self.api_key = api_key
        self.test_mode = test_mode

    async def validate_address(self, address: Address) -> Dict:
        """Validate shipping address."""
        raise NotImplementedError()

    async def get_rates(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: Optional[ShippingServiceType] = None
    ) -> List[ShippingRate]:
        """Get available shipping rates."""
        raise NotImplementedError()

    async def create_label(
        self,
        from_address: Address,
        to_address: Address,
        package: Package,
        service_type: ShippingServiceType,
        reference: Optional[str] = None
    ) -> ShippingLabel:
        """Create shipping label."""
        raise NotImplementedError()

    async def track_shipment(self, tracking_number: str) -> TrackingInfo:
        """Track shipment status."""
        raise NotImplementedError() 