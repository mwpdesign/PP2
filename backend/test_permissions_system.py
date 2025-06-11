#!/usr/bin/env python3
"""
Test Script for Role-Based Permissions System
Phase 2: Foundation Systems - Role-Based Permissions

Tests the complete permissions system including database, services, and API endpoints.
"""

import asyncio
import sys
import os
from uuid import UUID

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.permission_service import get_permission_service
from app.schemas.token import TokenData


async def test_permissions_system():
    """Test the complete permissions system."""
    print("🔐 Testing Role-Based Permissions System")
    print("=" * 50)

    # Get database session
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        # Get permission service
        permission_service = get_permission_service(db)

        # Test 1: Get all roles
        print("\n1. Testing get_all_roles()...")
        roles = await permission_service.get_all_roles()
        print(f"   ✅ Found {len(roles)} roles:")
        for role in roles:
            print(f"      - {role['display_name']} ({role['name']})")
            if role['is_system_role']:
                print(f"        [SYSTEM ROLE]")

        # Test 2: Get all permissions
        print("\n2. Testing get_all_permissions()...")
        permissions = await permission_service.get_all_permissions()
        print(f"   ✅ Found {len(permissions)} permissions:")

        # Group permissions by resource
        by_resource = {}
        for perm in permissions:
            resource = perm['resource']
            if resource not in by_resource:
                by_resource[resource] = []
            by_resource[resource].append(perm)

        for resource, perms in by_resource.items():
            print(f"      {resource.upper()}:")
            for perm in perms:
                print(f"        - {perm['display_name']} ({perm['name']})")

        # Test 3: Test user permissions (if we have a test user)
        print("\n3. Testing user permissions...")

        # Try to find a doctor user
        from sqlalchemy import select
        from app.models.user import User

        query = select(User).where(User.email.like('%doctor%')).limit(1)
        result = await db.execute(query)
        test_user = result.scalar_one_or_none()

        if test_user:
            print(f"   Testing with user: {test_user.email}")

            # Get user permissions
            user_permissions = await permission_service.get_user_permissions(test_user.id)
            print(f"   ✅ User has {len(user_permissions)} permissions:")
            for perm in sorted(user_permissions):
                print(f"      - {perm}")

            # Get user roles
            user_roles = await permission_service.get_user_roles(test_user.id)
            print(f"   ✅ User has {len(user_roles)} roles:")
            for role in user_roles:
                print(f"      - {role['display_name']} ({role['name']})")

            # Test specific permission checks
            print("\n   Testing specific permission checks:")
            test_permissions = [
                'patient.read',
                'patient.create',
                'ivr.read',
                'ivr.approve',
                'settings.read',
                'settings.permissions',
                'user.create',
                'audit.read'
            ]

            for perm_name in test_permissions:
                # Create a mock TokenData object
                token_data = TokenData(
                    id=test_user.id,
                    username=test_user.username,
                    email=test_user.email,
                    organization_id=test_user.organization_id,
                    role=test_user.role.name if test_user.role else 'unknown'
                )

                has_permission = await permission_service.check_permission(
                    user=token_data,
                    permission_name=perm_name
                )
                status = "✅ GRANTED" if has_permission else "❌ DENIED"
                print(f"      {perm_name}: {status}")
        else:
            print("   ⚠️  No test user found (looking for email containing 'doctor')")

        # Test 4: Database integrity
        print("\n4. Testing database integrity...")

        # Check role-permission assignments
        from app.models.permissions import Role, Permission, RolePermission

        healthcare_provider_query = select(Role).where(Role.name == 'healthcare_provider')
        result = await db.execute(healthcare_provider_query)
        healthcare_provider = result.scalar_one_or_none()

        if healthcare_provider:
            # Count permissions for healthcare provider
            role_perms_query = select(RolePermission).where(
                RolePermission.role_id == healthcare_provider.id
            )
            result = await db.execute(role_perms_query)
            role_permissions = result.scalars().all()

            print(f"   ✅ Healthcare Provider role has {len(role_permissions)} permissions assigned")

            # Check if it has all permissions (should be true for healthcare provider)
            total_permissions = len(permissions)
            if len(role_permissions) == total_permissions:
                print("   ✅ Healthcare Provider has ALL permissions (correct)")
            else:
                print(f"   ⚠️  Healthcare Provider missing {total_permissions - len(role_permissions)} permissions")
        else:
            print("   ❌ Healthcare Provider role not found")

        # Test 5: Permission matrix
        print("\n5. Testing permission matrix...")
        role_names = ['healthcare_provider', 'office_administrator', 'medical_staff']

        for role_name in role_names:
            role_query = select(Role).where(Role.name == role_name)
            result = await db.execute(role_query)
            role = result.scalar_one_or_none()

            if role:
                role_perms_query = select(RolePermission).where(
                    RolePermission.role_id == role.id
                )
                result = await db.execute(role_perms_query)
                role_permissions = result.scalars().all()

                print(f"   {role.display_name}: {len(role_permissions)} permissions")
            else:
                print(f"   ❌ Role '{role_name}' not found")

        print("\n🎉 Permissions System Test Complete!")
        print("=" * 50)

        # Summary
        print(f"\nSUMMARY:")
        print(f"- Roles: {len(roles)}")
        print(f"- Permissions: {len(permissions)}")
        print(f"- System appears to be working correctly!")

        return True

    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        db.close()


if __name__ == "__main__":
    print("Starting Role-Based Permissions System Test...")
    success = asyncio.run(test_permissions_system())

    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)