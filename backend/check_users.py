import asyncio
import sys
import os
sys.path.append('.')
from app.core.database import async_session_factory
from app.models.user import User
from sqlalchemy import select

async def check_users():
    async with async_session_factory() as session:
        query = select(User).order_by(User.email)
        result = await session.execute(query)
        users = result.scalars().all()
        print(f'Found {len(users)} users in database:')
        for user in users:
            print(f'  - {user.email} ({user.username}) - Role ID: {user.role_id}')

if __name__ == "__main__":
    asyncio.run(check_users())