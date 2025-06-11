"""
Inventory management service for the Healthcare IVR Platform.

This service provides comprehensive inventory management functionality including:
- Real-time stock level checking
- Inventory updates and adjustments
- Low stock alerts and reorder management
- Lot tracking and expiration monitoring
- Multi-warehouse inventory support
"""

from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from decimal import Decimal

from app.models.products import (
    ProductSize, Inventory
)
from app.schemas.products import (
    InventoryCreate, InventoryUpdate, InventoryResponse
)


class InventoryService:
    """Service for managing product inventory operations."""

    def __init__(self, db: AsyncSession):
        """Initialize the inventory service."""
        self.db = db

    async def get_product_inventory(
        self,
        product_id: UUID,
        warehouse_location: Optional[str] = None
    ) -> List[InventoryResponse]:
        """Get inventory for all sizes of a product."""
        query = (
            select(Inventory)
            .join(ProductSize)
            .where(ProductSize.product_id == product_id)
            .where(Inventory.is_active)
            .options(selectinload(Inventory.product_size))
        )

        if warehouse_location:
            query = query.where(
                Inventory.warehouse_location == warehouse_location
            )

        result = await self.db.execute(query)
        inventory_records = result.scalars().all()

        return [
            InventoryResponse(
                **inventory.__dict__,
                quantity_available_for_sale=inventory.quantity_available_for_sale,
                is_low_stock=inventory.is_low_stock,
                is_out_of_stock=inventory.is_out_of_stock
            )
            for inventory in inventory_records
        ]

    async def get_size_inventory(
        self,
        product_size_id: UUID,
        warehouse_location: Optional[str] = None
    ) -> Optional[InventoryResponse]:
        """Get inventory for a specific product size."""
        query = (
            select(Inventory)
            .where(Inventory.product_size_id == product_size_id)
            .where(Inventory.is_active)
            .options(selectinload(Inventory.product_size))
        )

        if warehouse_location:
            query = query.where(
                Inventory.warehouse_location == warehouse_location
            )

        result = await self.db.execute(query)
        inventory = result.scalar_one_or_none()

        if not inventory:
            return None

        return InventoryResponse(
            **inventory.__dict__,
            quantity_available_for_sale=inventory.quantity_available_for_sale,
            is_low_stock=inventory.is_low_stock,
            is_out_of_stock=inventory.is_out_of_stock
        )

    async def check_stock_availability(
        self,
        product_size_id: UUID,
        requested_quantity: int,
        warehouse_location: Optional[str] = None
    ) -> Dict[str, Any]:
        """Check if requested quantity is available in stock."""
        inventory = await self.get_size_inventory(product_size_id, warehouse_location)

        if not inventory:
            return {
                "available": False,
                "available_quantity": 0,
                "requested_quantity": requested_quantity,
                "shortage": requested_quantity,
                "message": "No inventory record found"
            }

        available_quantity = inventory.quantity_available_for_sale
        is_available = available_quantity >= requested_quantity
        shortage = max(0, requested_quantity - available_quantity)

        return {
            "available": is_available,
            "available_quantity": available_quantity,
            "requested_quantity": requested_quantity,
            "shortage": shortage,
            "message": "Available" if is_available else f"Short by {shortage} units"
        }

    async def reserve_inventory(
        self,
        product_size_id: UUID,
        quantity: int,
        warehouse_location: Optional[str] = None
    ) -> bool:
        """Reserve inventory for an order."""
        query = (
            select(Inventory)
            .where(Inventory.product_size_id == product_size_id)
            .where(Inventory.is_active == True)
        )

        if warehouse_location:
            query = query.where(Inventory.warehouse_location == warehouse_location)

        result = await self.db.execute(query)
        inventory = result.scalar_one_or_none()

        if not inventory:
            return False

        # Check if enough quantity is available
        if inventory.quantity_available_for_sale < quantity:
            return False

        # Reserve the inventory
        inventory.quantity_reserved += quantity
        await self.db.commit()

        return True

    async def release_inventory(
        self,
        product_size_id: UUID,
        quantity: int,
        warehouse_location: Optional[str] = None
    ) -> bool:
        """Release reserved inventory."""
        query = (
            select(Inventory)
            .where(Inventory.product_size_id == product_size_id)
            .where(Inventory.is_active == True)
        )

        if warehouse_location:
            query = query.where(Inventory.warehouse_location == warehouse_location)

        result = await self.db.execute(query)
        inventory = result.scalar_one_or_none()

        if not inventory:
            return False

        # Release the inventory (ensure we don't go negative)
        inventory.quantity_reserved = max(0, inventory.quantity_reserved - quantity)
        await self.db.commit()

        return True

    async def fulfill_inventory(
        self,
        product_size_id: UUID,
        quantity: int,
        warehouse_location: Optional[str] = None
    ) -> bool:
        """Fulfill inventory (reduce available and reserved quantities)."""
        query = (
            select(Inventory)
            .where(Inventory.product_size_id == product_size_id)
            .where(Inventory.is_active == True)
        )

        if warehouse_location:
            query = query.where(Inventory.warehouse_location == warehouse_location)

        result = await self.db.execute(query)
        inventory = result.scalar_one_or_none()

        if not inventory:
            return False

        # Fulfill the inventory
        inventory.quantity_available = max(0, inventory.quantity_available - quantity)
        inventory.quantity_reserved = max(0, inventory.quantity_reserved - quantity)
        await self.db.commit()

        return True

    async def adjust_inventory(
        self,
        product_size_id: UUID,
        adjustment: int,
        reason: str,
        warehouse_location: Optional[str] = None
    ) -> bool:
        """Adjust inventory levels (positive or negative adjustment)."""
        query = (
            select(Inventory)
            .where(Inventory.product_size_id == product_size_id)
            .where(Inventory.is_active == True)
        )

        if warehouse_location:
            query = query.where(Inventory.warehouse_location == warehouse_location)

        result = await self.db.execute(query)
        inventory = result.scalar_one_or_none()

        if not inventory:
            return False

        # Apply adjustment (ensure we don't go negative)
        new_quantity = max(0, inventory.quantity_available + adjustment)
        inventory.quantity_available = new_quantity

        # Update total value if unit cost is available
        if inventory.unit_cost:
            inventory.total_value = Decimal(str(new_quantity)) * inventory.unit_cost

        await self.db.commit()

        return True

    async def get_low_stock_items(
        self,
        warehouse_location: Optional[str] = None
    ) -> List[InventoryResponse]:
        """Get all items that are below reorder level."""
        query = (
            select(Inventory)
            .where(Inventory.is_active == True)
            .where(Inventory.quantity_available <= Inventory.reorder_level)
            .options(selectinload(Inventory.product_size))
        )

        if warehouse_location:
            query = query.where(Inventory.warehouse_location == warehouse_location)

        result = await self.db.execute(query)
        inventory_records = result.scalars().all()

        return [
            InventoryResponse(
                **inventory.__dict__,
                quantity_available_for_sale=inventory.quantity_available_for_sale,
                is_low_stock=inventory.is_low_stock,
                is_out_of_stock=inventory.is_out_of_stock
            )
            for inventory in inventory_records
        ]

    async def get_expiring_items(
        self,
        days_ahead: int = 30,
        warehouse_location: Optional[str] = None
    ) -> List[InventoryResponse]:
        """Get items expiring within specified days."""
        expiry_date = datetime.utcnow() + timedelta(days=days_ahead)

        query = (
            select(Inventory)
            .where(Inventory.is_active == True)
            .where(Inventory.expiration_date.isnot(None))
            .where(Inventory.expiration_date <= expiry_date)
            .options(selectinload(Inventory.product_size))
        )

        if warehouse_location:
            query = query.where(Inventory.warehouse_location == warehouse_location)

        result = await self.db.execute(query)
        inventory_records = result.scalars().all()

        return [
            InventoryResponse(
                **inventory.__dict__,
                quantity_available_for_sale=inventory.quantity_available_for_sale,
                is_low_stock=inventory.is_low_stock,
                is_out_of_stock=inventory.is_out_of_stock
            )
            for inventory in inventory_records
        ]

    async def create_inventory_record(
        self,
        inventory_data: InventoryCreate
    ) -> InventoryResponse:
        """Create a new inventory record."""
        inventory = Inventory(**inventory_data.dict())

        # Calculate total value if unit cost is provided
        if inventory.unit_cost:
            inventory.total_value = (
                Decimal(str(inventory.quantity_available)) * inventory.unit_cost
            )

        self.db.add(inventory)
        await self.db.commit()
        await self.db.refresh(inventory)

        return InventoryResponse(
            **inventory.__dict__,
            quantity_available_for_sale=inventory.quantity_available_for_sale,
            is_low_stock=inventory.is_low_stock,
            is_out_of_stock=inventory.is_out_of_stock
        )

    async def update_inventory_record(
        self,
        inventory_id: UUID,
        inventory_data: InventoryUpdate
    ) -> Optional[InventoryResponse]:
        """Update an existing inventory record."""
        inventory = await self.db.get(Inventory, inventory_id)

        if not inventory:
            return None

        # Update fields
        update_data = inventory_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(inventory, field, value)

        # Recalculate total value if quantity or cost changed
        if inventory.unit_cost:
            inventory.total_value = (
                Decimal(str(inventory.quantity_available)) * inventory.unit_cost
            )

        await self.db.commit()
        await self.db.refresh(inventory)

        return InventoryResponse(
            **inventory.__dict__,
            quantity_available_for_sale=inventory.quantity_available_for_sale,
            is_low_stock=inventory.is_low_stock,
            is_out_of_stock=inventory.is_out_of_stock
        )

    async def get_inventory_summary(
        self,
        warehouse_location: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get inventory summary statistics."""
        base_query = select(Inventory).where(Inventory.is_active == True)

        if warehouse_location:
            base_query = base_query.where(
                Inventory.warehouse_location == warehouse_location
            )

        # Total items
        total_items_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total_items = total_items_result.scalar() or 0

        # Low stock items
        low_stock_result = await self.db.execute(
            select(func.count()).select_from(
                base_query.where(
                    Inventory.quantity_available <= Inventory.reorder_level
                ).subquery()
            )
        )
        low_stock_items = low_stock_result.scalar() or 0

        # Out of stock items
        out_of_stock_result = await self.db.execute(
            select(func.count()).select_from(
                base_query.where(Inventory.quantity_available <= 0).subquery()
            )
        )
        out_of_stock_items = out_of_stock_result.scalar() or 0

        # Total inventory value
        value_result = await self.db.execute(
            select(func.sum(Inventory.total_value)).select_from(
                base_query.where(Inventory.total_value.isnot(None)).subquery()
            )
        )
        total_value = value_result.scalar() or Decimal('0.00')

        return {
            "total_items": total_items,
            "low_stock_items": low_stock_items,
            "out_of_stock_items": out_of_stock_items,
            "total_inventory_value": float(total_value),
            "warehouse_location": warehouse_location
        }
