"""
Fulfillment service for order processing and warehouse management.
Implements HIPAA-compliant fulfillment operations.
"""

from typing import List, Dict
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.logistics import (
    FulfillmentOrder,
    PickingList,
    QualityCheck,
    WarehouseLocation,
    ReturnAuthorization,
    ReturnInspection,
)
from app.services.shipping_service import ShippingService
from app.services.inventory_service import InventoryService
from app.core.exceptions import ValidationError


class FulfillmentService:
    def __init__(self, db: Session):
        self.db = db
        self.shipping_service = ShippingService()
        self.inventory_service = InventoryService(db)

    async def create_fulfillment_order(
        self, order_id: UUID, priority: str = "normal"
    ) -> FulfillmentOrder:
        """Create fulfillment order from sales order."""
        try:
            # Get order details
            order = await self.get_order(order_id)

            # Create fulfillment order
            fulfillment_order = FulfillmentOrder(
                order_id=order_id,
                status="pending",
                priority=priority,
                items=order.items,
                shipping_info=order.shipping_info,
            )
            self.db.add(fulfillment_order)

            # Generate picking list
            picking_list = await self.generate_picking_list(fulfillment_order)
            self.db.add(picking_list)

            # Create quality check record
            quality_check = QualityCheck(
                fulfillment_order_id=fulfillment_order.id, status="pending"
            )
            self.db.add(quality_check)

            self.db.commit()
            return fulfillment_order

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Failed to create fulfillment order: {str(
                    e)}"
            )

    async def generate_picking_list(
        self, fulfillment_order: FulfillmentOrder
    ) -> PickingList:
        """Generate optimized picking list."""
        try:
            # Get warehouse locations for items
            locations = await self.inventory_service.get_item_locations(
                fulfillment_order.items
            )

            # Optimize picking route
            optimized_route = self.optimize_picking_route(locations)

            # Create picking list
            picking_list = PickingList(
                fulfillment_order_id=fulfillment_order.id,
                locations=optimized_route,
                status="pending",
            )
            self.db.add(picking_list)

            return picking_list

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to generate picking list: {str(e)}"
            )

    def optimize_picking_route(
        self, locations: List[WarehouseLocation]
    ) -> List[WarehouseLocation]:
        """Optimize warehouse picking route."""
        return sorted(
            locations,
            key=lambda x: (x.zone,
            x.aisle,
            x.shelf,
            x.bin)
        )

    async def process_quality_check(
        self, fulfillment_order_id: UUID, inspector_id: UUID, results: Dict
    ) -> QualityCheck:
        """Process quality check for fulfillment order."""
        try:
            quality_check = (
                self.db.query(QualityCheck)
                .filter(
                    QualityCheck.fulfillment_order_id == fulfillment_order_id,
                    QualityCheck.status == "pending",
                )
                .first()
            )

            if not quality_check:
                raise ValidationError("No pending quality check found")

            quality_check.inspector_id = inspector_id
            quality_check.results = results
            quality_check.status = "completed"
            quality_check.completed_at = datetime.utcnow()

            self.db.commit()
            return quality_check

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Failed to process quality check: {str(e)}"
            )

    async def process_return(self, return_auth: ReturnAuthorization) -> Dict:
        """Process return merchandise authorization."""
        try:
            # Validate return authorization
            if not self.validate_return(return_auth):
                raise ValidationError("Invalid return authorization")

            # Create inspection record
            inspection = ReturnInspection(
                return_auth_id=return_auth.id, status="pending"
            )
            self.db.add(inspection)

            # Update inventory if accepted
            if return_auth.status == "accepted":
                await self.inventory_service.add_inventory(
                    return_auth.item_id,
                    return_auth.quantity,
                    condition=return_auth.condition,
                )

            self.db.commit()
            return {"status": "success", "inspection_id": inspection.id}

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Failed to process return: {str(e)}"
            )

    def validate_return(self, return_auth: ReturnAuthorization) -> bool:
        """Validate return authorization."""
        if not return_auth.order_id:
            return False
        if not return_auth.item_id:
            return False
        if return_auth.quantity <= 0:
            return False
        if not return_auth.reason:
            return False
        return True
