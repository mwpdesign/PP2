#!/usr/bin/env python3
"""
Debug invitation creation step by step
Task ID: mbxm2qjdhvvt49x34k9
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
from app.models.rbac import Role
from app.models.organization import Organization
from app.services.invitation_service import InvitationService


async def debug_invitation_step_by_step():
    """Debug invitation creation step by step."""
    print("🔍 DEBUGGING INVITATION CREATION STEP BY STEP")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        try:
            # 1. Check admin user
            print("\n1. 🔑 CHECKING ADMIN USER")
            stmt = select(User).where(User.email == "admin@healthcare.local")
            result = await db.execute(stmt)
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                print("❌ Admin user not found")
                return

            print(f"✅ Found admin user: {admin_user.id}")
            print(f"   Email: {admin_user.email}")
            print(f"   Organization ID: {admin_user.organization_id}")

            # 2. Check doctor role exists
            print("\n2. 👤 CHECKING DOCTOR ROLE")
            stmt = select(Role).where(Role.name == "doctor")
            result = await db.execute(stmt)
            doctor_role = result.scalar_one_or_none()

            if not doctor_role:
                print("❌ Doctor role not found")
                return

            print(f"✅ Found doctor role: {doctor_role.id}")
            print(f"   Name: {doctor_role.name}")
            print(f"   Description: {doctor_role.description}")

            # 3. Check organization exists
            print("\n3. 🏢 CHECKING ORGANIZATION")
            if admin_user.organization_id:
                stmt = select(Organization).where(Organization.id == admin_user.organization_id)
                result = await db.execute(stmt)
                organization = result.scalar_one_or_none()

                if organization:
                    print(f"✅ Found organization: {organization.id}")
                    print(f"   Name: {organization.name}")
                else:
                    print("❌ Organization not found")
                    return
            else:
                print("⚠️ Admin user has no organization_id")

            # 4. Test invitation service initialization
            print("\n4. 🔧 TESTING INVITATION SERVICE")
            service = InvitationService(db)
            print("✅ InvitationService initialized")

            # 5. Test validation methods individually
            print("\n5. 🧪 TESTING VALIDATION METHODS")

            try:
                await service._validate_invitation_type("doctor")
                print("✅ _validate_invitation_type passed")
            except Exception as e:
                print(f"❌ _validate_invitation_type failed: {e}")
                return

            try:
                await service._validate_role("doctor")
                print("✅ _validate_role passed")
            except Exception as e:
                print(f"❌ _validate_role failed: {e}")
                return

            if admin_user.organization_id:
                try:
                    await service._validate_organization(admin_user.organization_id)
                    print("✅ _validate_organization passed")
                except Exception as e:
                    print(f"❌ _validate_organization failed: {e}")
                    return

            try:
                await service._validate_inviter_permissions(
                    admin_user.id, "doctor", admin_user.organization_id
                )
                print("✅ _validate_inviter_permissions passed")
            except Exception as e:
                print(f"❌ _validate_inviter_permissions failed: {e}")
                return

            # 6. Test UserInvitation.create_invitation
            print("\n6. 🆕 TESTING UserInvitation.create_invitation")
            try:
                invitation = UserInvitation.create_invitation(
                    email="test.doctor@example.com",
                    invitation_type="doctor",
                    role_name="doctor",
                    invited_by_id=admin_user.id,
                    organization_id=admin_user.organization_id,
                    first_name="Test",
                    last_name="Doctor",
                    invitation_message="Welcome!",
                    expires_in_days=7
                )
                print("✅ UserInvitation.create_invitation passed")
                print(f"   ID: {invitation.id}")
                print(f"   Email: {invitation.email}")
                print(f"   Status: {invitation.status}")
            except Exception as e:
                print(f"❌ UserInvitation.create_invitation failed: {e}")
                import traceback
                traceback.print_exc()
                return

            # 7. Test database save
            print("\n7. 💾 TESTING DATABASE SAVE")
            try:
                db.add(invitation)
                await db.commit()
                await db.refresh(invitation)
                print("✅ Database save passed")
                print(f"   Saved invitation ID: {invitation.id}")
            except Exception as e:
                print(f"❌ Database save failed: {e}")
                import traceback
                traceback.print_exc()
                await db.rollback()
                return

            # 8. Verify invitation was saved
            print("\n8. ✅ VERIFYING INVITATION WAS SAVED")
            stmt = select(UserInvitation).where(UserInvitation.id == invitation.id)
            result = await db.execute(stmt)
            saved_invitation = result.scalar_one_or_none()

            if saved_invitation:
                print("✅ Invitation successfully saved to database")
                print(f"   ID: {saved_invitation.id}")
                print(f"   Email: {saved_invitation.email}")
                print(f"   Status: {saved_invitation.status}")
                print(f"   Created at: {saved_invitation.created_at}")
            else:
                print("❌ Invitation not found in database after save")

            print("\n" + "=" * 60)
            print("🎉 ALL STEPS PASSED - INVITATION CREATION WORKS!")

        except Exception as e:
            print(f"💥 Critical error: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(debug_invitation_step_by_step())