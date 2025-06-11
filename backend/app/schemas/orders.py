"""
Comprehensive Pydantic schemas for order-related entities with IVR integration.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.shipping import ShippingAddressResponse, ShipmentResponse


class OrderBase(BaseModel):
    """Base schema for order."""

    patient_id: UUID
    provider_id: UUID
    order_type: str = Field(
        default="medical_supplies",
        pattern="^(prescription|medical_equipment|medical_supplies|"
                "lab_test|referral)$"
    )
    priority: str = Field(
        default="routine",
        pattern="^(routine|urgent|emergency)$"
    )
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    """Schema for creating an order manually."""
    shipping_address: Optional[Dict[str, Any]] = None
    products: Optional[Dict[str, Any]] = None


class OrderFromIVRCreate(BaseModel):
    """Schema for creating order from IVR (minimal data needed)."""
    pass  # All data comes from IVR request


class OrderUpdate(BaseModel):
    """Schema for updating an order."""

    patient_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    status: Optional[str] = Field(
        None,
        pattern="^(pending|processing|shipped|received|completed|cancelled)$"
    )
    order_type: Optional[str] = Field(
        None,
        pattern="^(prescription|medical_equipment|medical_supplies|lab_test|referral)$"
    )
    priority: Optional[str] = Field(
        None,
        pattern="^(routine|urgent|emergency)$"
    )
    notes: Optional[str] = None
    shipping_address: Optional[Dict[str, Any]] = None


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: str = Field(
        ...,
        pattern="^(pending|processing|shipped|received|completed|cancelled)$"
    )
    reason: Optional[str] = None


class OrderDocumentCreate(BaseModel):
    """Schema for creating order document."""
    document_type: str = Field(
        ...,
        pattern="^(shipping_label|tracking_info|proof_of_delivery|invoice|packing_slip|insurance_form|other)$"
    )
    document_key: str = Field(..., min_length=1, max_length=255)
    original_filename: Optional[str] = Field(None, max_length=255)


class OrderDocumentResponse(BaseModel):
    """Schema for order document response."""
    id: UUID
    order_id: UUID
    document_type: str
    document_key: str
    original_filename: Optional[str]
    uploaded_by_id: UUID
    status: str
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReorderCreate(BaseModel):
    """Schema for creating a re-order."""
    reason: str = Field(..., min_length=1, max_length=500)
    shipping_address: Optional[Dict[str, Any]] = None


class OrderStatusHistoryResponse(BaseModel):
    """Schema for order status history."""
    from_status: Optional[str]
    to_status: str
    changed_by_id: UUID
    reason: Optional[str]
    created_at: datetime


class OrderResponse(BaseModel):
    """Comprehensive schema for order response."""
    id: UUID
    order_number: str
    organization_id: UUID
    patient_id: UUID
    patient_name: str
    provider_id: UUID
    provider_name: str
    ivr_request_id: Optional[UUID]
    status: str
    order_type: str
    priority: str
    shipping_address: Optional[Dict[str, Any]]
    products: Optional[Dict[str, Any]]
    total_amount: Optional[float]
    notes: Optional[str]

    # Lifecycle timestamps
    processed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    received_at: Optional[datetime]
    received_by: Optional[UUID]
    completion_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # Related data
    status_history: List[Dict[str, Any]] = []
    documents: List[OrderDocumentResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Schema for paginated order list response."""
    items: List[OrderResponse]
    total: int
    limit: int
    offset: int


class OrderSummaryResponse(BaseModel):
    """Schema for order summary (lightweight)."""
    id: UUID
    order_number: str
    patient_name: str
    provider_name: str
    status: str
    total_amount: Optional[float]
    created_at: datetime
    ivr_request_id: Optional[UUID]

    class Config:
        from_attributes = True
