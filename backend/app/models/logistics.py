"""
Logistics models for shipping and fulfillment operations.
Implements HIPAA-compliant data models.
"""
from datetime import datetime
from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Integer,
    JSON,
    String,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.core.database import Base


class FulfillmentOrder(Base):
    """Fulfillment order model."""
    
    __tablename__ = "fulfillment_orders"
    
    id = Column(PGUUID, primary_key=True)
    order_id = Column(PGUUID, ForeignKey("orders.id"))
    status = Column(
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
    priority = Column(
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
    items = Column(JSON, nullable=False)
    shipping_info = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
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
    """Picking list model."""
    
    __tablename__ = "picking_lists"
    
    id = Column(PGUUID, primary_key=True)
    fulfillment_order_id = Column(
        PGUUID,
        ForeignKey("fulfillment_orders.id")
    )
    picker_id = Column(PGUUID, ForeignKey("users.id"), nullable=True)
    status = Column(
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
    locations = Column(JSON, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    fulfillment_order = relationship(
        "FulfillmentOrder",
        back_populates="picking_lists"
    )
    picker = relationship("User")


class QualityCheck(Base):
    """Quality check model."""
    
    __tablename__ = "quality_checks"
    
    id = Column(PGUUID, primary_key=True)
    fulfillment_order_id = Column(
        PGUUID,
        ForeignKey("fulfillment_orders.id")
    )
    inspector_id = Column(PGUUID, ForeignKey("users.id"), nullable=True)
    status = Column(
        Enum(
            "pending",
            "in_progress",
            "completed",
            "failed",
            name="quality_check_status"
        ),
        nullable=False,
        default="pending"
    )
    results = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    fulfillment_order = relationship(
        "FulfillmentOrder",
        back_populates="quality_checks"
    )
    inspector = relationship("User")


class WarehouseLocation(Base):
    """Warehouse location model."""
    
    __tablename__ = "warehouse_locations"
    
    id = Column(PGUUID, primary_key=True)
    item_id = Column(PGUUID, ForeignKey("items.id"))
    zone = Column(String, nullable=False)
    aisle = Column(String, nullable=False)
    shelf = Column(String, nullable=False)
    bin = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    item = relationship("Item")


class InventoryTransaction(Base):
    """Inventory transaction model."""
    
    __tablename__ = "inventory_transactions"
    
    id = Column(PGUUID, primary_key=True)
    item_id = Column(PGUUID, ForeignKey("items.id"))
    location_id = Column(
        PGUUID,
        ForeignKey("warehouse_locations.id"),
        nullable=True
    )
    type = Column(
        Enum(
            "addition",
            "removal",
            "transfer",
            "adjustment",
            name="transaction_type"
        ),
        nullable=False
    )
    quantity = Column(Integer, nullable=False)
    reference_id = Column(PGUUID, nullable=True)
    reference_type = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    item = relationship("Item")
    location = relationship("WarehouseLocation")


class StockLevel(Base):
    """Stock level model."""
    
    __tablename__ = "stock_levels"
    
    id = Column(PGUUID, primary_key=True)
    item_id = Column(PGUUID, ForeignKey("items.id"))
    quantity = Column(Integer, nullable=False, default=0)
    condition = Column(
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
    last_counted = Column(DateTime, nullable=True)
    last_updated = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    item = relationship("Item")


class ReturnAuthorization(Base):
    """Return authorization model."""
    
    __tablename__ = "return_authorizations"
    
    id = Column(PGUUID, primary_key=True)
    order_id = Column(PGUUID, ForeignKey("orders.id"))
    item_id = Column(PGUUID, ForeignKey("items.id"))
    quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    condition = Column(
        Enum(
            "new",
            "used",
            "damaged",
            "expired",
            name="return_condition"
        ),
        nullable=False
    )
    status = Column(
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
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    order = relationship("Order")
    item = relationship("Item")


class ReturnInspection(Base):
    """Return inspection model."""
    
    __tablename__ = "return_inspections"
    
    id = Column(PGUUID, primary_key=True)
    return_auth_id = Column(
        PGUUID,
        ForeignKey("return_authorizations.id")
    )
    inspector_id = Column(PGUUID, ForeignKey("users.id"), nullable=True)
    status = Column(
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
    condition = Column(
        Enum(
            "new",
            "used",
            "damaged",
            "expired",
            name="return_condition"
        ),
        nullable=True
    )
    results = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Relationships
    return_auth = relationship("ReturnAuthorization")
    inspector = relationship("User") 