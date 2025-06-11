#!/usr/bin/env python3
"""Run the IVR communication messages migration."""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run_migration():
    """Execute the migration to create IVR communication messages table."""
    # Read the migration file
    with open('migrations/add_ivr_communication_messages.sql', 'r') as f:
        migration_sql = f.read()

    # Connect to database
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='postgres',
        database='healthcare_ivr'
    )

    try:
        # Execute migration
        await conn.execute(migration_sql)
        print('✅ Migration executed successfully')

        # Verify table was created
        result = await conn.fetch('SELECT COUNT(*) FROM ivr_communication_messages')
        print(f'✅ Table created with {result[0][0]} sample messages')

    except Exception as e:
        print(f'❌ Migration failed: {e}')
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migration())