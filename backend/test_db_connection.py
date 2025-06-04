#!/usr/bin/env python3
"""Test database connectivity for local development environment."""

import asyncio
import sys
import os
from sqlalchemy import text

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

async def test_database_connection():
    """Test database connection and basic operations."""
    try:
        print("🔍 Testing database connectivity...")
        
        # Import after path setup
        from app.core.database import engine, AsyncSessionLocal
        from app.core.config import settings
        
        print(f"📊 Database URL: {settings.DATABASE_URL}")
        print(f"🔐 Auth Mode: {settings.AUTH_MODE}")
        print(f"🚫 Cognito Disabled: {not settings.USE_COGNITO}")
        
        # Test basic connection
        print("\n1️⃣ Testing basic database connection...")
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ PostgreSQL Version: {version}")
        
        # Test session creation
        print("\n2️⃣ Testing session creation...")
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"✅ Connected to database: {db_name}")
        
        # Test table existence (if any)
        print("\n3️⃣ Checking existing tables...")
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            if tables:
                print(f"✅ Found {len(tables)} tables:")
                for table in tables[:10]:  # Show first 10 tables
                    print(f"   📋 {table[0]}")
                if len(tables) > 10:
                    print(f"   ... and {len(tables) - 10} more")
            else:
                print("ℹ️  No tables found (this is normal for a fresh database)")
        
        print("\n🎉 Database connectivity test successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Database connectivity test failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Ensure PostgreSQL Docker container is running")
        print("2. Check if the database 'healthcare_ivr' exists")
        print("3. Verify connection credentials (user: postgres, password: password)")
        print("4. Ensure port 5432 is accessible on localhost")
        return False

async def test_environment_variables():
    """Test environment variable configuration."""
    print("\n🔧 Environment Variable Check:")
    
    env_vars = [
        'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 
        'DB_USER', 'DB_PASSWORD', 'SECRET_KEY', 'AUTH_MODE'
    ]
    
    for var in env_vars:
        value = os.getenv(var, 'NOT SET')
        if var in ['SECRET_KEY', 'DB_PASSWORD'] and value != 'NOT SET':
            # Mask sensitive values
            masked_value = value[:4] + '*' * (len(value) - 4) if len(value) > 4 else '****'
            print(f"   {var}: {masked_value}")
        else:
            print(f"   {var}: {value}")

async def main():
    """Main test function."""
    print("🏥 Healthcare IVR Platform - Database Connectivity Test")
    print("=" * 60)
    
    await test_environment_variables()
    
    print("\n" + "=" * 60)
    success = await test_database_connection()
    
    if success:
        print("\n✅ All tests passed! Your local development environment is ready.")
        print("\n📝 Next steps:")
        print("1. Copy backend/local_dev_config.env to backend/.env")
        print("2. Run the admin user seeding script")
        print("3. Start your FastAPI backend server")
    else:
        print("\n❌ Tests failed. Please check your Docker PostgreSQL setup.")
    
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 