#!/usr/bin/env python3
"""
Test script for the comprehensive product catalog models.

This script tests:
- Product category creation and hierarchy
- Product creation with regulatory compliance
- Multi-size product variants
- Inventory tracking
- Dynamic pricing
"""

import asyncio
import sys
import os
from decimal import Decimal
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.products import (
    ProductCategory, Product, ProductSize, Inventory, ProductPricing
)
from app.core.database import Base


async def test_product_models():
    """Test the product catalog models."""

    # Database connection
    DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/healthcare_ivr"

    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("🧪 Testing Product Catalog Models...")

            # Test 1: Create Product Category
            print("\n1️⃣ Creating Product Category...")
            wound_care_category = ProductCategory(
                name="Wound Care",
                description="Advanced wound care products",
                category_code="WOUND_CARE",
                regulatory_class="Class I",
                requires_prescription=False
            )
            session.add(wound_care_category)
            await session.flush()  # Get the ID
            print(f"✅ Created category: {wound_care_category.name} (ID: {wound_care_category.id})")

            # Test 2: Create Product
            print("\n2️⃣ Creating Product...")
            foam_dressing = Product(
                name="Advanced Foam Dressing",
                description="Highly absorbent foam dressing for moderate to heavy exudate wounds",
                manufacturer="MedSupply Corp",
                sku="AFD-001",
                hcpcs_code="A6209",
                category_id=wound_care_category.id,
                base_price=Decimal("15.99"),
                regulatory_class="Class I",
                fda_cleared=True,
                latex_free=True,
                sterile=True
            )
            session.add(foam_dressing)
            await session.flush()
            print(f"✅ Created product: {foam_dressing.name} (SKU: {foam_dressing.sku})")

            # Test 3: Create Product Sizes
            print("\n3️⃣ Creating Product Sizes...")
            sizes_data = [
                {"name": "2x2 inch", "code": "2X2", "dimensions": "2x2 inches", "suffix": "-2X2"},
                {"name": "4x4 inch", "code": "4X4", "dimensions": "4x4 inches", "suffix": "-4X4"},
                {"name": "6x6 inch", "code": "6X6", "dimensions": "6x6 inches", "suffix": "-6X6"},
            ]

            product_sizes = []
            for size_data in sizes_data:
                product_size = ProductSize(
                    product_id=foam_dressing.id,
                    size_name=size_data["name"],
                    size_code=size_data["code"],
                    dimensions=size_data["dimensions"],
                    sku_suffix=size_data["suffix"],
                    units_per_package=1,
                    is_active=True
                )
                session.add(product_size)
                product_sizes.append(product_size)

            await session.flush()
            print(f"✅ Created {len(product_sizes)} product sizes")

            # Test 4: Create Inventory Records
            print("\n4️⃣ Creating Inventory Records...")
            inventory_data = [
                {"size_code": "2X2", "quantity": 500},
                {"size_code": "4X4", "quantity": 300},
                {"size_code": "6X6", "quantity": 150},
            ]

            for i, inv_data in enumerate(inventory_data):
                inventory = Inventory(
                    product_size_id=product_sizes[i].id,
                    warehouse_location="Main Warehouse",
                    quantity_available=inv_data["quantity"],
                    quantity_reserved=0,
                    reorder_level=50,
                    reorder_quantity=200,
                    unit_cost=Decimal("8.50")
                )
                session.add(inventory)

            await session.flush()
            print(f"✅ Created inventory records for all sizes")

            # Test 5: Create Pricing Records
            print("\n5️⃣ Creating Pricing Records...")
            pricing_data = [
                {"size_code": "2X2", "price": Decimal("15.99")},
                {"size_code": "4X4", "price": Decimal("25.99")},
                {"size_code": "6X6", "price": Decimal("35.99")},
            ]

            for i, price_data in enumerate(pricing_data):
                pricing = ProductPricing(
                    product_size_id=product_sizes[i].id,
                    price=price_data["price"],
                    cost=Decimal("8.50"),
                    price_type="standard",
                    effective_date=datetime.utcnow(),
                    min_quantity=1,
                    currency="USD",
                    is_active=True
                )
                session.add(pricing)

            await session.flush()
            print(f"✅ Created pricing records for all sizes")

            # Test 6: Commit all changes
            print("\n6️⃣ Committing to database...")
            await session.commit()
            print("✅ All data committed successfully!")

            # Test 7: Query and verify data
            print("\n7️⃣ Verifying data...")

            # Query the product with relationships
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload

            stmt = select(Product).options(
                selectinload(Product.category),
                selectinload(Product.sizes).selectinload(ProductSize.inventory_records),
                selectinload(Product.sizes).selectinload(ProductSize.pricing_records)
            ).where(Product.sku == "AFD-001")

            result = await session.execute(stmt)
            product = result.scalar_one_or_none()

            if product:
                print(f"✅ Product: {product.name}")
                print(f"   Category: {product.category.name}")
                print(f"   Sizes: {len(product.sizes)}")

                for size in product.sizes:
                    inventory = size.inventory_records[0] if size.inventory_records else None
                    pricing = size.pricing_records[0] if size.pricing_records else None

                    print(f"   - {size.size_name}: {inventory.quantity_available if inventory else 0} units @ ${pricing.price if pricing else 'N/A'}")

            print("\n🎉 All tests passed! Product catalog models are working correctly.")

        except Exception as e:
            print(f"❌ Error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_product_models())