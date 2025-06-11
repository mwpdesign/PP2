#!/usr/bin/env python3
"""Check available users in the database."""

import asyncio
import asyncpg

async def check_users():
    """Check what users exist in the database."""
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='postgres',
        database='healthcare_ivr'
    )

    try:
        # Check table structure first
        cols = await conn.fetch(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'users' ORDER BY ordinal_position"
        )
        print('User table columns:')
        for col in cols:
            print(f'  {col[0]}')

        # Get sample users
        users = await conn.fetch('SELECT id, username, email FROM users LIMIT 5')
        print('\nSample users:')
        for user in users:
            print(f'  {user[0]} - {user[1]} ({user[2]})')
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_users())