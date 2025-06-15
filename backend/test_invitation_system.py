#!/usr/bin/env python3
"""
Test script for User Invitation System
Task ID: mbvu8p4nc9bidurxtvc
Phase 1: Database Schema Verification

This script tests the database schema and models for the user invitation system.
"""

import sys
from uuid import uuid4

# Add the backend directory to the Python path
sys.path.append('/Users/michaelparson/PP2/healthcare-ivr-platform/backend')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.user_invitation import UserInvitation
from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role


def test_database_schema():
    """Test the database schema and table structure."""
    print("🔍 Testing Database Schema...")

    # Database connection
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/healthcare_ivr"
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Test user_invitations table exists
        result = conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name = 'user_invitations'
        """))

        if result.fetchone():
            print("✅ user_invitations table exists")
        else:
            print("❌ user_invitations table not found")
            return False

        # Test table structure
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_invitations'
            ORDER BY ordinal_position
        """))

        columns = result.fetchall()
        expected_columns = [
            'id', 'email', 'invitation_token', 'invitation_type', 'first_name',
            'last_name', 'organization_id', 'role_name', 'status', 'invited_by_id',
            'invited_at', 'sent_at', 'accepted_at', 'expires_at', 'parent_sales_id',
            'parent_distributor_id', 'parent_master_distributor_id', 'parent_doctor_id',
            'invitation_message', 'invitation_metadata', 'email_attempts', 'last_email_sent_at',
            'email_delivery_status', 'ip_address', 'user_agent', 'created_at', 'updated_at'
        ]

        found_columns = [col[0] for col in columns]
        missing_columns = set(expected_columns) - set(found_columns)

        if missing_columns:
            print(f"❌ Missing columns: {missing_columns}")
            return False
        else:
            print(f"✅ All {len(expected_columns)} columns found")

        # Test constraints
        result = conn.execute(text("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'user_invitations'
        """))

        constraints = result.fetchall()
        constraint_types = [c[1] for c in constraints]

        if 'PRIMARY KEY' in constraint_types:
            print("✅ Primary key constraint exists")
        else:
            print("❌ Primary key constraint missing")

        if 'UNIQUE' in constraint_types:
            print("✅ Unique constraints exist")
        else:
            print("❌ Unique constraints missing")

        if 'FOREIGN KEY' in constraint_types:
            print("✅ Foreign key constraints exist")
        else:
            print("❌ Foreign key constraints missing")

        if 'CHECK' in constraint_types:
            print("✅ Check constraints exist")
        else:
            print("❌ Check constraints missing")

        # Test indexes
        result = conn.execute(text("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'user_invitations'
        """))

        indexes = result.fetchall()
        print(f"✅ Found {len(indexes)} indexes on user_invitations table")

        # Test users table new columns
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('invitation_status', 'invitation_accepted_at', 'original_invitation_id')
        """))

        user_columns = result.fetchall()
        if len(user_columns) == 3:
            print("✅ New invitation fields added to users table")
        else:
            print(f"❌ Missing invitation fields in users table: {3 - len(user_columns)} missing")

    return True


def test_sqlalchemy_models():
    """Test SQLAlchemy models and relationships."""
    print("\n🔍 Testing SQLAlchemy Models...")

    try:
        # Test UserInvitation model creation
        invitation = UserInvitation.create_invitation(
            email="test@example.com",
            invitation_type="doctor",
            role_name="doctor",
            invited_by_id=uuid4(),
            organization_id=uuid4(),
            first_name="Test",
            last_name="User",
            invitation_message="Welcome to the platform!",
            expires_in_days=7
        )

        print("✅ UserInvitation model creation successful")
        print(f"   - Email: {invitation.email}")
        print(f"   - Type: {invitation.invitation_type}")
        print(f"   - Status: {invitation.status}")
        print(f"   - Token length: {len(invitation.invitation_token)}")
        print(f"   - Expires in: {invitation.days_until_expiry} days")

        # Test properties
        print(f"   - Full name: {invitation.full_name}")
        print(f"   - Is pending: {invitation.is_pending}")
        print(f"   - Is expired: {invitation.is_expired}")
        print(f"   - Is accepted: {invitation.is_accepted}")

        assert invitation.full_name == "Test User"
        assert invitation.is_pending == True
        assert invitation.is_expired == False
        assert invitation.is_accepted == False

        print("✅ UserInvitation properties working correctly")

        # Test methods
        invitation.mark_as_sent()
        assert invitation.status == "sent"
        assert invitation.sent_at is not None
        assert invitation.email_attempts == 1

        print("✅ UserInvitation methods working correctly")

        # Test to_dict method
        invitation_dict = invitation.to_dict()
        assert "id" in invitation_dict
        assert "email" in invitation_dict
        assert "full_name" in invitation_dict
        assert invitation_dict["full_name"] == "Test User"

        print("✅ UserInvitation to_dict method working correctly")

        # Test URL generation
        url = invitation.get_invitation_url("https://example.com")
        assert url.startswith("https://example.com/accept-invitation?token=")

        print("✅ Invitation URL generation working correctly")

    except Exception as e:
        print(f"❌ SQLAlchemy model test failed: {str(e)}")
        return False

    return True


def test_invitation_lifecycle():
    """Test the complete invitation lifecycle."""
    print("\n🔍 Testing Invitation Lifecycle...")

    try:
        # Create invitation
        invitation = UserInvitation.create_invitation(
            email="lifecycle@example.com",
            invitation_type="sales",
            role_name="sales",
            invited_by_id=uuid4(),
            organization_id=uuid4(),
            expires_in_days=7
        )

        # Test initial state
        assert invitation.status == "pending"
        assert invitation.is_pending == True
        print("✅ Initial state: pending")

        # Mark as sent
        invitation.mark_as_sent()
        assert invitation.status == "sent"
        assert invitation.email_attempts == 1
        print("✅ Marked as sent")

        # Increment email attempts
        invitation.increment_email_attempts()
        assert invitation.email_attempts == 2
        print("✅ Email attempts incremented")

        # Set delivery status
        invitation.set_email_delivery_status("delivered")
        assert invitation.email_delivery_status == "delivered"
        print("✅ Email delivery status set")

        # Mark as accepted
        invitation.mark_as_accepted()
        assert invitation.status == "accepted"
        assert invitation.is_accepted == True
        assert invitation.accepted_at is not None
        print("✅ Marked as accepted")

        # Test expiry extension
        original_expiry = invitation.expires_at
        invitation.extend_expiry(14)
        assert invitation.expires_at > original_expiry
        print("✅ Expiry extended")

        # Test failure marking
        invitation.mark_as_failed("Email bounced")
        assert invitation.status == "failed"
        assert invitation.email_delivery_status == "failed"
        assert "failure_reason" in invitation.invitation_metadata
        print("✅ Marked as failed with reason")

    except Exception as e:
        print(f"❌ Invitation lifecycle test failed: {str(e)}")
        return False

    return True


def test_invitation_types():
    """Test different invitation types and validation."""
    print("\n🔍 Testing Invitation Types...")

    invitation_types = [
        'doctor', 'sales', 'distributor', 'master_distributor',
        'office_admin', 'medical_staff', 'ivr_company', 'shipping_logistics',
        'admin', 'chp_admin'
    ]

    try:
        for inv_type in invitation_types:
            invitation = UserInvitation.create_invitation(
                email=f"{inv_type}@example.com",
                invitation_type=inv_type,
                role_name=inv_type,
                invited_by_id=uuid4(),
                organization_id=uuid4()
            )
            assert invitation.invitation_type == inv_type
            print(f"✅ {inv_type} invitation type created successfully")

        print(f"✅ All {len(invitation_types)} invitation types validated")

    except Exception as e:
        print(f"❌ Invitation types test failed: {str(e)}")
        return False

    return True


def main():
    """Run all tests."""
    print("🚀 Starting User Invitation System Tests")
    print("=" * 50)

    tests = [
        ("Database Schema", test_database_schema),
        ("SQLAlchemy Models", test_sqlalchemy_models),
        ("Invitation Lifecycle", test_invitation_lifecycle),
        ("Invitation Types", test_invitation_types),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} Test...")
        try:
            if test_func():
                print(f"✅ {test_name} Test PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} Test FAILED")
        except Exception as e:
            print(f"❌ {test_name} Test FAILED with exception: {str(e)}")

    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! User Invitation System is ready.")
        print("\n📋 Summary:")
        print("✅ Database schema created successfully")
        print("✅ SQLAlchemy models working correctly")
        print("✅ Invitation lifecycle functional")
        print("✅ All invitation types supported")
        print("\n🚀 Ready for Phase 2: Service Layer Implementation")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())