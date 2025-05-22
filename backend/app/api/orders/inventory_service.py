from datetime import datetime
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.security import verify_territory_access
from app.core.exceptions import InventoryException, AccessDeniedException
from app.core.audit import audit_inventory_change
from .models import (
    Product,
    ProductInventory,
    ProductPricing,
    ProductCompliance
)

class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    async def get_product_availability(
        self,
        product_id: str,
        territory_id: str,
        quantity: int = 1
    ) -> Tuple[bool, str]:
        """Check if a product is available in the specified territory."""
        inventory = self.db.query(ProductInventory).filter(
            and_(
                ProductInventory.product_id == product_id,
                ProductInventory.territory_id == territory_id
            )
        ).first()

        if not inventory:
            return False, "Product not available in this territory"

        if inventory.available_quantity < quantity:
            return False, f"Insufficient stock. Available: {inventory.available_quantity}"

        # Check compliance
        compliance = self.db.query(ProductCompliance).filter(
            ProductCompliance.product_id == product_id
        ).first()

        if compliance and not compliance.is_valid():
            return False, "Product compliance certification expired"

        return True, "Product available"

    async def reserve_inventory(
        self,
        product_id: str,
        territory_id: str,
        quantity: int,
        order_id: str
    ) -> bool:
        """Reserve product inventory for an order."""
        inventory = self.db.query(ProductInventory).filter(
            and_(
                ProductInventory.product_id == product_id,
                ProductInventory.territory_id == territory_id
            )
        ).with_for_update().first()

        if not inventory or inventory.available_quantity < quantity:
            raise InventoryException("Insufficient inventory")

        try:
            inventory.reserved_quantity += quantity
            self.db.commit()

            await audit_inventory_change(
                self.db,
                "reserve",
                product_id,
                quantity,
                order_id
            )
            return True
        except Exception as e:
            self.db.rollback()
            raise InventoryException(f"Failed to reserve inventory: {str(e)}")

    async def release_inventory(
        self,
        product_id: str,
        territory_id: str,
        quantity: int,
        order_id: str
    ) -> bool:
        """Release reserved inventory back to available stock."""
        inventory = self.db.query(ProductInventory).filter(
            and_(
                ProductInventory.product_id == product_id,
                ProductInventory.territory_id == territory_id
            )
        ).with_for_update().first()

        if not inventory or inventory.reserved_quantity < quantity:
            raise InventoryException("Invalid release quantity")

        try:
            inventory.reserved_quantity -= quantity
            self.db.commit()

            await audit_inventory_change(
                self.db,
                "release",
                product_id,
                quantity,
                order_id
            )
            return True
        except Exception as e:
            self.db.rollback()
            raise InventoryException(f"Failed to release inventory: {str(e)}")

    async def update_stock_level(
        self,
        product_id: str,
        territory_id: str,
        quantity: int,
        operation: str
    ) -> ProductInventory:
        """Update product stock levels."""
        inventory = self.db.query(ProductInventory).filter(
            and_(
                ProductInventory.product_id == product_id,
                ProductInventory.territory_id == territory_id
            )
        ).with_for_update().first()

        if not inventory:
            raise InventoryException("Inventory record not found")

        try:
            if operation == "add":
                inventory.quantity += quantity
                inventory.last_restock_date = datetime.utcnow()
            elif operation == "remove":
                if inventory.available_quantity < quantity:
                    raise InventoryException("Insufficient available quantity")
                inventory.quantity -= quantity
            else:
                raise InventoryException("Invalid operation")

            self.db.commit()

            await audit_inventory_change(
                self.db,
                operation,
                product_id,
                quantity
            )
            return inventory
        except Exception as e:
            self.db.rollback()
            raise InventoryException(f"Failed to update stock level: {str(e)}")

    async def check_reorder_points(self) -> List[Dict]:
        """Check all products against their reorder points."""
        alerts = []
        inventories = self.db.query(ProductInventory).filter(
            ProductInventory.quantity <= ProductInventory.reorder_point
        ).all()

        for inventory in inventories:
            alerts.append({
                "product_id": inventory.product_id,
                "territory_id": inventory.territory_id,
                "current_quantity": inventory.quantity,
                "reorder_point": inventory.reorder_point,
                "reorder_quantity": inventory.reorder_quantity
            })

        return alerts

    async def get_territory_pricing(
        self,
        product_id: str,
        territory_id: str
    ) -> float:
        """Get territory-specific pricing for a product."""
        pricing = self.db.query(ProductPricing).filter(
            and_(
                ProductPricing.product_id == product_id,
                ProductPricing.territory_id == territory_id,
                ProductPricing.is_active == True,
                or_(
                    ProductPricing.effective_to.is_(None),
                    ProductPricing.effective_to > datetime.utcnow()
                )
            )
        ).first()

        if not pricing:
            # Fall back to base price
            product = self.db.query(Product).get(product_id)
            if not product:
                raise InventoryException("Product not found")
            return product.base_price

        return pricing.price

    async def search_products(
        self,
        query: str,
        territory_id: str,
        category_id: Optional[str] = None,
        compliance_status: Optional[str] = None,
        in_stock_only: bool = False
    ) -> List[Product]:
        """Search products with various filters."""
        base_query = self.db.query(Product).filter(Product.is_active == True)

        if query:
            base_query = base_query.filter(
                or_(
                    Product.name.ilike(f"%{query}%"),
                    Product.code.ilike(f"%{query}%"),
                    Product.description.ilike(f"%{query}%")
                )
            )

        if category_id:
            base_query = base_query.filter(
                Product.categories.any(id=category_id)
            )

        if compliance_status:
            base_query = base_query.filter(
                Product.compliance.any(status=compliance_status)
            )

        if in_stock_only:
            base_query = base_query.filter(
                Product.inventory.any(
                    and_(
                        ProductInventory.territory_id == territory_id,
                        ProductInventory.available_quantity > 0
                    )
                )
            )

        return base_query.all()

    async def get_inventory_report(
        self,
        territory_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """Generate inventory report for a territory."""
        # Implementation for inventory reporting and analytics
        pass  # TODO: Implement detailed reporting logic 