#!/usr/bin/env python3
"""Check products in the database."""

import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from app.models.product import Product  # noqa: E402


async def check_products():
    """Check products in the database."""
    try:
        async for db in get_db():
            # Query all products
            from sqlalchemy import select

            result = await db.execute(select(Product))
            products = result.scalars().all()

            print(f"Total products in database: {len(products)}")
            print("-" * 50)

            for product in products:
                print(f"Name: {product.name}")
                print(f"SKU: {product.sku}")
                print(f"HCPCS Code: {product.hcpcs_code}")
                print(f"Category: {product.category}")
                print(f"Price: ${product.unit_price}")
                print(f"Active: {product.is_active}")
                if product.product_metadata:
                    print(f"Q Code: {product.product_metadata.get('q_code', 'N/A')}")
                    print(f"Size: {product.product_metadata.get('size', 'N/A')}")
                    print(f"Surface Area: {product.product_metadata.get('surface_area_cm2', 'N/A')} cm²")
                print("-" * 30)

            break  # Only need one session

    except Exception as e:
        print(f"Error checking products: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(check_products())