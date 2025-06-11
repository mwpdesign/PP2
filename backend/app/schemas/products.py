"""
Pydantic schemas for the comprehensive product catalog system.

This module provides schemas for:
- Product categories with hierarchical structure
- Enhanced products with regulatory compliance
- Multi-size product variants
- Inventory tracking and management
- Dynamic pricing with effective dates
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, validator


# Product Category Schemas
class ProductCategoryBase(BaseModel):
    """Base product category schema."""

    name: str = Field(..., max_length=100, description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    parent_category_id: Optional[UUID] = Field(
        None, description="Parent category ID for hierarchical structure"
    )
    category_code: str = Field(
        ..., max_length=20, description="Unique category code"
    )
    display_order: int = Field(0, description="Display order for sorting")
    is_active: bool = Field(True, description="Whether category is active")

    # Regulatory fields
    requires_prescription: bool = Field(
        False, description="Whether products require prescription"
    )
    regulatory_class: Optional[str] = Field(
        None, max_length=50, description="FDA regulatory class (I, II, III)"
    )

    # Metadata
    category_metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional category metadata"
    )


class ProductCategoryCreate(ProductCategoryBase):
    """Create product category schema."""
    pass


class ProductCategoryUpdate(BaseModel):
    """Update product category schema."""

    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    parent_category_id: Optional[UUID] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    requires_prescription: Optional[bool] = None
    regulatory_class: Optional[str] = Field(None, max_length=50)
    category_metadata: Optional[Dict[str, Any]] = None


class ProductCategoryResponse(ProductCategoryBase):
    """Response product category schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    # Relationships
    subcategories: List["ProductCategoryResponse"] = Field(default_factory=list)
    product_count: Optional[int] = Field(
        None, description="Number of products in this category"
    )

    class Config:
        """Pydantic config."""
        from_attributes = True


# Product Schemas
class ProductBase(BaseModel):
    """Base product schema."""

    # Basic information
    name: str = Field(..., max_length=255, description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    short_description: Optional[str] = Field(
        None, max_length=500, description="Short product description"
    )
    manufacturer: Optional[str] = Field(
        None, max_length=100, description="Manufacturer name"
    )
    brand: Optional[str] = Field(None, max_length=100, description="Brand name")

    # Product identification
    sku: str = Field(..., max_length=50, description="Stock Keeping Unit")
    upc: Optional[str] = Field(
        None, max_length=20, description="Universal Product Code"
    )
    manufacturer_part_number: Optional[str] = Field(
        None, max_length=50, description="Manufacturer part number"
    )

    # Medical/regulatory codes
    hcpcs_code: Optional[str] = Field(
        None, max_length=20, description="Healthcare Common Procedure Coding System"
    )
    ndc_number: Optional[str] = Field(
        None, max_length=20, description="National Drug Code"
    )
    fda_device_id: Optional[str] = Field(
        None, max_length=50, description="FDA device identifier"
    )

    # Category
    category_id: UUID = Field(..., description="Product category ID")

    # Regulatory and compliance
    regulatory_class: Optional[str] = Field(
        None, max_length=50, description="FDA regulatory class"
    )
    fda_cleared: bool = Field(False, description="FDA cleared status")
    requires_prescription: bool = Field(
        False, description="Requires prescription"
    )
    controlled_substance: bool = Field(
        False, description="Controlled substance status"
    )
    latex_free: bool = Field(True, description="Latex-free status")
    sterile: bool = Field(False, description="Sterile status")

    # Product specifications
    unit_of_measure: str = Field(
        "each", max_length=20, description="Unit of measure"
    )
    weight: Optional[Decimal] = Field(
        None, ge=0, description="Weight in grams"
    )
    dimensions: Optional[str] = Field(
        None, max_length=50, description="Dimensions (L x W x H)"
    )

    # Pricing
    base_price: Decimal = Field(
        0.00, ge=0, description="Base price"
    )
    cost: Optional[Decimal] = Field(
        None, ge=0, description="Wholesale cost"
    )

    # Status and availability
    is_active: bool = Field(True, description="Active status")
    is_discontinued: bool = Field(False, description="Discontinued status")
    requires_cold_storage: bool = Field(
        False, description="Cold storage requirement"
    )
    hazardous_material: bool = Field(
        False, description="Hazardous material status"
    )

    # Inventory management
    track_inventory: bool = Field(True, description="Track inventory")
    allow_backorder: bool = Field(False, description="Allow backorders")

    # Additional information
    product_metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional product metadata"
    )
    compliance_notes: Optional[str] = Field(
        None, description="Compliance notes"
    )
    usage_instructions: Optional[str] = Field(
        None, description="Usage instructions"
    )


class ProductCreate(ProductBase):
    """Create product schema."""
    pass


class ProductUpdate(BaseModel):
    """Update product schema."""

    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    manufacturer: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    category_id: Optional[UUID] = None
    base_price: Optional[Decimal] = Field(None, ge=0)
    cost: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_discontinued: Optional[bool] = None
    product_metadata: Optional[Dict[str, Any]] = None


