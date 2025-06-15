#!/usr/bin/env python3
"""
Test script for Invitation Schemas
Task ID: mbvu8p4nc9bidurxtvc
Phase 2: Service Layer Implementation

This script tests the Pydantic schemas for the invitation system.
"""

import sys
from datetime import datetime, timedelta
from uuid import uuid4

# Add the backend directory to the Python path
sys.path.append('/Users/michaelparson/PP2/healthcare-ivr-platform/backend')

from app.schemas.invitation import (
    InvitationCreateRequest,
    DoctorInvitationRequest,
    SalesInvitationRequest,
    PracticeStaffInvitationRequest,
    InvitationAcceptRequest,
    InvitationResponse,
    InvitationListParams,
    InvitationStatisticsParams,
    InvitationEmailTemplate,
    InvitationValidationResponse
)


def test_invitation_create_request():
    """Test InvitationCreateRequest schema."""
    print("🔍 Testing InvitationCreateRequest...")

    try:
        # Valid request
        request = InvitationCreateRequest(
            email="test@example.com",
            invitation_type="doctor",
            role_name="doctor",
            first_name="John",
            last_name="Doe",
            organization_id=uuid4(),
            invitation_message="Welcome to our platform!",
            expires_in_days=7
        )

        assert request.email == "test@example.com"
        assert request.invitation_type == "doctor"
        assert request.role_name == "doctor"
        assert request.expires_in_days == 7
        print("✅ Valid InvitationCreateRequest created successfully")

        # Test validation - invalid invitation type
        try:
            invalid_request = InvitationCreateRequest(
                email="test@example.com",
                invitation_type="invalid_type",
                role_name="doctor"
            )
            print("❌ Should have failed with invalid invitation type")
            return False
        except ValueError as e:
            print("✅ Correctly rejected invalid invitation type")

        # Test validation - invalid expires_in_days
        try:
            invalid_request = InvitationCreateRequest(
                email="test@example.com",
                invitation_type="doctor",
                role_name="doctor",
                expires_in_days=50  # Too many days
            )
            print("❌ Should have failed with invalid expires_in_days")
            return False
        except ValueError as e:
            print("✅ Correctly rejected invalid expires_in_days")

        return True

    except Exception as e:
        print(f"❌ InvitationCreateRequest test failed: {e}")
        return False


def test_doctor_invitation_request():
    """Test DoctorInvitationRequest schema."""
    print("\n🔍 Testing DoctorInvitationRequest...")

    try:
        request = DoctorInvitationRequest(
            email="doctor@example.com",
            organization_id=uuid4(),
            first_name="Dr. Jane",
            last_name="Smith",
            invitation_message="Join our medical practice!"
        )

        assert request.email == "doctor@example.com"
        assert request.first_name == "Dr. Jane"
        assert request.last_name == "Smith"
        print("✅ DoctorInvitationRequest created successfully")

        return True

    except Exception as e:
        print(f"❌ DoctorInvitationRequest test failed: {e}")
        return False


def test_practice_staff_invitation_request():
    """Test PracticeStaffInvitationRequest schema."""
    print("\n🔍 Testing PracticeStaffInvitationRequest...")

    try:
        # Valid office admin request
        request = PracticeStaffInvitationRequest(
            email="admin@example.com",
            organization_id=uuid4(),
            staff_role="office_admin",
            first_name="Mary",
            last_name="Johnson"
        )

        assert request.staff_role == "office_admin"
        print("✅ Valid PracticeStaffInvitationRequest created successfully")

        # Test validation - invalid staff role
        try:
            invalid_request = PracticeStaffInvitationRequest(
                email="staff@example.com",
                organization_id=uuid4(),
                staff_role="invalid_role"
            )
            print("❌ Should have failed with invalid staff role")
            return False
        except ValueError as e:
            print("✅ Correctly rejected invalid staff role")

        return True

    except Exception as e:
        print(f"❌ PracticeStaffInvitationRequest test failed: {e}")
        return False


def test_invitation_accept_request():
    """Test InvitationAcceptRequest schema."""
    print("\n🔍 Testing InvitationAcceptRequest...")

    try:
        request = InvitationAcceptRequest(
            password="securepassword123",
            first_name="John",
            last_name="Doe",
            phone="555-1234",
            additional_data={"department": "cardiology"}
        )

        assert request.password == "securepassword123"
        assert request.additional_data["department"] == "cardiology"
        print("✅ InvitationAcceptRequest created successfully")

        # Test validation - password too short
        try:
            invalid_request = InvitationAcceptRequest(
                password="short"  # Too short
            )
            print("❌ Should have failed with short password")
            return False
        except ValueError as e:
            print("✅ Correctly rejected short password")

        return True

    except Exception as e:
        print(f"❌ InvitationAcceptRequest test failed: {e}")
        return False


