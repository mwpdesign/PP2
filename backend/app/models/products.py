"""
Comprehensive product models for the Healthcare IVR Platform Order Management
System.

This module provides complete product catalog management including:
- Product categories and hierarchies
- Multi-size product variants
- Inventory tracking and management
- Dynamic pricing with effective dates
- Regulatory compliance for medical products
- Integration with existing IVR product selection
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import (
    String, DateTime, ForeignKey, JSON, Integer, Numeric, Boolean, Text,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductCategory(Base):
    """Product category model for organizing medical supplies and equipment."""

    __tablename__ = "product_categories"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    parent_category_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_categories.id"),
        nullable=True
    )
    category_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Regulatory and compliance fields
    requires_prescription: Mapped[bool] = mapped_column(
        Boolean, default=False
    )
    regulatory_class: Mapped[str] = mapped_column(
        String(50), nullable=True
    )  # Class I, II, III

    # Metadata
    category_metadata: Mapped[dict] = mapped_column(JSON, default={})
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    parent_category = relationship(
        "ProductCategory", remote_side=[id], back_populates="subcategories"
    )
    subcategories = relationship(
        "ProductCategory", back_populates="parent_category", cascade="all, delete-orphan"
    )
    products = relationship("Product", back_populates="category")

    # Indexes
    __table_args__ = (
        Index("ix_product_categories_parent_id", "parent_category_id"),
        Index("ix_product_categories_code", "category_code"),
        Index("ix_product_categories_active", "is_active"),
    )


class Product(Base):
    """Enhanced product model for comprehensive medical supply management."""

    __tablename__ = "products"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # Basic product information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    short_description: Mapped[str] = mapped_column(String(500), nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=True)

    # Product identification
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    upc: Mapped[str] = mapped_column(String(20), nullable=True)
    manufacturer_part_number: Mapped[str] = mapped_column(String(50), nullable=True)

    # Medical/regulatory codes
    hcpcs_code: Mapped[str] = mapped_column(String(20), nullable=True)
    ndc_number: Mapped[str] = mapped_column(String(20), nullable=True)  # National Drug Code
    fda_device_id: Mapped[str] = mapped_column(String(50), nullable=True)

    # Category and classification
    category_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=False
    )

    # Regulatory and compliance
    regulatory_class: Mapped[str] = mapped_column(String(50), nullable=True)  # Class I, II, III
    fda_cleared: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, default=False)
    controlled_substance: Mapped[bool] = mapped_column(Boolean, default=False)
    latex_free: Mapped[bool] = mapped_column(Boolean, default=True)
    sterile: Mapped[bool] = mapped_column(Boolean, default=False)

    # Product specifications
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="each")  # each, box, case, etc.
    weight: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=True)  # in grams
    dimensions: Mapped[str] = mapped_column(String(50), nullable=True)  # L x W x H

    # Pricing (base price - specific pricing in product_pricing table)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0.00)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)  # wholesale cost

    # Status and availability
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_discontinued: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_cold_storage: Mapped[bool] = mapped_column(Boolean, default=False)
    hazardous_material: Mapped[bool] = mapped_column(Boolean, default=False)

    # Inventory management flags
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_backorder: Mapped[bool] = mapped_column(Boolean, default=False)

    # Metadata and additional information
    product_metadata: Mapped[dict] = mapped_column(JSON, default={})
    compliance_notes: Mapped[str] = mapped_column(Text, nullable=True)
    usage_instructions: Mapped[str] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    sizes = relationship("ProductSize", back_populates="product", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_products_sku", "sku"),
        Index("ix_products_category_id", "category_id"),
        Index("ix_products_hcpcs_code", "hcpcs_code"),
        Index("ix_products_manufacturer", "manufacturer"),
        Index("ix_products_active", "is_active"),
        Index("ix_products_discontinued", "is_discontinued"),
        Index("ix_products_name_search", "name"),  # For text search
    )


class ProductSize(Base):
    """Product size variants for multi-size products (enhanced from IVR structure)."""

    __tablename__ = "product_sizes"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    product_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )

    # Size identification
    size_name: Mapped[str] = mapped_column(String(50), nullable=False)  # "Small", "2x2", "10ml"
    size_code: Mapped[str] = mapped_column(String(20), nullable=False)  # "SM", "2X2", "10ML"
    dimensions: Mapped[str] = mapped_column(String(50), nullable=True)  # "2x2 cm", "10ml"

    # Size-specific details
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="each")
    units_per_package: Mapped[int] = mapped_column(Integer, default=1)
    weight: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=True)

    # Size-specific identifiers
    sku_suffix: Mapped[str] = mapped_column(String(20), nullable=True)  # Added to base SKU
    upc: Mapped[str] = mapped_column(String(20), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    # Metadata
    size_metadata: Mapped[dict] = mapped_column(JSON, default={})

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    product = relationship("Product", back_populates="sizes")
    inventory_records = relationship("Inventory", back_populates="product_size")
    pricing_records = relationship("ProductPricing", back_populates="product_size")

    # Indexes
    __table_args__ = (
        Index("ix_product_sizes_product_id", "product_id"),
        Index("ix_product_sizes_code", "size_code"),
        Index("ix_product_sizes_active", "is_active"),
        # Unique constraint on product_id + size_code
        Index("ix_product_sizes_unique", "product_id", "size_code", unique=True),
    )


class Inventory(Base):
    """Inventory tracking for product sizes."""

    __tablename__ = "inventory"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    product_size_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_sizes.id"), nullable=False
    )

    # Location information
    warehouse_location: Mapped[str] = mapped_column(String(50), nullable=True)
    bin_location: Mapped[str] = mapped_column(String(20), nullable=True)

    # Inventory quantities
    quantity_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quantity_on_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Inventory management thresholds
    reorder_level: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    reorder_quantity: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    max_stock_level: Mapped[int] = mapped_column(Integer, nullable=True)

    # Lot and expiration tracking
    lot_number: Mapped[str] = mapped_column(String(50), nullable=True)
    expiration_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Cost tracking
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    total_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    last_counted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    product_size = relationship("ProductSize", back_populates="inventory_records")

    # Computed properties
    @property
    def quantity_available_for_sale(self) -> int:
        """Calculate quantity available for sale (available - reserved)."""
        return max(0, self.quantity_available - self.quantity_reserved)

    @property
    def is_low_stock(self) -> bool:
        """Check if inventory is below reorder level."""
        return self.quantity_available <= self.reorder_level

    @property
    def is_out_of_stock(self) -> bool:
        """Check if inventory is out of stock."""
        return self.quantity_available <= 0

    # Indexes
    __table_args__ = (
        Index("ix_inventory_product_size_id", "product_size_id"),
        Index("ix_inventory_warehouse", "warehouse_location"),
        Index("ix_inventory_lot_number", "lot_number"),
        Index("ix_inventory_expiration", "expiration_date"),
        Index("ix_inventory_low_stock", "quantity_available", "reorder_level"),
        Index("ix_inventory_active", "is_active"),
    )


class ProductPricing(Base):
    """Dynamic pricing for product sizes with effective dates."""

    __tablename__ = "product_pricing"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    product_size_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_sizes.id"), nullable=False
    )

    # Pricing information
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)

    # Price type and tier
    price_type: Mapped[str] = mapped_column(
        String(20), default="standard", nullable=False
    )  # standard, wholesale, contract, promotional
    customer_tier: Mapped[str] = mapped_column(String(20), nullable=True)  # bronze, silver, gold

    # Effective dates
    effective_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Quantity breaks
    min_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_quantity: Mapped[int] = mapped_column(Integer, nullable=True)

    # Currency and region
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    region: Mapped[str] = mapped_column(String(50), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Metadata
    pricing_notes: Mapped[str] = mapped_column(String(500), nullable=True)
    pricing_metadata: Mapped[dict] = mapped_column(JSON, default={})

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    product_size = relationship("ProductSize", back_populates="pricing_records")

    # Indexes
    __table_args__ = (
        Index("ix_product_pricing_product_size_id", "product_size_id"),
        Index("ix_product_pricing_effective_date", "effective_date"),
        Index("ix_product_pricing_price_type", "price_type"),
        Index("ix_product_pricing_active", "is_active"),
        Index("ix_product_pricing_current", "effective_date", "end_date", "is_active"),
    )