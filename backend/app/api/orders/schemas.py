"""
Order management schemas with validation.
"""

from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, validator
from uuid import UUID


class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[UUID] = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryResponse(ProductCategoryBase):
    id: UUID
    children: List["ProductCategoryResponse"] = []

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    manufacturer: Optional[str] = Field(None, max_length=200)
    regulatory_status: str = Field(
        ..., pattern="^(approved|pending|restricted)$")
    requires_authorization: bool = False
    is_active: bool = True
    base_price: float = Field(..., gt=0)
    category_ids: List[UUID] = []


class ProductCreate(ProductBase):
    pricing_rules: Optional[dict] = None
    metadata: Optional[dict] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    manufacturer: Optional[str] = Field(None, max_length=200)
    regulatory_status: Optional[str] = Field(
        None, pattern="^(approved|pending|restricted)$"
    )
    requires_authorization: Optional[bool] = None
    is_active: Optional[bool] = None
    base_price: Optional[float] = Field(None, gt=0)
    category_ids: Optional[List[UUID]] = None
    pricing_rules: Optional[dict] = None
    metadata: Optional[dict] = None


class ProductResponse(ProductBase):
    id: UUID
    categories: List[ProductCategoryResponse]
    inventory: List["ProductInventoryResponse"]
    compliance: List["ProductComplianceResponse"]
    pricing: List["ProductPricingResponse"]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductInventoryBase(BaseModel):
    product_id: UUID
    territory_id: UUID
    quantity: int = Field(..., ge=0)
    reserved_quantity: int = Field(..., ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, gt=0)


class ProductInventoryCreate(ProductInventoryBase):
    pass


class ProductInventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    reserved_quantity: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, gt=0)


class ProductInventoryResponse(ProductInventoryBase):
    id: UUID
    last_restock_date: Optional[datetime]
    next_restock_date: Optional[datetime]
    available_quantity: int

    class Config:
        from_attributes = True


class ProductPricingBase(BaseModel):
    product_id: UUID
    territory_id: UUID
    price: float = Field(..., gt=0)
    discount_rules: Optional[dict] = None
    effective_from: datetime
    effective_to: Optional[datetime] = None
    is_active: bool = True


class ProductPricingCreate(ProductPricingBase):
    pass


class ProductPricingUpdate(BaseModel):
    price: Optional[float] = Field(None, gt=0)
    discount_rules: Optional[dict] = None
    effective_to: Optional[datetime] = None
    is_active: Optional[bool] = None


class ProductPricingResponse(ProductPricingBase):
    id: UUID

    class Config:
        from_attributes = True


class ProductComplianceBase(BaseModel):
    product_id: UUID
    regulation_code: str = Field(..., min_length=1, max_length=50)
    status: str = Field(..., pattern="^(compliant|pending|non-compliant)$")
    certification_number: Optional[str] = Field(None, max_length=100)
    certification_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    documentation_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class ProductComplianceCreate(ProductComplianceBase):
    pass


class ProductComplianceUpdate(BaseModel):
    status: Optional[str] = Field(
        None,
        pattern="^(compliant|pending|non-compliant)$"
    )
    certification_number: Optional[str] = Field(None, max_length=100)
    certification_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    documentation_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class ProductComplianceResponse(ProductComplianceBase):
    id: UUID
    last_audit_date: Optional[datetime]
    next_audit_date: Optional[datetime]

    class Config:
        from_attributes = True


class ProductSearchParams(BaseModel):
    query: Optional[str] = None
    territory_id: UUID
    category_id: Optional[UUID] = None
    compliance_status: Optional[str] = Field(
        None, pattern="^(compliant|pending|non-compliant)$"
    )
    in_stock_only: bool = False


class InventoryUpdateParams(BaseModel):
    product_id: UUID
    territory_id: UUID
    quantity: int = Field(..., gt=0)
    operation: str = Field(..., pattern="^(add|remove)$")


class InventoryReservationParams(BaseModel):
    product_id: UUID
    territory_id: UUID
    quantity: int = Field(..., gt=0)
    order_id: UUID


