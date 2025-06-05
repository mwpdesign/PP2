#!/usr/bin/env python3
"""
Test script for Local Key Management System
Validates key generation, rotation, backup, and integration with encryption service
"""

import sys
import os
import base64
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent / "backend"))

try:
    from app.core.key_manager import LocalKeyManager, get_key_manager
    from cryptography.fernet import Fernet
    print("✅ Successfully imported key management modules")
except ImportError as e:
    print(f"❌ Failed to import modules: {e}")
    sys.exit(1)


def test_key_generation():
    """Test key generation functionality."""
    print("\n🔑 Testing Key Generation...")

    try:
        km = LocalKeyManager()

        # Test key generation
        key = km.generate_key()
        print(f"✅ Generated key: {len(key)} bytes")

        # Test key validation
        is_valid = km.validate_key(key)
        print(f"✅ Key validation: {is_valid}")

        # Test Fernet compatibility
        fernet = Fernet(key)
        test_data = b"test encryption data"
        encrypted = fernet.encrypt(test_data)
        decrypted = fernet.decrypt(encrypted)

        assert decrypted == test_data
        print("✅ Key works with Fernet encryption")

        return True

    except Exception as e:
        print(f"❌ Key generation test failed: {e}")
        return False


def test_key_derivation():
    """Test key derivation for different purposes."""
    print("\n🔐 Testing Key Derivation...")

    try:
        km = LocalKeyManager()

        # Test different purpose keys
        purposes = ["phi", "pii", "audit", "backup"]
        derived_keys = {}

        for purpose in purposes:
            derived_key = km.derive_key(purpose)
            derived_keys[purpose] = derived_key
            print(f"✅ Derived {purpose} key: {len(derived_key)} bytes")

        # Verify keys are different
        unique_keys = set(derived_keys.values())
        assert len(unique_keys) == len(purposes)
        print("✅ All derived keys are unique")

        # Test consistency (same purpose = same key)
        phi_key_2 = km.derive_key("phi")
        assert derived_keys["phi"] == phi_key_2
        print("✅ Key derivation is consistent")

        return True

    except Exception as e:
        print(f"❌ Key derivation test failed: {e}")
        return False


def test_key_rotation():
    """Test zero-downtime key rotation."""
    print("\n🔄 Testing Key Rotation...")

    try:
        km = LocalKeyManager()

        # Get initial state
        initial_version = km.get_key_version()
        initial_key = km.get_current_key()

        print(f"Initial version: {initial_version}")

        # Perform rotation
        new_key, old_key = km.rotate_key()

        # Verify rotation
        assert km.get_key_version() == initial_version + 1
        assert km.get_current_key() == new_key
        assert km.get_previous_key() == old_key
        assert old_key == initial_key

        print(f"✅ Rotation successful: v{initial_version} → v{km.get_key_version()}")
        print("✅ Previous key preserved for backward compatibility")

        return True

    except Exception as e:
        print(f"❌ Key rotation test failed: {e}")
        return False


def test_backup_restore():
    """Test key backup and restore functionality."""
    print("\n💾 Testing Backup & Restore...")

    try:
        km = LocalKeyManager()

        # Create backup
        backup_path = km.backup_keys("test_backup")
        print(f"✅ Backup created: {backup_path}")

        # Verify backup file exists
        assert Path(backup_path).exists()
        print("✅ Backup file exists")

        # Store current state
        original_version = km.get_key_version()
        original_key = km.get_current_key()

        # Rotate key to change state
        km.rotate_key()
        rotated_version = km.get_key_version()

        print(f"State changed: v{original_version} → v{rotated_version}")

        # Restore from backup
        km.restore_keys(backup_path)

        # Verify restoration
        assert km.get_key_version() == original_version
        assert km.get_current_key() == original_key

        print("✅ Backup restoration successful")

        # List backups
        backups = km.list_backups()
        print(f"✅ Found {len(backups)} backup(s)")

        return True

    except Exception as e:
        print(f"❌ Backup/restore test failed: {e}")
        return False


def test_encryption_integration():
    """Test integration with encryption service."""
    print("\n🔗 Testing Encryption Service Integration...")

    try:
        km = LocalKeyManager()

        # Get key for encryption service
        encryption_key = km.get_current_key()

        # Test encryption/decryption
        fernet = Fernet(encryption_key)

        test_data = "Sensitive PHI data: Patient John Doe, DOB: 1980-01-01"
        encrypted_data = fernet.encrypt(test_data.encode())
        decrypted_data = fernet.decrypt(encrypted_data).decode()

        assert decrypted_data == test_data
        print("✅ Encryption service integration works")

        # Test with derived PHI key
        phi_key = km.derive_key("phi")
        phi_fernet = Fernet(phi_key)

        phi_encrypted = phi_fernet.encrypt(test_data.encode())
        phi_decrypted = phi_fernet.decrypt(phi_encrypted).decode()

        assert phi_decrypted == test_data
        print("✅ PHI-specific key encryption works")

        return True

    except Exception as e:
        print(f"❌ Encryption integration test failed: {e}")
        return False


def test_environment_integration():
    """Test environment variable integration."""
    print("\n🌍 Testing Environment Integration...")

    try:
        # Generate test key
        test_key = Fernet.generate_key()
        test_key_b64 = base64.urlsafe_b64encode(test_key).decode()

        # Set environment variable
        os.environ["ENCRYPTION_KEY"] = test_key_b64
        os.environ["ENCRYPTION_KEY_VERSION"] = "5"

        # Create new key manager to load from environment
        km = LocalKeyManager()

        # Verify environment loading
        loaded_key = km.get_current_key()
        assert loaded_key == test_key
        assert km.get_key_version() == 5

        print("✅ Environment variable loading works")

        # Clean up
        del os.environ["ENCRYPTION_KEY"]
        del os.environ["ENCRYPTION_KEY_VERSION"]

        return True

    except Exception as e:
        print(f"❌ Environment integration test failed: {e}")
        return False


def test_global_instance():
    """Test global key manager instance."""
    print("\n🌐 Testing Global Instance...")

    try:
        # Get global instance
        km1 = get_key_manager()
        km2 = get_key_manager()

        # Verify singleton behavior
        assert km1 is km2
        print("✅ Global instance is singleton")

        # Test functionality
        info = km1.get_key_info()
        assert "version" in info
        assert "has_current_key" in info

        print("✅ Global instance functionality works")

        return True

    except Exception as e:
        print(f"❌ Global instance test failed: {e}")
        return False


def main():
    """Run all key management tests."""
    print("🚀 Healthcare IVR Platform - Key Management System Tests")
    print("=" * 60)

    tests = [
        test_key_generation,
        test_key_derivation,
        test_key_rotation,
        test_backup_restore,
        test_encryption_integration,
        test_environment_integration,
        test_global_instance,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed} passed, {failed} failed")

    if failed == 0:
        print("🎉 All tests passed! Key management system is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())