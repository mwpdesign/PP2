import asyncio
from sqlalchemy import text
from app.core.database import engine

async def test_simple_auth():
    async with engine.begin() as conn:
        # Generate new password hash
        import bcrypt
        password = b'demo123'
        salt = bcrypt.gensalt()
        new_hash = bcrypt.hashpw(password, salt)
        print(f"Generated new hash: {new_hash.decode('utf-8')}")

        # Update the user's password
        update_query = text(
            "UPDATE users SET encrypted_password = :new_hash "
            "WHERE email = 'admin@demo.com' RETURNING id, email, encrypted_password"
        )
        result = await conn.execute(update_query, {"new_hash": new_hash.decode('utf-8')})
        user = result.fetchone()
        
        if user:
            print(f"Updated user password hash: {user.encrypted_password}")
            # Verify the new password
            stored_pw = user.encrypted_password.encode('utf-8')
            password_correct = bcrypt.checkpw(password, stored_pw)
            print(f"Password verification after update: {password_correct}")

if __name__ == "__main__":
    asyncio.run(test_simple_auth()) 