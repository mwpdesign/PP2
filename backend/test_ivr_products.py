#!/usr/bin/env python3
"""
Test script for multi-size product selection in IVR requests.
"""

import asyncio
import json
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.services.ivr_service import IVRService
from app.schemas.ivr import (
    IVRRequestCreate, ProductSelectionCreate, ProductSizeCreate
)

settings = get_settings()


async def test_ivr_products():
    """Test creating IVR request with multi-size products."""

    # Create async engine and session
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        ivr_service = IVRService(session)

        # Create test data
        product_sizes = [
            ProductSizeCreate(
                size="2X2",
                dimensions="2x2 cm",
                unit_price=Decimal("125.00"),
                quantity=5,
                total=Decimal("625.00")
            ),
            ProductSizeCreate(
                size="4X4",
                dimensions="4x4 cm",
                unit_price=Decimal("425.00"),
                quantity=2,
                total=Decimal("850.00")
            )
        ]

        product_selection = ProductSelectionCreate(
            product_name="RAMPART Wound Care Matrix",
            q_code="Q4347",
            total_quantity=7,
            total_cost=Decimal("1475.00"),
            sizes=product_sizes
        )

        # Use real IDs from the database
        from uuid import UUID
        ivr_request_data = IVRRequestCreate(
            patient_id=UUID("4b76e6bf-d48c-40bc-be25-27e6fed48ac1"),
            provider_id=UUID("22222222-2222-2222-2222-222222222222"),
            facility_id=UUID("b097e755-ed02-44ac-8084-6dc668450a98"),
            service_type="Wound Care Authorization",
            priority="high",
            selected_products=[product_selection],
            notes="Test IVR request with multi-size products"
        )

        try:
            # Create the IVR request
            print("Creating IVR request with multi-size products...")
            ivr_request = await ivr_service.create_ivr_request(ivr_request_data)
            print(f"✅ Created IVR request: {ivr_request.id}")

            # Retrieve the IVR request with products
            print("Retrieving IVR request with products...")
            retrieved_request = await ivr_service.get_ivr_request(ivr_request.id)

            if retrieved_request:
                print(f"✅ Retrieved IVR request: {retrieved_request.id}")
                print(f"   Service Type: {retrieved_request.service_type}")
                print(f"   Priority: {retrieved_request.priority}")
                print(f"   Products: {len(retrieved_request.products)}")

                for product in retrieved_request.products:
                    print(f"   - Product: {product.product_name}")
                    print(f"     Q-Code: {product.q_code}")
                    print(f"     Total Quantity: {product.total_quantity}")
                    print(f"     Total Cost: ${product.total_cost}")
                    print(f"     Sizes: {len(product.sizes)}")

                    for size in product.sizes:
                        print(f"       - Size: {size.size} ({size.dimensions})")
                        print(f"         Quantity: {size.quantity}")
                        print(f"         Unit Price: ${size.unit_price}")
                        print(f"         Total: ${size.total}")

                print("✅ Multi-size product selection working correctly!")
                return True
            else:
                print("❌ Failed to retrieve IVR request")
                return False

        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_ivr_products())