class OrderBase(BaseModel):
    """Base schema for order data."""

    patient_id: UUID
    provider_id: UUID
    territory_id: UUID
    ivr_session_id: Optional[UUID] = None
    notes: Optional[str] = Field(None, max_length=1000)


class OrderCreate(OrderBase):
    """Schema for creating a new order."""

    items: List["OrderItemCreate"]
    insurance_data: Optional[Dict] = None
    payment_info: Optional[Dict] = None
    delivery_info: Optional[Dict] = None


class OrderUpdate(BaseModel):
    """Schema for updating an order."""

    notes: Optional[str] = Field(None, max_length=1000)
    insurance_data: Optional[Dict] = None
    payment_info: Optional[Dict] = None
    delivery_info: Optional[Dict] = None
    status: Optional[str] = Field(
        None, pattern="^(pending|verified|approved|processing|completed|cancelled)$"
    )


class OrderResponse(OrderBase):
    """Schema for order response data."""

    id: UUID
    order_number: str
    status: str
    order_date: datetime
    completion_date: Optional[datetime]
    total_amount: float
    insurance_data: Optional[Dict]
    payment_info: Optional[Dict]
    delivery_info: Optional[Dict]
    items: List["OrderItemResponse"]
    status_history: List["OrderStatusResponse"]
    approvals: List["OrderApprovalResponse"]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderItemBase(BaseModel):
    """Base schema for order item data."""

    product_id: UUID
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=1000)


class OrderItemCreate(OrderItemBase):
    """Schema for creating a new order item."""

    insurance_coverage: Optional[Dict] = None


class OrderItemUpdate(BaseModel):
    """Schema for updating an order item."""

    quantity: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    insurance_coverage: Optional[Dict] = None
    status: Optional[str] = Field(
        None, pattern="^(pending|approved|rejected|cancelled)$"
    )


class OrderItemResponse(OrderItemBase):
    """Schema for order item response data."""

    id: UUID
    order_id: UUID
    status: str
    unit_price: float
    total_price: float
    insurance_coverage: Optional[Dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusBase(BaseModel):
    """Base schema for order status data."""

    status: str = Field(
        ..., pattern="^(pending|verified|approved|processing|completed|cancelled)$"
    )
    reason: Optional[str] = Field(None, max_length=1000)
    metadata: Optional[Dict] = None


class OrderStatusCreate(OrderStatusBase):
    """Schema for creating a new order status."""

    pass


class OrderStatusResponse(OrderStatusBase):
    """Schema for order status response data."""

    id: UUID
    order_id: UUID
    changed_by: UUID
    timestamp: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderApprovalBase(BaseModel):
    """Base schema for order approval data."""

    approval_type: str = Field(
        ..., pattern="^(provider|insurance|pharmacy|supervisor)$"
    )
    notes: Optional[str] = Field(None, max_length=1000)
    metadata: Optional[Dict] = None


class OrderApprovalCreate(OrderApprovalBase):
    """Schema for creating a new order approval."""

    pass


class OrderApprovalUpdate(BaseModel):
    """Schema for updating an order approval."""

    status: str = Field(..., pattern="^(approved|rejected)$")
    notes: Optional[str] = Field(None, max_length=1000)
    metadata: Optional[Dict] = None


class OrderApprovalResponse(OrderApprovalBase):
    """Schema for order approval response data."""

    id: UUID
    order_id: UUID
    approver_id: UUID
    status: str
    timestamp: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderSearchParams(BaseModel):
    """Schema for order search parameters."""

    patient_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    territory_id: Optional[UUID] = None
    status: Optional[str] = Field(
        None, pattern="^(pending|verified|approved|processing|completed|cancelled)$"
    )
    order_number: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = Field("order_date", pattern="^[a-zA-Z_]+$")
    sort_order: str = Field("desc", pattern="^(asc|desc)$")
    skip: int = Field(0, ge=0)
    limit: int = Field(20, gt=0, le=100)


class OrderSearchResponse(BaseModel):
    """Schema for order search response."""

    items: List[OrderResponse]
    total: int
    skip: int
    limit: int


ProductCategoryResponse.update_forward_refs()
