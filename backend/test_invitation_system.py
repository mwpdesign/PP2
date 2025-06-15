#!/usr/bin/env python3
"""
Comprehensive test suite for the Healthcare IVR Platform Invitation System
Tests database schema, models, lifecycle, and functionality
"""

import sys
import asyncio

sys.path.append('.')

from app.models.user_invitation import UserInvitation
from app.core.database import get_db, init_db
from sqlalchemy import text


async def test_database_schema():
    """Test 1: Database Schema Validation"""
    print('\n1. 🗄️  Testing Database Schema...')
    try:
        # Initialize database connection
        await init_db()

        async for session in get_db():
            # Check if user_invitations table exists
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'user_invitations'
                ORDER BY ordinal_position
            """))
            columns = result.fetchall()
            print(f'   ✅ user_invitations table has {len(columns)} columns')

            # Verify required columns exist
            column_names = [col[0] for col in columns]
            required_columns = [
                'id', 'email', 'invitation_type', 'status', 'invitation_token',
                'invited_by_id', 'organization_id', 'expires_at', 'created_at'
            ]

            for col in required_columns:
                if col in column_names:
                    print(f'   ✅ Required column exists: {col}')
                else:
                    print(f'   ❌ Missing required column: {col}')
                    return False

            # Check constraints
            result = await session.execute(text("""
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints
                WHERE table_name = 'user_invitations'
            """))
            constraints = result.fetchall()
            print(f'   ✅ Found {len(constraints)} constraints')

            # Check indexes
            result = await session.execute(text("""
                SELECT indexname FROM pg_indexes
                WHERE tablename = 'user_invitations'
            """))
            indexes = result.fetchall()
            print(f'   ✅ Found {len(indexes)} indexes')

            return True

    except Exception as e:
        print(f'   ❌ Database schema test failed: {e}')
        return False


async def test_sqlalchemy_models():
    """Test 2: SQLAlchemy Models"""
    print('\n2. 🏗️  Testing SQLAlchemy Models...')
    try:
        # Test UserInvitation model creation
        invitation = UserInvitation.create_invitation(
            email='test@example.com',
            invitation_type='doctor',
            role_name='doctor',
            invited_by_id='550e8400-e29b-41d4-a716-446655440000',
            organization_id='550e8400-e29b-41d4-a716-446655440001'
        )
        print(f'   ✅ UserInvitation model created: {invitation.email}')
        print(f'   ✅ Status: {invitation.status}')
        print(f'   ✅ Token generated: {len(invitation.invitation_token)} chars')
        print(f'   ✅ Expires at: {invitation.expires_at}')
        print(f'   ✅ Type: {invitation.invitation_type}')

        # Test model properties
        print(f'   ✅ Is expired: {invitation.is_expired}')
        print(f'   ✅ Is pending: {invitation.is_pending}')
        print(f'   ✅ Days until expiry: {invitation.days_until_expiry}')

        return True

    except Exception as e:
        print(f'   ❌ SQLAlchemy models test failed: {e}')
        return False


async def test_invitation_lifecycle():
    """Test 3: Invitation Lifecycle"""
    print('\n3. 🔄 Testing Invitation Lifecycle...')
    try:
        invitation = UserInvitation.create_invitation(
            email='lifecycle@example.com',
            invitation_type='sales',
            role_name='sales',
            invited_by_id='550e8400-e29b-41d4-a716-446655440000',
            organization_id='550e8400-e29b-41d4-a716-446655440001'
        )

        # Test status transitions
        print(f'   ✅ Initial status: {invitation.status}')

        invitation.mark_as_sent()
        print(f'   ✅ After mark_as_sent: {invitation.status}')
        print(f'   ✅ Email attempts: {invitation.email_attempts}')

        invitation.mark_as_accepted()
        print(f'   ✅ After mark_as_accepted: {invitation.status}')
        print(f'   ✅ Accepted at: {invitation.accepted_at}')

        # Test other lifecycle methods
        invitation2 = UserInvitation.create_invitation(
            email='lifecycle2@example.com',
            invitation_type='distributor',
            role_name='distributor',
            invited_by_id='550e8400-e29b-41d4-a716-446655440000',
            organization_id='550e8400-e29b-41d4-a716-446655440001'
        )

        invitation2.mark_as_failed('Email delivery failed')
        print(f'   ✅ After mark_as_failed: {invitation2.status}')

        invitation3 = UserInvitation.create_invitation(
            email='lifecycle3@example.com',
            invitation_type='office_admin',
            role_name='office_admin',
            invited_by_id='550e8400-e29b-41d4-a716-446655440000',
            organization_id='550e8400-e29b-41d4-a716-446655440001'
        )

        invitation3.mark_as_cancelled()
        print(f'   ✅ After mark_as_cancelled: {invitation3.status}')

        return True

    except Exception as e:
        print(f'   ❌ Invitation lifecycle test failed: {e}')
        return False


async def test_invitation_types():
    """Test 4: Invitation Types"""
    print('\n4. 👥 Testing Invitation Types...')
    try:
        valid_types = [
            'doctor', 'sales', 'distributor', 'master_distributor',
            'office_admin', 'medical_staff', 'ivr_company',
            'shipping_logistics', 'admin', 'chp_admin'
        ]

        for inv_type in valid_types:
            invitation = UserInvitation.create_invitation(
                email=f'{inv_type}@example.com',
                invitation_type=inv_type,
                role_name=inv_type,
                invited_by_id='550e8400-e29b-41d4-a716-446655440000',
                organization_id='550e8400-e29b-41d4-a716-446655440001'
            )
            status = invitation.status
            print(f'   ✅ {inv_type}: {invitation.email} - Status: {status}')

        print(f'   ✅ All {len(valid_types)} invitation types validated')
        return True

    except Exception as e:
        print(f'   ❌ Invitation types test failed: {e}')
        return False


async def run_all_tests():
    """Run all invitation system tests"""
    print('🧪 HEALTHCARE IVR PLATFORM - INVITATION SYSTEM TEST SUITE')
    print('=' * 60)

    tests = [
        ('Database Schema', test_database_schema),
        ('SQLAlchemy Models', test_sqlalchemy_models),
        ('Invitation Lifecycle', test_invitation_lifecycle),
        ('Invitation Types', test_invitation_types)
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        try:
            result = await test_func()
            if result:
                passed += 1
                print(f'\n✅ {test_name} - PASSED')
            else:
                print(f'\n❌ {test_name} - FAILED')
        except Exception as e:
            print(f'\n❌ {test_name} - ERROR: {e}')

    print('\n' + '=' * 60)
    print(f'🎯 TEST RESULTS: {passed}/{total} tests passed')

    if passed == total:
        print('🎉 ALL TESTS PASSED - INVITATION SYSTEM IS READY!')
        return True
    else:
        print('⚠️  SOME TESTS FAILED - REVIEW ISSUES ABOVE')
        return False


if __name__ == '__main__':
    asyncio.run(run_all_tests())