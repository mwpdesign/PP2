#!/usr/bin/env python3
"""Check what tables exist in the database."""

import asyncio
from app.core.database import engine
from sqlalchemy import text


async def check_tables():
    """Check what tables exist in the database."""
    try:
        async with engine.begin() as conn:
            # Get all tables
            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name;"
            ))
            tables = result.fetchall()

            print("=== DATABASE TABLES FOUND ===")
            for table in tables:
                print(f"  - {table[0]}")
            print(f"\nTotal tables: {len(tables)}")

            # Check specific IVR-related tables
            ivr_tables = [
                'ivr_requests', 'ivr_products', 'ivr_product_sizes',
                'ivr_communication_messages', 'ivr_status_history',
                'ivr_approvals', 'ivr_escalations', 'ivr_reviews',
                'ivr_documents', 'ivr_sessions', 'ivr_session_items'
            ]

            print("\n=== IVR TABLE STATUS ===")
            existing_table_names = [table[0] for table in tables]
            for table in ivr_tables:
                status = "✅ EXISTS" if table in existing_table_names else "❌ MISSING"
                print(f"  {table}: {status}")

            # Check if we have any data in key tables
            if 'ivr_requests' in existing_table_names:
                count_result = await conn.execute(text("SELECT COUNT(*) FROM ivr_requests;"))
                count = count_result.scalar()
                print(f"\n=== IVR REQUESTS DATA ===")
                print(f"  Total IVR requests: {count}")

                if count > 0:
                    sample_result = await conn.execute(text(
                        "SELECT id, status, service_type, created_at FROM ivr_requests LIMIT 3;"
                    ))
                    samples = sample_result.fetchall()
                    print("  Sample records:")
                    for sample in samples:
                        print(f"    ID: {sample[0]}, Status: {sample[1]}, Type: {sample[2]}, Created: {sample[3]}")

            # Check patients table
            if 'patients' in existing_table_names:
                count_result = await conn.execute(text("SELECT COUNT(*) FROM patients;"))
                count = count_result.scalar()
                print(f"\n=== PATIENTS DATA ===")
                print(f"  Total patients: {count}")

            # Check users table
            if 'users' in existing_table_names:
                count_result = await conn.execute(text("SELECT COUNT(*) FROM users;"))
                count = count_result.scalar()
                print(f"\n=== USERS DATA ===")
                print(f"  Total users: {count}")

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("This indicates the system is likely using mock data!")


if __name__ == "__main__":
    asyncio.run(check_tables())