#!/usr/bin/env python3
"""
Debug script for testing IVR communication endpoints directly.
"""

import asyncio
import sys
import os
from uuid import UUID

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.services.ivr_service import IVRService
from app.models.ivr import IVRRequest, IVRCommunicationMessage
from sqlalchemy import select


async def test_communication_endpoints():
    """Test the communication endpoints directly."""
    print("🔍 Testing IVR Communication Endpoints")
    print("=" * 50)

    try:
        # Get database session
        async for db in get_db():
            ivr_service = IVRService(db)

            # Test 1: Check if IVR request exists
            print("1. Checking for existing IVR requests...")
            result = await db.execute(select(IVRRequest).limit(1))
            ivr_request = result.scalar_one_or_none()

            if not ivr_request:
                print("❌ No IVR requests found in database")
                return

            print(f"✅ Found IVR request: {ivr_request.id}")

            # Test 2: Try to get existing messages
            print("\n2. Getting existing communication messages...")
            try:
                messages = await ivr_service.get_communication_messages(ivr_request.id)
                print(f"✅ Retrieved {len(messages)} messages")
                for msg in messages:
                    print(f"   - {msg.author_name} ({msg.author_type}): {msg.message[:50]}...")
            except Exception as e:
                print(f"❌ Error getting messages: {e}")
                import traceback
                traceback.print_exc()

            # Test 3: Try to add a new message
            print("\n3. Adding a new test message...")
            try:
                test_author_id = UUID('311e87c4-812e-4f8c-b842-62f4d5cdffbe')  # Real IVR user ID
                new_message = await ivr_service.add_communication_message(
                    ivr_request_id=ivr_request.id,
                    author_id=test_author_id,
                    message="Test message from debug script",
                    author_type="ivr_specialist",
                    author_name="Debug Tester",
                    message_type="text",
                    attachments=[]
                )
                print(f"✅ Added message: {new_message.id}")
            except Exception as e:
                print(f"❌ Error adding message: {e}")
                import traceback
                traceback.print_exc()

            # Test 4: Check database table structure
            print("\n4. Checking table structure...")
            try:
                result = await db.execute(select(IVRCommunicationMessage).limit(1))
                sample_message = result.scalar_one_or_none()
                if sample_message:
                    print(f"✅ Sample message found: {sample_message.message}")
                    print(f"   Author: {sample_message.author_name}")
                    print(f"   Type: {sample_message.author_type}")
                else:
                    print("ℹ️ No messages in table yet")
            except Exception as e:
                print(f"❌ Error checking table: {e}")
                import traceback
                traceback.print_exc()

            break  # Exit the async generator

    except Exception as e:
        print(f"❌ Database connection error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_communication_endpoints())