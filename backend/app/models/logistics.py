"""
Logistics models for shipping and fulfillment operations.
Implements HIPAA-compliant data models.
"""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import (
    String, DateTime, Enum, Integer, JSON, ForeignKey,
    Float, Boolean
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base


class Item(Base):
    """Item model for inventory management."""
    
    __tablename__ = "items"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    sku: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    description: Mapped[str] = mapped_column(
        String(1000),
        nullable=True
    )
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    unit_cost: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    min_stock_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    max_stock_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    reorder_point: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )
    metadata: Mapped[dict] = mapped_column(
        JSON,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    warehouse_locations = relationship(
        "WarehouseLocation",
        back_populates="item"
    )
    stock_levels = relationship(
        "StockLevel",
        back_populates="item"
    )
    inventory_transactions = relationship(
        "InventoryTransaction",
        back_populates="item"
    )


class FulfillmentOrder(Base):
    """Fulfillment order model."""
    
    __tablename__ = "fulfillment_orders"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id")
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "picking",
            "quality_check",
            "shipping",
            "completed",
            "cancelled",
            name="fulfillment_status"
        ),
        nullable=False,
        default="pending"
    )
    priority: Mapped[str] = mapped_column(
        Enum(
            "low",
            "normal",
            "high",
            "urgent",
            name="fulfillment_priority"
        ),
        nullable=False,
        default="normal"
    )
    items: Mapped[dict] = mapped_column(JSON, nullable=False)
    shipping_info: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    order = relationship("Order", back_populates="fulfillment_orders")
    picking_lists = relationship(
        "PickingList",
        back_populates="fulfillment_order"
    )
    quality_checks = relationship(
        "QualityCheck",
        back_populates="fulfillment_order"
    )


class PickingList(Base):
    """Picking list model for order fulfillment."""
    
    __tablename__ = "picking_lists"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    fulfillment_order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("fulfillment_orders.id"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "in_progress",
            "completed",
            "cancelled",
            name="picking_status"
        ),
        nullable=False,
        default="pending"
    )
    picker_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    items: Mapped[dict] = mapped_column(JSON, nullable=False)
    notes: Mapped[str] = mapped_column(String(1000), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    fulfillment_order = relationship(
        "FulfillmentOrder",
        back_populates="picking_lists"
    )
    picker = relationship("User", foreign_keys=[picker_id])


class QualityCheck(Base):
    """Quality check model for order fulfillment."""
    
    __tablename__ = "quality_checks"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    fulfillment_order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("fulfillment_orders.id"),
        nullable=False
    )
    inspector_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "in_progress",
            "passed",
            "failed",
            name="quality_check_status"
        ),
        nullable=False,
        default="pending"
    )
    items_checked: Mapped[dict] = mapped_column(JSON, nullable=False)
    issues_found: Mapped[dict] = mapped_column(JSON, nullable=True)
    notes: Mapped[str] = mapped_column(String(1000), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    fulfillment_order = relationship(
        "FulfillmentOrder",
        back_populates="quality_checks"
    )
    inspector = relationship(
        "User",
        foreign_keys=[inspector_id],
        back_populates="quality_checks"
    )


class WarehouseLocation(Base):
    """Warehouse location model."""
    
    __tablename__ = "warehouse_locations"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    type: Mapped[str] = mapped_column(
        Enum(
            "shelf",
            "bin",
            "rack",
            "zone",
            "aisle",
            name="location_type"
        ),
        nullable=False
    )
    parent_location_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("warehouse_locations.id"),
        nullable=True
    )
    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )
    metadata: Mapped[dict] = mapped_column(
        JSON,
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    parent_location = relationship(
        "WarehouseLocation",
        remote_side=[id],
        back_populates="child_locations"
    )
    child_locations = relationship(
        "WarehouseLocation",
        back_populates="parent_location"
    )
    inventory_transactions = relationship(
        "InventoryTransaction",
        back_populates="location"
    )
    item = relationship(
        "Item",
        back_populates="warehouse_locations"
    )


class InventoryTransaction(Base):
    """Inventory transaction model."""
    
    __tablename__ = "inventory_transactions"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    item_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id"),
        nullable=False
    )
    location_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("warehouse_locations.id"),
        nullable=False
    )
    type: Mapped[str] = mapped_column(
        Enum(
            "addition",
            "removal",
            "transfer",
            "adjustment",
            name="transaction_type"
        ),
        nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    reference_type: Mapped[str] = mapped_column(String, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    
    # Relationships
    item = relationship("Item", back_populates="inventory_transactions")
    location = relationship(
        "WarehouseLocation",
        back_populates="inventory_transactions"
    )


class StockLevel(Base):
    """Stock level model."""
    
    __tablename__ = "stock_levels"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    item_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id"),
        nullable=False
    )
    location_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("warehouse_locations.id"),
        nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    condition: Mapped[str] = mapped_column(
        Enum(
            "new",
            "used",
            "damaged",
            "expired",
            name="stock_condition"
        ),
        nullable=False,
        default="new"
    )
    last_counted: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    item = relationship("Item", back_populates="stock_levels")
    location = relationship("WarehouseLocation", back_populates="stock_levels")


class ReturnAuthorization(Base):
    """Return authorization model."""
    
    __tablename__ = "return_authorizations"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    order_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id")
    )
    item_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id")
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    condition: Mapped[str] = mapped_column(
        Enum(
            "new",
            "used",
            "damaged",
            "expired",
            name="return_condition"
        ),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "approved",
            "rejected",
            "received",
            "completed",
            name="return_status"
        ),
        nullable=False,
        default="pending"
    )
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    order = relationship("Order")
    item = relationship("Item")


class ReturnInspection(Base):
    """Return inspection model."""
    
    __tablename__ = "return_inspections"
    
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    return_auth_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("return_authorizations.id")
    )
    inspector_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "pending",
            "in_progress",
            "accepted",
            "rejected",
            name="inspection_status"
        ),
        nullable=False,
        default="pending"
    )
    condition: Mapped[str] = mapped_column(
        Enum(
            "new",
            "used",
            "damaged",
            "expired",
            name="return_condition"
        ),
        nullable=True
    )
    results: Mapped[dict] = mapped_column(JSON, nullable=True)
    notes: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    return_auth = relationship("ReturnAuthorization")
    inspector = relationship("User") 