def test_invitation_response():
    """Test InvitationResponse schema."""
    print("\n🔍 Testing InvitationResponse...")

    try:
        now = datetime.utcnow()
        expires_at = now + timedelta(days=7)

        response = InvitationResponse(
            id=uuid4(),
            email="test@example.com",
            invitation_type="doctor",
            role_name="doctor",
            first_name="John",
            last_name="Doe",
            full_name="John Doe",
            organization_id=uuid4(),
            status="pending",
            invited_by_id=uuid4(),
            invited_at=now,
            expires_at=expires_at,
            invitation_message="Welcome!",
            email_attempts=0,
            is_expired=False,
            is_pending=True,
            is_accepted=False,
            days_until_expiry=7,
            created_at=now,
            updated_at=now
        )

        assert response.email == "test@example.com"
        assert response.full_name == "John Doe"
        assert response.is_pending == True
        print("✅ InvitationResponse created successfully")

        return True

    except Exception as e:
        print(f"❌ InvitationResponse test failed: {e}")
        return False


def test_invitation_list_params():
    """Test InvitationListParams schema."""
    print("\n🔍 Testing InvitationListParams...")

    try:
        params = InvitationListParams(
            organization_id=uuid4(),
            invitation_type="doctor",
            status="pending",
            limit=25,
            offset=0,
            sort_by="created_at",
            sort_order="desc"
        )

        assert params.limit == 25
        assert params.sort_order == "desc"
        print("✅ InvitationListParams created successfully")

        # Test validation - invalid sort order
        try:
            invalid_params = InvitationListParams(
                sort_order="invalid"
            )
            print("❌ Should have failed with invalid sort order")
            return False
        except ValueError as e:
            print("✅ Correctly rejected invalid sort order")

        # Test validation - invalid status
        try:
            invalid_params = InvitationListParams(
                status="invalid_status"
            )
            print("❌ Should have failed with invalid status")
            return False
        except ValueError as e:
            print("✅ Correctly rejected invalid status")

        return True

    except Exception as e:
        print(f"❌ InvitationListParams test failed: {e}")
        return False


def test_invitation_email_template():
    """Test InvitationEmailTemplate schema."""
    print("\n🔍 Testing InvitationEmailTemplate...")

    try:
        now = datetime.utcnow()
        expires_at = now + timedelta(days=7)

        template = InvitationEmailTemplate(
            invitation_id=uuid4(),
            email="test@example.com",
            first_name="John",
            last_name="Doe",
            invitation_type="doctor",
            role_name="doctor",
            organization_name="Healthcare Corp",
            inviter_name="Dr. Smith",
            invitation_message="Welcome to our team!",
            invitation_url="https://example.com/accept?token=abc123",
            expires_at=expires_at,
            days_until_expiry=7
        )

        assert template.email == "test@example.com"
        assert template.organization_name == "Healthcare Corp"
        assert template.days_until_expiry == 7
        print("✅ InvitationEmailTemplate created successfully")

        return True

    except Exception as e:
        print(f"❌ InvitationEmailTemplate test failed: {e}")
        return False


def test_invitation_validation_response():
    """Test InvitationValidationResponse schema."""
    print("\n🔍 Testing InvitationValidationResponse...")

    try:
        # Valid invitation response
        valid_response = InvitationValidationResponse(
            is_valid=True,
            invitation=None,  # Would normally include InvitationResponse
            can_accept=True,
            expires_in_hours=168  # 7 days
        )

        assert valid_response.is_valid == True
        assert valid_response.can_accept == True
        print("✅ Valid InvitationValidationResponse created successfully")

        # Invalid invitation response
        invalid_response = InvitationValidationResponse(
            is_valid=False,
            error="Invitation has expired",
            can_accept=False,
            expires_in_hours=0
        )

        assert invalid_response.is_valid == False
        assert invalid_response.error == "Invitation has expired"
        print("✅ Invalid InvitationValidationResponse created successfully")

        return True

    except Exception as e:
        print(f"❌ InvitationValidationResponse test failed: {e}")
        return False


def main():
    """Run all schema tests."""
    print("🚀 Starting Invitation Schema Tests")
    print("=" * 50)

    tests = [
        ("InvitationCreateRequest", test_invitation_create_request),
        ("DoctorInvitationRequest", test_doctor_invitation_request),
        ("PracticeStaffInvitationRequest", test_practice_staff_invitation_request),
        ("InvitationAcceptRequest", test_invitation_accept_request),
        ("InvitationResponse", test_invitation_response),
        ("InvitationListParams", test_invitation_list_params),
        ("InvitationEmailTemplate", test_invitation_email_template),
        ("InvitationValidationResponse", test_invitation_validation_response),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
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
        print("🎉 All schema tests passed! Invitation schemas are ready.")
        print("\n📋 Summary:")
        print("✅ Request schemas working correctly")
        print("✅ Response schemas working correctly")
        print("✅ Validation schemas working correctly")
        print("✅ Parameter schemas working correctly")
        print("✅ Email template schemas working correctly")
        print("\n🚀 Ready for Phase 3: API Endpoints Implementation")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())