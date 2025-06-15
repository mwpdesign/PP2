#!/usr/bin/env python3
"""
Simple test script for invitation database check
Task ID: mbxm2qjdhvvt49x34k9
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine


async def test_invitation_database():
    """Test invitation database directly."""
    print("🔍 TESTING INVITATION DATABASE")
    print("=" * 50)

    try:
        async with engine.connect() as conn:
            # 1. Check total invitations
            print("\n1. 📊 CHECKING TOTAL INVITATIONS")
            result = await conn.execute(text("SELECT COUNT(*) FROM user_invitations"))
            total_count = result.scalar()
            print(f"📈 Total invitations in database: {total_count}")

            # 2. Check invitation details
            print("\n2. 📋 CHECKING INVITATION DETAILS")
            result = await conn.execute(text("""
                SELECT
                    id, email, invitation_type, status,
                    invited_by_id, organization_id, created_at
                FROM user_invitations
                ORDER BY created_at DESC
                LIMIT 10
            """))

            invitations = result.fetchall()
            print(f"📋 Found {len(invitations)} recent invitations:")

            for inv in invitations:
                print(f"   - {inv.email} ({inv.invitation_type}) - Status: {inv.status}")
                print(f"     Created by: {inv.invited_by_id}")
                print(f"     Organization: {inv.organization_id}")
                print(f"     Created at: {inv.created_at}")
                print()

            # 3. Check users who created invitations
            print("\n3. 👤 CHECKING INVITATION CREATORS")
            result = await conn.execute(text("""
                SELECT DISTINCT
                    u.id, u.email, u.role, u.organization_id,
                    COUNT(ui.id) as invitation_count
                FROM users u
                LEFT JOIN user_invitations ui ON u.id = ui.invited_by_id
                GROUP BY u.id, u.email, u.role, u.organization_id
                HAVING COUNT(ui.id) > 0
                ORDER BY invitation_count DESC
            """))

            creators = result.fetchall()
            print(f"👥 Found {len(creators)} users who created invitations:")

            for creator in creators:
                print(f"   - {creator.email} ({creator.role}) - {creator.invitation_count} invitations")
                print(f"     User ID: {creator.id}")
                print(f"     Organization: {creator.organization_id}")
                print()

            # 4. Check current admin user
            print("\n4. 🔑 CHECKING ADMIN USER")
            result = await conn.execute(text("""
                SELECT id, email, role, organization_id
                FROM users
                WHERE email = 'admin@healthcare.local'
            """))

            admin_user = result.fetchone()
            if admin_user:
                print(f"✅ Found admin user: {admin_user.id} ({admin_user.email})")
                print(f"   Role: {admin_user.role}")
                print(f"   Organization ID: {admin_user.organization_id}")

                # Check invitations created by this admin
                result = await conn.execute(text("""
                    SELECT COUNT(*)
                    FROM user_invitations
                    WHERE invited_by_id = :user_id
                """), {"user_id": admin_user.id})

                admin_invitation_count = result.scalar()
                print(f"   Invitations created: {admin_invitation_count}")
            else:
                print("❌ Admin user not found")

            # 5. Test invitation filtering by invited_by_id
            print("\n5. 🔍 TESTING INVITATION FILTERING")
            if admin_user:
                result = await conn.execute(text("""
                    SELECT id, email, invitation_type, status
                    FROM user_invitations
                    WHERE invited_by_id = :user_id
                    ORDER BY created_at DESC
                """), {"user_id": admin_user.id})

                admin_invitations = result.fetchall()
                print(f"📊 Admin user sees {len(admin_invitations)} invitations:")

                for inv in admin_invitations:
                    print(f"   - {inv.email} ({inv.invitation_type}) - Status: {inv.status}")

            print("\n" + "=" * 50)
            print("🏁 DATABASE TEST COMPLETE")

    except Exception as e:
        print(f"💥 Database error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_invitation_database())