class ProductResponse(ProductBase):
    """Response product schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    # Relationships
    category: Optional["ProductCategoryResponse"] = None
    sizes: List["ProductSizeResponse"] = Field(default_factory=list)

    class Config:
        """Pydantic config."""
        from_attributes = True


# Product Size Schemas
class ProductSizeBase(BaseModel):
    """Base product size schema."""

    product_id: UUID = Field(..., description="Product ID")
    size_name: str = Field(
        ..., max_length=50, description="Size name (e.g., 'Small', '2x2')"
    )
    size_code: str = Field(
        ..., max_length=20, description="Size code (e.g., 'SM', '2X2')"
    )
    dimensions: Optional[str] = Field(
        None, max_length=50, description="Dimensions"
    )

    # Size-specific details
    unit_of_measure: str = Field(
        "each", max_length=20, description="Unit of measure"
    )
    units_per_package: int = Field(
        1, ge=1, description="Units per package"
    )
    weight: Optional[Decimal] = Field(
        None, ge=0, description="Weight in grams"
    )

    # Size-specific identifiers
    sku_suffix: Optional[str] = Field(
        None, max_length=20, description="SKU suffix"
    )
    upc: Optional[str] = Field(
        None, max_length=20, description="UPC for this size"
    )

    # Status
    is_active: bool = Field(True, description="Active status")
    display_order: int = Field(0, description="Display order")

    # Metadata
    size_metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Size-specific metadata"
    )


class ProductSizeCreate(ProductSizeBase):
    """Create product size schema."""
    pass


class ProductSizeUpdate(BaseModel):
    """Update product size schema."""

    size_name: Optional[str] = Field(None, max_length=50)
    size_code: Optional[str] = Field(None, max_length=20)
    dimensions: Optional[str] = Field(None, max_length=50)
    unit_of_measure: Optional[str] = Field(None, max_length=20)
    units_per_package: Optional[int] = Field(None, ge=1)
    weight: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    size_metadata: Optional[Dict[str, Any]] = None


class ProductSizeResponse(ProductSizeBase):
    """Response product size schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    # Relationships
    product: Optional["ProductResponse"] = None
    current_inventory: Optional["InventoryResponse"] = None
    current_pricing: Optional["ProductPricingResponse"] = None

    class Config:
        """Pydantic config."""
        from_attributes = True


# Inventory Schemas
class InventoryBase(BaseModel):
    """Base inventory schema."""

    product_size_id: UUID = Field(..., description="Product size ID")

    # Location
    warehouse_location: Optional[str] = Field(
        None, max_length=50, description="Warehouse location"
    )
    bin_location: Optional[str] = Field(
        None, max_length=20, description="Bin location"
    )

    # Quantities
    quantity_available: int = Field(
        0, ge=0, description="Available quantity"
    )
    quantity_reserved: int = Field(
        0, ge=0, description="Reserved quantity"
    )
    quantity_on_order: int = Field(
        0, ge=0, description="Quantity on order"
    )

    # Thresholds
    reorder_level: int = Field(
        10, ge=0, description="Reorder level"
    )
    reorder_quantity: int = Field(
        50, ge=1, description="Reorder quantity"
    )
    max_stock_level: Optional[int] = Field(
        None, ge=0, description="Maximum stock level"
    )

    # Lot tracking
    lot_number: Optional[str] = Field(
        None, max_length=50, description="Lot number"
    )
    expiration_date: Optional[datetime] = Field(
        None, description="Expiration date"
    )

    # Cost tracking
    unit_cost: Optional[Decimal] = Field(
        None, ge=0, description="Unit cost"
    )
    total_value: Optional[Decimal] = Field(
        None, ge=0, description="Total inventory value"
    )

    # Status
    is_active: bool = Field(True, description="Active status")
    last_counted_at: Optional[datetime] = Field(
        None, description="Last physical count date"
    )


class InventoryCreate(InventoryBase):
    """Create inventory schema."""
    pass


class InventoryUpdate(BaseModel):
    """Update inventory schema."""

    warehouse_location: Optional[str] = Field(None, max_length=50)
    bin_location: Optional[str] = Field(None, max_length=20)
    quantity_available: Optional[int] = Field(None, ge=0)
    quantity_reserved: Optional[int] = Field(None, ge=0)
    quantity_on_order: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=1)
    max_stock_level: Optional[int] = Field(None, ge=0)
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    last_counted_at: Optional[datetime] = None


