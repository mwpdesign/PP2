#!/usr/bin/env python3
"""
Test script to verify invitation creation fix
Task ID: mbxm2qjdhvvt49x34k9

This script tests that the SQLAlchemy async relationship access issue
in _validate_inviter_permissions has been resolved.
"""

import asyncio
import sys
import os
from uuid import UUID

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.database import get_db
from app.services.invitation_service import InvitationService
from app.models.user import User
from app.models.rbac import Role
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.orm import selectinload


async def test_invitation_creation():
    """Test invitation creation with the fixed _validate_inviter_permissions method."""

    print("🧪 Testing Invitation Creation Fix")
    print("=" * 50)

    try:
        # Get database session
        async for session in get_db():
            invitation_service = InvitationService(session)

            print("✅ Database connection successful")

            # Find an admin user to test with
            stmt = select(User).options(selectinload(User.role)).limit(1)
            result = await session.execute(stmt)
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                print("❌ No users found in database")
                return False

            print(f"✅ Found test user: {admin_user.email}")
            print(f"   Role: {admin_user.role.name if admin_user.role else 'None'}")

            # Find an organization
            stmt = select(Organization).limit(1)
            result = await session.execute(stmt)
            organization = result.scalar_one_or_none()

            if not organization:
                print("❌ No organizations found in database")
                return False

            print(f"✅ Found organization: {organization.name}")

            # Test the _validate_inviter_permissions method directly
            print("\n🔍 Testing _validate_inviter_permissions method...")

            try:
                await invitation_service._validate_inviter_permissions(
                    invited_by_id=admin_user.id,
                    invitation_type="doctor",
                    organization_id=organization.id
                )
                print("✅ _validate_inviter_permissions completed without error")

            except Exception as e:
                print(f"❌ _validate_inviter_permissions failed: {e}")
                return False

            # Test creating an actual invitation
            print("\n📧 Testing invitation creation...")

            test_email = "test-invitation@example.com"

            try:
                invitation = await invitation_service.create_invitation(
                    email=test_email,
                    invitation_type="doctor",
                    role_name="doctor",
                    invited_by_id=admin_user.id,
                    organization_id=organization.id,
                    first_name="Test",
                    last_name="Doctor"
                )

                print(f"✅ Invitation created successfully!")
                print(f"   ID: {invitation.id}")
                print(f"   Email: {invitation.email}")
                print(f"   Type: {invitation.invitation_type}")
                print(f"   Status: {invitation.status}")

                # Clean up - delete the test invitation
                await session.delete(invitation)
                await session.commit()
                print("✅ Test invitation cleaned up")

                return True

            except Exception as e:
                print(f"❌ Invitation creation failed: {e}")
                return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False


async def main():
    """Main test function."""
    print("🚀 Starting Invitation System Fix Test")
    print("Task ID: mbxm2qjdhvvt49x34k9")
    print()

    success = await test_invitation_creation()

    print("\n" + "=" * 50)
    if success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Invitation creation fix is working correctly")
        print("✅ SQLAlchemy async relationship access issue resolved")
    else:
        print("❌ TESTS FAILED!")
        print("❌ Invitation creation still has issues")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)