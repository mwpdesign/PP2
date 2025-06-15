#!/usr/bin/env python3
"""
Debug script for invitation creation and listing issue
Task ID: mbxm2qjdhvvt49x34k9

This script will:
1. Test invitation creation
2. Check database directly
3. Test invitation listing
4. Identify filtering issues
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user_invitation import UserInvitation
from app.models.user import User
from app.services.invitation_service import InvitationService
from app.core.security import get_password_hash


async def debug_invitation_issue():
    """Debug the invitation creation and listing issue."""
    print("🔍 DEBUGGING INVITATION ISSUE")
    print("=" * 50)

    async with AsyncSessionLocal() as db:
        try:
            # 1. Check current user in database
            print("\n1. 📋 CHECKING CURRENT USER")
            stmt = select(User).where(User.email == "admin@healthcare.local")
            result = await db.execute(stmt)
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                print("❌ Admin user not found, creating one...")
                admin_user = User(
                    email="admin@healthcare.local",
                    password_hash=get_password_hash("admin123"),
                    first_name="Admin",
                    last_name="User",
                    role="admin",
                    is_active=True
                )
                db.add(admin_user)
                await db.commit()
                await db.refresh(admin_user)
                print(f"✅ Created admin user: {admin_user.id}")
            else:
                print(f"✅ Found admin user: {admin_user.id} ({admin_user.email})")
                print(f"   Role: {admin_user.role}")
                print(f"   Organization ID: {admin_user.organization_id}")

            # 2. Check total invitations in database
            print("\n2. 📊 CHECKING DATABASE INVITATIONS")
            stmt = select(UserInvitation)
            result = await db.execute(stmt)
            all_invitations = result.scalars().all()
            print(f"📈 Total invitations in database: {len(all_invitations)}")

            for inv in all_invitations:
                print(f"   - {inv.email} ({inv.invitation_type}) - Status: {inv.status}")
                print(f"     Created by: {inv.invited_by_id}")
                print(f"     Organization: {inv.organization_id}")
                print(f"     Created at: {inv.created_at}")

            # 3. Test invitation creation
            print("\n3. 🆕 TESTING INVITATION CREATION")
            service = InvitationService(db)

            try:
                test_invitation = await service.create_invitation(
                    email="test@example.com",
                    invitation_type="doctor",
                    role_name="doctor",
                    invited_by_id=admin_user.id,
                    organization_id=admin_user.organization_id,
                    first_name="Test",
                    last_name="Doctor"
                )
                print(f"✅ Created test invitation: {test_invitation.id}")
                print(f"   Email: {test_invitation.email}")
                print(f"   Status: {test_invitation.status}")
                print(f"   Invited by: {test_invitation.invited_by_id}")
                print(f"   Organization: {test_invitation.organization_id}")

            except Exception as e:
                print(f"❌ Failed to create invitation: {e}")

            # 4. Test invitation listing with service
            print("\n4. 📋 TESTING INVITATION LISTING (SERVICE)")
            try:
                invitations, total_count = await service.list_invitations(
                    invited_by_id=admin_user.id,
                    limit=50,
                    offset=0
                )
                print(f"📊 Service returned {len(invitations)} invitations (total: {total_count})")

                for inv in invitations:
                    print(f"   - {inv.email} ({inv.invitation_type}) - Status: {inv.status}")

            except Exception as e:
                print(f"❌ Failed to list invitations: {e}")

            # 5. Test invitation listing without filtering
            print("\n5. 📋 TESTING INVITATION LISTING (NO FILTER)")
            try:
                invitations, total_count = await service.list_invitations(
                    limit=50,
                    offset=0
                )
                print(f"📊 Service returned {len(invitations)} invitations (total: {total_count})")

                for inv in invitations:
                    print(f"   - {inv.email} ({inv.invitation_type}) - Status: {inv.status}")
                    print(f"     Invited by: {inv.invited_by_id}")

            except Exception as e:
                print(f"❌ Failed to list invitations: {e}")

            # 6. Check database directly after creation
            print("\n6. 🔍 CHECKING DATABASE AFTER CREATION")
            stmt = select(UserInvitation)
            result = await db.execute(stmt)
            all_invitations = result.scalars().all()
            print(f"📈 Total invitations in database: {len(all_invitations)}")

            for inv in all_invitations:
                print(f"   - {inv.email} ({inv.invitation_type}) - Status: {inv.status}")
                print(f"     Created by: {inv.invited_by_id}")
                print(f"     Organization: {inv.organization_id}")
                print(f"     Created at: {inv.created_at}")

            # 7. Test with different user roles
            print("\n7. 👤 TESTING WITH DIFFERENT USER ROLES")

            # Check if there's a doctor user
            stmt = select(User).where(User.role == "doctor")
            result = await db.execute(stmt)
            doctor_user = result.scalar_one_or_none()

            if doctor_user:
                print(f"✅ Found doctor user: {doctor_user.id} ({doctor_user.email})")

                # Test listing as doctor
                try:
                    invitations, total_count = await service.list_invitations(
                        invited_by_id=doctor_user.id,
                        limit=50,
                        offset=0
                    )
                    print(f"📊 Doctor sees {len(invitations)} invitations (total: {total_count})")

                except Exception as e:
                    print(f"❌ Failed to list invitations as doctor: {e}")
            else:
                print("⚠️ No doctor user found in database")

            print("\n" + "=" * 50)
            print("🏁 DEBUG COMPLETE")

        except Exception as e:
            print(f"💥 Critical error: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(debug_invitation_issue())