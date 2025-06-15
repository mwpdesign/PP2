#!/usr/bin/env python3
"""
Direct Invitation Creation Test
Task ID: mbxm2qjdhvvt49x34k9

This script directly tests invitation creation to see the exact error.
"""

import asyncio
import sys
import os
from uuid import uuid4

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.database import get_db
from app.services.invitation_service import InvitationService
from app.models.user import User
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.orm import selectinload


async def test_direct_invitation_creation():
    """Test invitation creation directly through the service."""

    print("🧪 Testing Direct Invitation Creation")
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

            # Test creating an invitation with detailed error handling
            print("\n📧 Testing invitation creation...")

            test_email = f"test-direct-{uuid4().hex[:8]}@example.com"

            try:
                print(f"   Creating invitation for: {test_email}")
                print(f"   Invited by: {admin_user.id} ({admin_user.email})")
                print(f"   Organization: {organization.id} ({organization.name})")

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
                print(f"   Error type: {type(e)}")
                print(f"   Error args: {e.args}")

                # Print more detailed error information
                import traceback
                print(f"   Traceback:")
                traceback.print_exc()

                return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main test function."""
    print("🚀 Starting Direct Invitation Creation Test")
    print("Task ID: mbxm2qjdhvvt49x34k9")
    print()

    success = await test_direct_invitation_creation()

    print("\n" + "=" * 50)
    if success:
        print("🎉 DIRECT TEST PASSED!")
        print("✅ Invitation creation service is working correctly")
    else:
        print("❌ DIRECT TEST FAILED!")
        print("❌ Invitation creation service has issues")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)