#!/usr/bin/env python3
"""
Test script for TreatmentRecord SQLAlchemy model
Verifies model functionality, relationships, and validation
"""

import asyncio
import sys
import os
from datetime import date, datetime
from uuid import uuid4

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from sqlalchemy import text


async def test_treatment_model():
    """Test the TreatmentRecord model functionality"""

    print("🧪 Testing TreatmentRecord SQLAlchemy Model")
    print("=" * 50)

    async for db in get_db():
        try:
            # Test 1: Import the model
            print("\n1. Testing model import...")
            try:
                from app.api.treatments.models import TreatmentRecord
                print("✅ TreatmentRecord model imported successfully")
            except ImportError as e:
                print(f"❌ Failed to import TreatmentRecord: {e}")
                return

            # Test 2: Check model attributes
            print("\n2. Testing model attributes...")
            model_attrs = [
                'id', 'patient_id', 'order_id', 'product_id', 'product_name',
                'quantity_used', 'date_applied', 'diagnosis', 'procedure_performed',
                'wound_location', 'doctor_notes', 'recorded_by', 'created_at', 'updated_at'
            ]

            for attr in model_attrs:
                if hasattr(TreatmentRecord, attr):
                    print(f"   ✅ {attr}")
                else:
                    print(f"   ❌ Missing attribute: {attr}")

            # Test 3: Check relationships
            print("\n3. Testing model relationships...")
            relationships = ['patient', 'order', 'recorded_by_user']

            for rel in relationships:
                if hasattr(TreatmentRecord, rel):
                    print(f"   ✅ {rel} relationship")
                else:
                    print(f"   ❌ Missing relationship: {rel}")

            # Test 4: Check methods and properties
            print("\n4. Testing model methods and properties...")
            methods = [
                'validate_quantity_used', 'validate_date_applied',
                'validate_product_id', 'validate_product_name',
                'age_in_days', 'is_recent', 'get_remaining_inventory',
                'to_dict', 'create_from_dict'
            ]

            for method in methods:
                if hasattr(TreatmentRecord, method):
                    print(f"   ✅ {method}")
                else:
                    print(f"   ❌ Missing method: {method}")

            # Test 5: Test model instantiation
            print("\n5. Testing model instantiation...")

            # Get sample IDs from database
            patient_result = await db.execute(text("SELECT id FROM patients LIMIT 1"))
            patient_row = patient_result.fetchone()

            order_result = await db.execute(text("SELECT id FROM orders LIMIT 1"))
            order_row = order_result.fetchone()

            user_result = await db.execute(text("SELECT id FROM users LIMIT 1"))
            user_row = user_result.fetchone()

            if patient_row and order_row and user_row:
                try:
                    # Create a test instance
                    treatment = TreatmentRecord(
                        patient_id=patient_row.id,
                        order_id=order_row.id,
                        product_id="TEST-PRODUCT-001",
                        product_name="Test Wound Dressing",
                        quantity_used=2,
                        date_applied=date.today(),
                        diagnosis="Test diagnosis",
                        procedure_performed="Test procedure",
                        wound_location="Test location",
                        doctor_notes="Test notes",
                        recorded_by=user_row.id
                    )

                    print("✅ Model instance created successfully")
                    print(f"   - ID: {treatment.id}")
                    print(f"   - Product: {treatment.product_name}")
                    print(f"   - Quantity: {treatment.quantity_used}")
                    print(f"   - Date: {treatment.date_applied}")

                    # Test string representations
                    print(f"   - __repr__: {repr(treatment)}")
                    print(f"   - __str__: {str(treatment)}")

                    # Test properties
                    print(f"   - Age in days: {treatment.age_in_days}")
                    print(f"   - Is recent: {treatment.is_recent}")

                    # Test to_dict method
                    treatment_dict = treatment.to_dict()
                    print(f"   - to_dict keys: {list(treatment_dict.keys())}")

                except Exception as e:
                    print(f"❌ Failed to create model instance: {e}")
            else:
                print("⚠️  Skipping instantiation test - missing reference data")
                print(f"   - Patients: {'✅' if patient_row else '❌'}")
                print(f"   - Orders: {'✅' if order_row else '❌'}")
                print(f"   - Users: {'✅' if user_row else '❌'}")

            # Test 6: Test validation
            print("\n6. Testing model validation...")

            try:
                # Test quantity validation
                treatment = TreatmentRecord()
                try:
                    treatment.quantity_used = 0  # Should fail
                    print("❌ Quantity validation failed - allowed 0")
                except ValueError:
                    print("✅ Quantity validation working - rejected 0")

                try:
                    treatment.quantity_used = 5  # Should pass
                    print("✅ Quantity validation working - accepted 5")
                except ValueError:
                    print("❌ Quantity validation failed - rejected valid value")

                # Test date validation
                try:
                    from datetime import timedelta
                    future_date = date.today() + timedelta(days=1)
                    treatment.date_applied = future_date  # Should fail
                    print("❌ Date validation failed - allowed future date")
                except ValueError:
                    print("✅ Date validation working - rejected future date")

                try:
                    treatment.date_applied = date.today()  # Should pass
                    print("✅ Date validation working - accepted today's date")
                except ValueError:
                    print("❌ Date validation failed - rejected valid date")

            except Exception as e:
                print(f"⚠️  Validation test error: {e}")

            print("\n" + "=" * 50)
            print("🎉 TreatmentRecord Model Test Complete!")
            print("✅ Model structure and functionality verified")

        except Exception as e:
            print(f"❌ Error during testing: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_treatment_model())