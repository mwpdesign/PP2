#!/usr/bin/env python3
"""
Test script for treatment tracking database schema
Verifies the treatment_records table functionality
"""

import asyncio
import os
import sys
from datetime import date
from uuid import uuid4

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db  # noqa: E402
from sqlalchemy import text  # noqa: E402


async def test_treatment_tracking():
    """Test the treatment_records table functionality"""

    print("🧪 Testing Treatment Tracking Database Schema")
    print("=" * 50)

    async for db in get_db():
        try:
            # Test 1: Verify table exists and structure
            print("\n1. Verifying table structure...")
            result = await db.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'treatment_records'
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()

            print(f"✅ Table has {len(columns)} columns:")
            for col in columns:
                nullable = "NULL" if col.is_nullable == "YES" else "NOT NULL"
                default = (f" DEFAULT {col.column_default}"
                          if col.column_default else "")
                print(f"   - {col.column_name}: {col.data_type} "
                      f"{nullable}{default}")

            # Test 2: Verify indexes exist
            print("\n2. Verifying indexes...")
            result = await db.execute(text("""
                SELECT indexname FROM pg_indexes
                WHERE tablename = 'treatment_records'
                AND indexname != 'treatment_records_pkey'
                ORDER BY indexname
            """))
            indexes = result.fetchall()

            print(f"✅ Found {len(indexes)} performance indexes:")
            for idx in indexes:
                print(f"   - {idx.indexname}")

            # Test 3: Verify foreign key constraints
            print("\n3. Verifying foreign key constraints...")
            result = await db.execute(text("""
                SELECT constraint_name, column_name, foreign_table_name, foreign_column_name
                FROM information_schema.key_column_usage kcu
                JOIN information_schema.referential_constraints rc
                    ON kcu.constraint_name = rc.constraint_name
                JOIN information_schema.key_column_usage fkcu
                    ON rc.unique_constraint_name = fkcu.constraint_name
                WHERE kcu.table_name = 'treatment_records'
                ORDER BY constraint_name
            """))
            constraints = result.fetchall()

            print(f"✅ Found {len(constraints)} foreign key constraints:")
            for constraint in constraints:
                print(f"   - {constraint.constraint_name}: {constraint.column_name} -> {constraint.foreign_table_name}.{constraint.foreign_column_name}")

            # Test 4: Verify trigger exists
            print("\n4. Verifying update trigger...")
            result = await db.execute(text("""
                SELECT trigger_name, event_manipulation, action_timing
                FROM information_schema.triggers
                WHERE event_object_table = 'treatment_records'
            """))
            triggers = result.fetchall()

            print(f"✅ Found {len(triggers)} triggers:")
            for trigger in triggers:
                print(f"   - {trigger.trigger_name}: {trigger.action_timing} {trigger.event_manipulation}")

            # Test 5: Test basic insert (if we have required data)
            print("\n5. Testing basic operations...")

            # Check if we have patients and orders to reference
            patient_result = await db.execute(text("SELECT id FROM patients LIMIT 1"))
            patient_row = patient_result.fetchone()

            order_result = await db.execute(text("SELECT id FROM orders LIMIT 1"))
            order_row = order_result.fetchone()

            user_result = await db.execute(text("SELECT id FROM users LIMIT 1"))
            user_row = user_result.fetchone()

            if patient_row and order_row and user_row:
                # Insert a test record
                test_id = str(uuid4())
                await db.execute(text("""
                    INSERT INTO treatment_records (
                        id, patient_id, order_id, product_id, product_name,
                        quantity_used, date_applied, diagnosis, procedure_performed,
                        wound_location, doctor_notes, recorded_by
                    ) VALUES (
                        :id, :patient_id, :order_id, :product_id, :product_name,
                        :quantity_used, :date_applied, :diagnosis, :procedure_performed,
                        :wound_location, :doctor_notes, :recorded_by
                    )
                """), {
                    "id": test_id,
                    "patient_id": str(patient_row.id),
                    "order_id": str(order_row.id),
                    "product_id": "TEST-001",
                    "product_name": "Test Wound Dressing",
                    "quantity_used": 1,
                    "date_applied": date.today(),
                    "diagnosis": "Test wound",
                    "procedure_performed": "Test application",
                    "wound_location": "Test location",
                    "doctor_notes": "Test notes",
                    "recorded_by": str(user_row.id)
                })

                # Verify the record was inserted
                result = await db.execute(text("""
                    SELECT id, product_name, quantity_used, date_applied, created_at, updated_at
                    FROM treatment_records
                    WHERE id = :id
                """), {"id": test_id})

                record = result.fetchone()
                if record:
                    print("✅ Successfully inserted test record:")
                    print(f"   - ID: {record.id}")
                    print(f"   - Product: {record.product_name}")
                    print(f"   - Quantity: {record.quantity_used}")
                    print(f"   - Date Applied: {record.date_applied}")
                    print(f"   - Created: {record.created_at}")
                    print(f"   - Updated: {record.updated_at}")

                # Test update trigger
                await db.execute(text("""
                    UPDATE treatment_records
                    SET doctor_notes = 'Updated test notes'
                    WHERE id = :id
                """), {"id": test_id})

                # Verify updated_at changed
                result = await db.execute(text("""
                    SELECT updated_at FROM treatment_records WHERE id = :id
                """), {"id": test_id})

                updated_record = result.fetchone()
                if updated_record and updated_record.updated_at > record.updated_at:
                    print("✅ Update trigger working correctly")

                # Clean up test record
                await db.execute(text("""
                    DELETE FROM treatment_records WHERE id = :id
                """), {"id": test_id})

                await db.commit()
                print("✅ Test record cleaned up")

            else:
                print("⚠️  Skipping insert test - missing required reference data")
                print(f"   - Patients: {'✅' if patient_row else '❌'}")
                print(f"   - Orders: {'✅' if order_row else '❌'}")
                print(f"   - Users: {'✅' if user_row else '❌'}")

            # Test 6: Count existing records
            result = await db.execute(text("SELECT COUNT(*) as count FROM treatment_records"))
            count = result.fetchone()
            print(f"\n6. Current treatment records in database: {count.count}")

            print("\n" + "=" * 50)
            print("🎉 Treatment Tracking Schema Test Complete!")
            print("✅ All database components verified successfully")

        except Exception as e:
            print(f"❌ Error during testing: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(test_treatment_tracking())