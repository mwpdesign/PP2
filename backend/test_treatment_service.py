#!/usr/bin/env python3
"""
Test script for TreatmentService functionality.

This script tests all the methods of the TreatmentService class to ensure
proper business logic, validation, and error handling.
"""

import sys
import os
from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.orm import sessionmaker

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.database import engine  # noqa: E402
from app.api.treatments.service import TreatmentService  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.exceptions import (  # noqa: E402
    NotFoundException, ValidationError
)

# Create database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def test_treatment_service():
    """Test all TreatmentService methods."""
    print("🧪 Testing TreatmentService...")

    db = SessionLocal()
    service = TreatmentService(db)

    try:
        # Test data setup
        print("\n📋 Setting up test data...")

        # Get existing test data from database
        test_patient = db.query(Patient).first()
        test_user = db.query(User).first()
        test_order = db.query(Order).filter(Order.status == "received").first()

        if not test_patient:
            print("❌ No test patient found in database")
            return False

        if not test_user:
            print("❌ No test user found in database")
            return False

        if not test_order:
            print("❌ No received test order found in database")
            return False

        print(f"✅ Using test patient: {test_patient.id}")
        print(f"✅ Using test user: {test_user.id}")
        print(f"✅ Using test order: {test_order.id}")

        # Test 1: Create treatment record with valid data
        print("\n🧪 Test 1: Create treatment record with valid data")
        treatment_data = {
            "product_id": "Q4100",
            "product_name": "Skin Graft 2x2 inch",
            "quantity_used": 1,
            "date_applied": date.today(),
            "diagnosis": "Chronic wound",
            "procedure_performed": "Skin graft application",
            "wound_location": "Left leg",
            "doctor_notes": "Patient responded well to treatment"
        }

        try:
            treatment = service.create_treatment_record(
                user_id=test_user.id,
                patient_id=test_patient.id,
                order_id=test_order.id,
                treatment_data=treatment_data
            )
            db.commit()
            print(f"✅ Treatment record created: {treatment.id}")
            test_treatment_id = treatment.id
        except Exception as e:
            print(f"❌ Failed to create treatment record: {e}")
            return False

        # Test 2: Get treatment by ID
        print("\n🧪 Test 2: Get treatment by ID")
        try:
            retrieved_treatment = service.get_treatment_by_id(test_treatment_id)
            print(f"✅ Retrieved treatment: {retrieved_treatment.product_name}")
            print(f"   Quantity used: {retrieved_treatment.quantity_used}")
            print(f"   Date applied: {retrieved_treatment.date_applied}")
        except Exception as e:
            print(f"❌ Failed to retrieve treatment: {e}")
            return False

        # Test 3: Get treatments by patient
        print("\n🧪 Test 3: Get treatments by patient")
        try:
            patient_treatments = service.get_treatments_by_patient(test_patient.id)
            print(f"✅ Found {len(patient_treatments)} treatments for patient")
            for treatment in patient_treatments:
                print(f"   - {treatment.product_name} ({treatment.quantity_used} units)")
        except Exception as e:
            print(f"❌ Failed to get treatments by patient: {e}")
            return False

        # Test 4: Get treatments by order
        print("\n🧪 Test 4: Get treatments by order")
        try:
            order_treatments = service.get_treatments_by_order(test_order.id)
            print(f"✅ Found {len(order_treatments)} treatments for order")
            for treatment in order_treatments:
                print(f"   - {treatment.product_name} ({treatment.quantity_used} units)")
        except Exception as e:
            print(f"❌ Failed to get treatments by order: {e}")
            return False

        # Test 5: Get patient inventory summary
        print("\n🧪 Test 5: Get patient inventory summary")
        try:
            inventory = service.get_patient_inventory_summary(test_patient.id)
            print(f"✅ Inventory summary generated")
            print(f"   Patient: {inventory['patient_name']}")
            print(f"   Total products: {inventory['total_products']}")
            remaining_count = inventory['products_with_remaining_inventory']
            print(f"   Products with remaining inventory: {remaining_count}")

            for product in inventory['products'][:3]:  # Show first 3 products
                print(f"   - {product['product_name']}: "
                      f"Ordered: {product['ordered_quantity']}, "
                      f"Used: {product['used_quantity']}, "
                      f"Remaining: {product['remaining_quantity']}")
        except Exception as e:
            print(f"❌ Failed to get inventory summary: {e}")
            return False

        # Test 6: Validation errors
        print("\n🧪 Test 6: Validation errors")

        # Test missing required field
        try:
            invalid_data = treatment_data.copy()
            del invalid_data["product_id"]
            service.create_treatment_record(
                user_id=test_user.id,
                patient_id=test_patient.id,
                order_id=test_order.id,
                treatment_data=invalid_data
            )
            print("❌ Should have failed with missing product_id")
            return False
        except ValidationError as e:
            print(f"✅ Correctly caught validation error: {e.detail}")

        # Test negative quantity
        try:
            invalid_data = treatment_data.copy()
            invalid_data["quantity_used"] = -1
            service.create_treatment_record(
                user_id=test_user.id,
                patient_id=test_patient.id,
                order_id=test_order.id,
                treatment_data=invalid_data
            )
            print("❌ Should have failed with negative quantity")
            return False
        except ValidationError as e:
            print(f"✅ Correctly caught validation error: {e.detail}")

        # Test future date
        try:
            invalid_data = treatment_data.copy()
            invalid_data["date_applied"] = date.today() + timedelta(days=1)
            service.create_treatment_record(
                user_id=test_user.id,
                patient_id=test_patient.id,
                order_id=test_order.id,
                treatment_data=invalid_data
            )
            print("❌ Should have failed with future date")
            return False
        except ValidationError as e:
            print(f"✅ Correctly caught validation error: {e.detail}")

        # Test 7: Not found errors
        print("\n🧪 Test 7: Not found errors")

        # Test non-existent patient
        try:
            service.get_treatments_by_patient(uuid4())
            print("❌ Should have failed with non-existent patient")
            return False
        except NotFoundException as e:
            print(f"✅ Correctly caught not found error: {e.detail}")

        # Test non-existent order
        try:
            service.get_treatments_by_order(uuid4())
            print("❌ Should have failed with non-existent order")
            return False
        except NotFoundException as e:
            print(f"✅ Correctly caught not found error: {e.detail}")

        # Test non-existent treatment
        try:
            service.get_treatment_by_id(uuid4())
            print("❌ Should have failed with non-existent treatment")
            return False
        except NotFoundException as e:
            print(f"✅ Correctly caught not found error: {e.detail}")

        print("\n🎉 All TreatmentService tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_business_logic():
    """Test specific business logic scenarios."""
    print("\n🧪 Testing business logic scenarios...")

    db = SessionLocal()
    service = TreatmentService(db)

    try:
        # Get test data
        test_patient = db.query(Patient).first()
        test_user = db.query(User).first()

        if not test_patient or not test_user:
            print("❌ Missing test data for business logic tests")
            return False

        # Test order-patient mismatch
        print("\n🧪 Test: Order doesn't belong to patient")

        # Get an order for a different patient
        other_order = db.query(Order).filter(
            Order.patient_id != test_patient.id
        ).first()

        if other_order:
            try:
                treatment_data = {
                    "product_id": "Q4100",
                    "product_name": "Test Product",
                    "quantity_used": 1,
                    "date_applied": date.today()
                }

                service.create_treatment_record(
                    user_id=test_user.id,
                    patient_id=test_patient.id,
                    order_id=other_order.id,
                    treatment_data=treatment_data
                )
                print("❌ Should have failed with order-patient mismatch")
                return False
            except NotFoundException as e:
                print(f"✅ Correctly caught order-patient mismatch: {e.detail}")
        else:
            print("⚠️  Skipping order-patient mismatch test (no other orders found)")

        # Test order status validation
        print("\n🧪 Test: Order status validation")

        # Get a pending order
        pending_order = db.query(Order).filter(
            Order.status == "pending",
            Order.patient_id == test_patient.id
        ).first()

        if pending_order:
            try:
                treatment_data = {
                    "product_id": "Q4100",
                    "product_name": "Test Product",
                    "quantity_used": 1,
                    "date_applied": date.today()
                }

                service.create_treatment_record(
                    user_id=test_user.id,
                    patient_id=test_patient.id,
                    order_id=pending_order.id,
                    treatment_data=treatment_data
                )
                print("❌ Should have failed with invalid order status")
                return False
            except ValidationError as e:
                print(f"✅ Correctly caught order status validation: {e.detail}")
        else:
            print("⚠️  Skipping order status test (no pending orders found)")

        print("\n🎉 Business logic tests completed!")
        return True

    except Exception as e:
        print(f"\n❌ Unexpected error during business logic testing: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def main():
    """Run all tests."""
    print("🚀 Starting TreatmentService Test Suite")
    print("=" * 50)

    # Test basic functionality
    basic_tests_passed = test_treatment_service()

    # Test business logic
    business_tests_passed = test_business_logic()

    print("\n" + "=" * 50)
    print("📊 TEST RESULTS:")
    print(f"Basic functionality tests: {'✅ PASSED' if basic_tests_passed else '❌ FAILED'}")
    print(f"Business logic tests: {'✅ PASSED' if business_tests_passed else '❌ FAILED'}")

    if basic_tests_passed and business_tests_passed:
        print("\n🎉 ALL TESTS PASSED! TreatmentService is ready for use.")
        return True
    else:
        print("\n❌ SOME TESTS FAILED. Please review the errors above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)