class InventoryResponse(InventoryBase):
    """Response inventory schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    # Computed fields
    quantity_available_for_sale: int = Field(
        ..., description="Available quantity for sale"
    )
    is_low_stock: bool = Field(..., description="Low stock indicator")
    is_out_of_stock: bool = Field(..., description="Out of stock indicator")

    # Relationships
    product_size: Optional["ProductSizeResponse"] = None

    class Config:
        """Pydantic config."""
        from_attributes = True


# Product Pricing Schemas
class ProductPricingBase(BaseModel):
    """Base product pricing schema."""

    product_size_id: UUID = Field(..., description="Product size ID")

    # Pricing
    price: Decimal = Field(..., ge=0, description="Price")
    cost: Optional[Decimal] = Field(None, ge=0, description="Cost")

    # Price type and tier
    price_type: str = Field(
        "standard", max_length=20, description="Price type"
    )
    customer_tier: Optional[str] = Field(
        None, max_length=20, description="Customer tier"
    )

    # Effective dates
    effective_date: datetime = Field(
        ..., description="Effective date"
    )
    end_date: Optional[datetime] = Field(
        None, description="End date"
    )

    # Quantity breaks
    min_quantity: int = Field(
        1, ge=1, description="Minimum quantity"
    )
    max_quantity: Optional[int] = Field(
        None, ge=1, description="Maximum quantity"
    )

    # Currency and region
    currency: str = Field(
        "USD", max_length=3, description="Currency code"
    )
    region: Optional[str] = Field(
        None, max_length=50, description="Region"
    )

    # Status
    is_active: bool = Field(True, description="Active status")

    # Metadata
    pricing_notes: Optional[str] = Field(
        None, max_length=500, description="Pricing notes"
    )
    pricing_metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Pricing metadata"
    )

    @validator('end_date')
    def validate_end_date(cls, v, values):
        """Validate that end_date is after effective_date."""
        if v and 'effective_date' in values and v <= values['effective_date']:
            raise ValueError('end_date must be after effective_date')
        return v


class ProductPricingCreate(ProductPricingBase):
    """Create product pricing schema."""
    pass


class ProductPricingUpdate(BaseModel):
    """Update product pricing schema."""

    price: Optional[Decimal] = Field(None, ge=0)
    cost: Optional[Decimal] = Field(None, ge=0)
    price_type: Optional[str] = Field(None, max_length=20)
    customer_tier: Optional[str] = Field(None, max_length=20)
    effective_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_quantity: Optional[int] = Field(None, ge=1)
    max_quantity: Optional[int] = Field(None, ge=1)
    currency: Optional[str] = Field(None, max_length=3)
    region: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    pricing_notes: Optional[str] = Field(None, max_length=500)
    pricing_metadata: Optional[Dict[str, Any]] = None


class ProductPricingResponse(ProductPricingBase):
    """Response product pricing schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    # Relationships
    product_size: Optional["ProductSizeResponse"] = None

    class Config:
        """Pydantic config."""
        from_attributes = True


# Comprehensive Product Schemas (with all relationships)
class ProductDetailResponse(ProductResponse):
    """Detailed product response with all relationships."""

    sizes: List["ProductSizeDetailResponse"] = Field(default_factory=list)
    total_inventory: Optional[int] = Field(
        None, description="Total inventory across all sizes"
    )
    low_stock_sizes: List[str] = Field(
        default_factory=list, description="Sizes with low stock"
    )


class ProductSizeDetailResponse(ProductSizeResponse):
    """Detailed product size response with inventory and pricing."""

    inventory_records: List["InventoryResponse"] = Field(default_factory=list)
    pricing_records: List["ProductPricingResponse"] = Field(default_factory=list)
    current_price: Optional[Decimal] = Field(
        None, description="Current effective price"
    )
    total_inventory: Optional[int] = Field(
        None, description="Total inventory for this size"
    )


# Search and Filter Schemas
class ProductSearchRequest(BaseModel):
    """Product search request schema."""

    query: Optional[str] = Field(None, description="Search query")
    category_id: Optional[UUID] = Field(None, description="Category filter")
    manufacturer: Optional[str] = Field(None, description="Manufacturer filter")
    is_active: Optional[bool] = Field(None, description="Active status filter")
    requires_prescription: Optional[bool] = Field(
        None, description="Prescription requirement filter"
    )
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price")
    in_stock_only: Optional[bool] = Field(
        None, description="Show only in-stock items"
    )

    # Pagination
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")

    # Sorting
    sort_by: Optional[str] = Field(
        None, description="Sort field (name, price, created_at)"
    )
    sort_order: Optional[str] = Field(
        "asc", description="Sort order (asc, desc)"
    )


class ProductSearchResponse(BaseModel):
    """Product search response schema."""

    products: List[ProductResponse]
    total_count: int = Field(..., description="Total number of products")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Page size")
    total_pages: int = Field(..., description="Total number of pages")


# Update forward references
ProductCategoryResponse.model_rebuild()
ProductResponse.model_rebuild()
ProductSizeResponse.model_rebuild()
InventoryResponse.model_rebuild()
ProductPricingResponse.model_rebuild()
ProductDetailResponse.model_rebuild()
ProductSizeDetailResponse.model_rebuild()