"""
Pydantic schemas for order-related entities.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.shipping import (
    ShippingAddressResponse,
    ShipmentResponse
)


class OrderBase(BaseModel):
    """Base schema for order."""
    patient_id: UUID
    provider_id: UUID
    order_type: str = Field(
        ...,
        pattern='^(prescription|medical_equipment|lab_test|referral)$'
    )
    priority: str = Field(
        default='routine',
        pattern='^(routine|urgent|emergency)$'
    )
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    """Schema for creating an order."""
    pass


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    patient_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    status: Optional[str] = Field(
        None,
        pattern='^(pending|processing|completed|cancelled)$'
    )
    order_type: Optional[str] = Field(
        None,
        pattern='^(prescription|medical_equipment|lab_test|referral)$'
    )
    priority: Optional[str] = Field(
        None,
        pattern='^(routine|urgent|emergency)$'
    )
    notes: Optional[str] = None


class OrderResponse(OrderBase):
    """Schema for order response."""
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    shipping_addresses: list[ShippingAddressResponse] = []
    shipments: list[ShipmentResponse] = []

    class Config:
        from_attributes = True 