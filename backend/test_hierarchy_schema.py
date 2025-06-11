#!/usr/bin/env python3
"""
Test script for Phase 3.1: User Hierarchy Database Schema
Verifies that all hierarchy fields and doctor profiles table work correctly.
"""

import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings  # noqa: E402


def test_hierarchy_schema():
    """Test the user hierarchy database schema."""

    print("🔍 Testing Phase 3.1: User Hierarchy Database Schema")
    print("=" * 60)

    # Get database connection
    settings = get_settings()
    # Use synchronous database connection
    database_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://", "postgresql://")
    engine = create_engine(database_url)

    try:
        with engine.connect() as connection:
            print("✅ Database connection successful")

            # Test 1: Verify hierarchy fields exist in users table
            print("\n📋 Test 1: Checking hierarchy fields in users table...")

            result = connection.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'users'
                AND column_name IN (
                    'parent_sales_id',
                    'parent_distributor_id',
                    'parent_master_distributor_id',
                    'added_by_id',
                    'added_at'
                )
                ORDER BY column_name;
            """))

            hierarchy_fields = [row[0] for row in result.fetchall()]
            expected_fields = [
                'added_at', 'added_by_id', 'parent_distributor_id',
                'parent_master_distributor_id', 'parent_sales_id'
            ]

            if hierarchy_fields == expected_fields:
                print("✅ All hierarchy fields present in users table")
                for field in hierarchy_fields:
                    print(f"   - {field}")
            else:
                print("❌ Missing hierarchy fields:")
                missing = set(expected_fields) - set(hierarchy_fields)
                for field in missing:
                    print(f"   - {field}")
                return False

            # Test 2: Verify doctor_profiles table exists and has all fields
            print("\n📋 Test 2: Checking doctor_profiles table...")

            result = connection.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'doctor_profiles'
                ORDER BY column_name;
            """))

            profile_fields = [row[0] for row in result.fetchall()]
            required_profile_fields = [
                'id', 'user_id', 'professional_title', 'specialty',
                'medical_license_number', 'npi_number', 'medicare_ptan',
                'facility_address_line1', 'shipping_address_line1',
                'professional_bio', 'created_at', 'updated_at'
            ]

            missing_profile_fields = set(required_profile_fields) - set(
                profile_fields)
            if not missing_profile_fields:
                print("✅ doctor_profiles table has all required fields")
                print(f"   Total fields: {len(profile_fields)}")
            else:
                print("❌ Missing fields in doctor_profiles:")
                for field in missing_profile_fields:
                    print(f"   - {field}")
                return False

            # Test 3: Verify all hierarchy roles exist
            print("\n📋 Test 3: Checking hierarchy roles...")

            required_roles = [
                'system_admin', 'chp_admin', 'master_distributor',
                'distributor', 'sales', 'doctor', 'office_admin',
                'medical_staff', 'ivr_company', 'shipping_logistics'
            ]

            result = connection.execute(text("""
                SELECT name, display_name
                FROM roles
                WHERE name = ANY(:role_names)
                ORDER BY name;
            """), {"role_names": required_roles})

            existing_roles = {row[0]: row[1] for row in result.fetchall()}

            if len(existing_roles) == len(required_roles):
                print("✅ All hierarchy roles exist:")
                for role_name, display_name in existing_roles.items():
                    print(f"   - {role_name}: {display_name}")
            else:
                missing_roles = set(required_roles) - set(
                    existing_roles.keys())
                print("❌ Missing roles:")
                for role in missing_roles:
                    print(f"   - {role}")
                return False

            # Test 4: Verify foreign key constraints
            print("\n📋 Test 4: Checking foreign key constraints...")

            result = connection.execute(text("""
                SELECT constraint_name, column_name
                FROM information_schema.key_column_usage
                WHERE table_name = 'users'
                AND constraint_name LIKE '%parent_%'
                ORDER BY constraint_name;
            """))

            fk_constraints = [row[0] for row in result.fetchall()]
            expected_constraints = [
                'users_parent_distributor_id_fkey',
                'users_parent_doctor_id_fkey',
                'users_parent_master_distributor_id_fkey',
                'users_parent_sales_id_fkey'
            ]

            if all(constraint in fk_constraints
                   for constraint in expected_constraints):
                print("✅ All foreign key constraints exist")
                for constraint in expected_constraints:
                    print(f"   - {constraint}")
            else:
                print("❌ Missing foreign key constraints")
                return False

            # Test 5: Verify indexes exist
            print("\n📋 Test 5: Checking indexes...")

            result = connection.execute(text("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'users'
                AND indexname LIKE 'idx_users_%hierarchy%'
                OR indexname LIKE 'idx_users_%parent%'
                OR indexname LIKE 'idx_users_%added%'
                ORDER BY indexname;
            """))

            indexes = [row[0] for row in result.fetchall()]
            expected_indexes = [
                'idx_users_added_by_id',
                'idx_users_parent_distributor_id',
                'idx_users_parent_master_distributor_id',
                'idx_users_parent_sales_id'
            ]

            if all(index in indexes for index in expected_indexes):
                print("✅ All hierarchy indexes exist")
                for index in expected_indexes:
                    print(f"   - {index}")
            else:
                print("❌ Missing indexes")
                return False

            # Test 6: Test doctor_profiles constraints
            print("\n📋 Test 6: Checking doctor_profiles constraints...")

            result = connection.execute(text("""
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints
                WHERE table_name = 'doctor_profiles'
                AND constraint_type IN ('CHECK', 'UNIQUE')
                ORDER BY constraint_name;
            """))

            constraints = [row[0] for row in result.fetchall()]
            expected_constraints = [
                'check_npi_format',
                'check_state_format',
                'check_wound_care_percentage',
                'doctor_profiles_user_id_key'
            ]

            if all(constraint in constraints
                   for constraint in expected_constraints):
                print("✅ All doctor_profiles constraints exist")
                for constraint in expected_constraints:
                    print(f"   - {constraint}")
            else:
                print("❌ Missing doctor_profiles constraints")
                return False

            print("\n🎉 Phase 3.1 Database Schema Test: ALL TESTS PASSED!")
            print("=" * 60)
            print("✅ Hierarchy fields added to users table")
            print("✅ doctor_profiles table created with all required fields")
            print("✅ All 10 hierarchy roles created")
            print("✅ Foreign key constraints working")
            print("✅ Indexes created for performance")
            print("✅ Data validation constraints in place")
            print("\n🚀 Ready for Phase 3.2: User and Doctor Profile Models")

            return True

    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_hierarchy_schema()
    sys.exit(0 if success else 1)