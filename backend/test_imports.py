#!/usr/bin/env python3
"""Test script to verify imports work correctly."""

import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

def test_imports():
    """Test that all critical imports work."""
    try:
        print("Testing imports...")
        
        # Test app imports
        from app.core.config import settings
        print(f"✅ Config imported. AUTH_MODE: {settings.AUTH_MODE}")
        
        from app.models.user import User
        print("✅ User model imported")
        
        from app.models.organization import Organization
        print("✅ Organization model imported")
        
        from app.models.rbac import Role
        print("✅ Role model imported")
        
        from app.core.database import AsyncSessionLocal
        print("✅ Database session imported")
        
        from app.core.security import authenticate_user, get_current_user
        print("✅ Security functions imported")
        
        print("\n🎉 All imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1) 