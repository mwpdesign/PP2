#!/usr/bin/env python3
"""
Check organizations in database
"""

import asyncio
import sys
sys.path.append('.')
from app.core.database import get_db
from sqlalchemy import text

async def check_organizations():
    # Get database session using the dependency
    db_gen = get_db()
    db = await db_gen.__anext__()

    try:
        # Check available organizations
        result = await db.execute(text('SELECT id, name FROM organizations LIMIT 10'))
        orgs = result.fetchall()
        print('Available organizations:')
        for org in orgs:
            print(f'  ID: {org[0]}, Name: {org[1]}')

        # Check admin user's organization
        result = await db.execute(text("SELECT organization_id FROM users WHERE email = 'admin@healthcare.local'"))
        admin_org = result.fetchone()
        if admin_org:
            print(f'\nAdmin user organization_id: {admin_org[0]}')
        else:
            print('\nAdmin user not found')

        # Check roles
        result = await db.execute(text("SELECT id, name FROM roles WHERE name = 'doctor'"))
        doctor_role = result.fetchone()
        if doctor_role:
            print(f'Doctor role ID: {doctor_role[0]}')
        else:
            print('Doctor role not found')

    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check_organizations())