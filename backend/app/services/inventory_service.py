"""
Inventory management service for warehouse operations.
Implements HIPAA-compliant inventory tracking.
"""

from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.logistics import (
    WarehouseLocation,
    InventoryTransaction,
    StockLevel,
)
from app.core.exceptions import ValidationError


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    async def get_item_locations(
        self,
        items: List[Dict]
    ) -> List[WarehouseLocation]:
        """Get warehouse locations for items."""
        try:
            locations = []
            for item in items:
                item_locations = (
                    self.db.query(WarehouseLocation)
                    .filter(
                        WarehouseLocation.item_id == item["id"],
                        WarehouseLocation.quantity >= item["quantity"],
                    )
                    .all()
                )

                if not item_locations:
                    raise ValidationError(f"Insufficient stock for item {item['id']}")

                locations.extend(item_locations)

            return locations

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to get item locations: {str(e)}"
            )

    async def add_inventory(
        self,
        item_id: UUID,
        quantity: int,
        condition: str = "new",
        location: Optional[Dict] = None,
    ) -> InventoryTransaction:
        """Add inventory items to warehouse."""
        try:
            # Create inventory transaction
            transaction = InventoryTransaction(
                item_id=item_id, quantity=quantity, type="addition", condition=condition
            )
            self.db.add(transaction)

            # Update or create stock level
            stock = (
                self.db.query(StockLevel)
                .filter(
                    StockLevel.item_id == item_id, StockLevel.condition == condition
                )
                .first()
            )

            if stock:
                stock.quantity += quantity
                stock.last_updated = datetime.utcnow()
            else:
                stock = StockLevel(
                    item_id=item_id, quantity=quantity, condition=condition
                )
                self.db.add(stock)

            # Assign warehouse location if provided
            if location:
                warehouse_loc = WarehouseLocation(
                    item_id=item_id,
                    quantity=quantity,
                    zone=location.get("zone"),
                    aisle=location.get("aisle"),
                    shelf=location.get("shelf"),
                    bin=location.get("bin"),
                )
                self.db.add(warehouse_loc)

            self.db.commit()
            return transaction

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Failed to add inventory: {str(e)}"
            )

    async def remove_inventory(
        self, item_id: UUID, quantity: int, location_id: Optional[UUID] = None
    ) -> InventoryTransaction:
        """Remove inventory items from warehouse."""
        try:
            # Verify stock availability
            stock = (
                self.db.query(StockLevel).filter(StockLevel.item_id == item_id).first()
            )

            if not stock or stock.quantity < quantity:
                raise ValidationError("Insufficient stock")

            # Create removal transaction
            transaction = InventoryTransaction(
                item_id=item_id, quantity=quantity, type="removal"
            )
            self.db.add(transaction)

            # Update stock level
            stock.quantity -= quantity
            stock.last_updated = datetime.utcnow()

            # Update warehouse location if specified
            if location_id:
                location = self.db.query(WarehouseLocation).get(location_id)
                if location:
                    if location.quantity < quantity:
                        raise ValidationError("Insufficient stock at location")
                    location.quantity -= quantity

            self.db.commit()
            return transaction

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Failed to remove inventory: {str(e)}"
            )

    async def get_stock_levels(
        self, item_id: Optional[UUID] = None
    ) -> List[StockLevel]:
        """Get current stock levels."""
        try:
            query = self.db.query(StockLevel)
            if item_id:
                query = query.filter(StockLevel.item_id == item_id)
            return query.all()

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to get stock levels: {str(e)}"
            )

    async def get_low_stock_items(self, threshold: int = 10) -> List[Dict]:
        """Get items with stock below threshold."""
        try:
            low_stock = (
                self.db.query(StockLevel).filter(StockLevel.quantity <= threshold).all()
            )

            return [
                {
                    "item_id": stock.item_id,
                    "quantity": stock.quantity,
                    "condition": stock.condition,
                    "last_updated": stock.last_updated,
                }
                for stock in low_stock
            ]

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to get low stock items: {str(e)}"
            )
