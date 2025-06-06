#!/usr/bin/env python3
"""Check IVR data in the database."""

import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import after path modification
from app.core.database import get_db  # noqa: E402
from app.models.ivr import IVRRequest  # noqa: E402


async def check_ivr_data():
    """Check IVR data in the database."""
    try:
        async for db in get_db():
            # Query all IVR requests
            from sqlalchemy import select

            result = await db.execute(select(IVRRequest))
            ivr_requests = result.scalars().all()

            print(f"Total IVR requests in database: {len(ivr_requests)}")
            print("-" * 50)

            for ivr in ivr_requests:
                print(f"ID: {ivr.id}")
                print(f"Status: {ivr.status}")
                print(f"Patient ID: {ivr.patient_id}")
                print(f"Provider ID: {ivr.provider_id}")
                print(f"Facility ID: {ivr.facility_id}")
                print(f"Service Type: {ivr.service_type}")
                print(f"Priority: {ivr.priority}")
                print(f"Current Reviewer: {ivr.current_reviewer_id}")
                print(f"Created: {ivr.created_at}")
                print(f"Updated: {ivr.updated_at}")
                print("-" * 30)

            break  # Only need one session

    except Exception as e:
        print(f"Error checking IVR data: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(check_ivr_data())