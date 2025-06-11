#!/usr/bin/env python3
"""Check IVR data in the database."""

import asyncio
from app.core.database import engine
from sqlalchemy import text


async def check_ivr_data():
    """Check IVR data in the database."""
    async with engine.begin() as conn:
        # Check IVR requests with more details
        result = await conn.execute(text(
            "SELECT id, status, service_type, doctor_comment, ivr_response, created_at "
            "FROM ivr_requests ORDER BY created_at DESC LIMIT 5;"
        ))
        requests = result.fetchall()
        print("=== IVR REQUESTS DETAILS ===")
        for req in requests:
            print(f"ID: {req[0]}")
            print(f"  Status: {req[1]}")
            print(f"  Service: {req[2]}")
            print(f"  Doctor Comment: {req[3] or 'None'}")
            print(f"  IVR Response: {req[4] or 'None'}")
            print(f"  Created: {req[5]}")
            print()

        # Check communication messages
        result = await conn.execute(text("SELECT COUNT(*) FROM ivr_communication_messages;"))
        count = result.scalar()
        print("=== COMMUNICATION MESSAGES ===")
        print(f"Total messages: {count}")

        if count > 0:
            result = await conn.execute(text(
                "SELECT ivr_request_id, author_name, message, created_at "
                "FROM ivr_communication_messages ORDER BY created_at DESC LIMIT 3;"
            ))
            messages = result.fetchall()
            print("Sample messages:")
            for msg in messages:
                message_preview = msg[2][:50] + "..." if len(msg[2]) > 50 else msg[2]
                print(f"  IVR: {msg[0]}, Author: {msg[1]}, Message: {message_preview}, Created: {msg[3]}")


if __name__ == "__main__":
    asyncio.run(check_ivr_data())