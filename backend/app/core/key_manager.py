"""
Local Key Management System for Healthcare IVR Platform

Provides secure local key management with rotation capabilities,
backup procedures, and environment-based key storage without AWS KMS.
"""

import os
import json
import base64
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

logger = logging.getLogger(__name__)


class KeyRotationError(Exception):
    """Exception raised during key rotation operations."""
    pass


class KeyBackupError(Exception):
    """Exception raised during key backup operations."""
    pass


class KeyValidationError(Exception):
    """Exception raised during key validation."""
    pass


class LocalKeyManager:
    """
    Local key management system for secure PHI encryption.

    Features:
    - Key generation and rotation
    - Zero-downtime key rotation with dual-key support
    - Encrypted key backup to filesystem
    - Key validation and integrity checking
    - Environment-based key storage
    - Key derivation for different data classification levels
    """

    def __init__(self, backup_dir: Optional[str] = None):
        """
        Initialize the local key manager.

        Args:
            backup_dir: Directory for key backups (default: ./key_backups)
        """
        self.backup_dir = Path(backup_dir or "./key_backups")
        self.backup_dir.mkdir(exist_ok=True, mode=0o700)

        # Key storage
        self._current_key: Optional[bytes] = None
        self._previous_key: Optional[bytes] = None
        self._key_version: int = 1
        self._key_created_at: Optional[datetime] = None

        # Load keys from environment
        self._load_keys_from_environment()

        logger.info("LocalKeyManager initialized")

    def _load_keys_from_environment(self) -> None:
        """Load encryption keys from environment variables."""
        try:
            # Primary encryption key
            current_key_b64 = os.getenv("ENCRYPTION_KEY")
            if current_key_b64:
                self._current_key = base64.urlsafe_b64decode(current_key_b64)
                logger.info("Loaded current encryption key from environment")

            # Previous key for rotation support
            previous_key_b64 = os.getenv("ENCRYPTION_KEY_PREVIOUS")
            if previous_key_b64:
                self._previous_key = base64.urlsafe_b64decode(previous_key_b64)
                logger.info("Loaded previous encryption key from environment")

            # Key version
            key_version = os.getenv("ENCRYPTION_KEY_VERSION", "1")
            self._key_version = int(key_version)

            # If no keys exist, generate initial key
            if not self._current_key:
                logger.warning(
                    "No encryption key found in environment, generating new key"
                )
                self._current_key = self.generate_key()
                self._key_created_at = datetime.utcnow()

        except Exception as e:
            logger.error(f"Error loading keys from environment: {e}")
            raise KeyValidationError(f"Failed to load keys: {e}")

    def generate_key(self) -> bytes:
        """
        Generate a new Fernet encryption key.

        Returns:
            bytes: New encryption key
        """
        key = Fernet.generate_key()
        logger.info("Generated new encryption key")
        return key

    def derive_key(self, purpose: str, salt: Optional[bytes] = None) -> bytes:
        """
        Derive a key for specific purposes using PBKDF2.

        Args:
            purpose: Purpose identifier (e.g., 'phi', 'pii', 'audit')
            salt: Optional salt (generated if not provided)

        Returns:
            bytes: Derived key for the specific purpose
        """
        if not self._current_key:
            raise KeyValidationError("No current key available for derivation")

        if salt is None:
            # Use purpose as part of salt generation for consistency
            salt = hashlib.sha256(purpose.encode()).digest()[:16]

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        derived_key = base64.urlsafe_b64encode(kdf.derive(self._current_key))
        logger.info(f"Derived key for purpose: {purpose}")
        return derived_key

    def get_current_key(self) -> bytes:
        """
        Get the current encryption key.

        Returns:
            bytes: Current encryption key

        Raises:
            KeyValidationError: If no current key is available
        """
        if not self._current_key:
            raise KeyValidationError("No current encryption key available")
        return self._current_key

    def get_previous_key(self) -> Optional[bytes]:
        """
        Get the previous encryption key (for rotation support).

        Returns:
            Optional[bytes]: Previous encryption key or None
        """
        return self._previous_key

    def get_key_version(self) -> int:
        """
        Get the current key version.

        Returns:
            int: Current key version
        """
        return self._key_version

    def validate_key(self, key: bytes) -> bool:
        """
        Validate that a key is a valid Fernet key.

        Args:
            key: Key to validate

        Returns:
            bool: True if key is valid
        """
        try:
            Fernet(key)
            return True
        except Exception:
            return False

    def rotate_key(self) -> Tuple[bytes, bytes]:
        """
        Rotate the encryption key with zero-downtime support.

        The old key is kept as the previous key to allow decryption
        of existing data during the transition period.

        Returns:
            Tuple[bytes, bytes]: (new_key, old_key)

        Raises:
            KeyRotationError: If rotation fails
        """
        try:
            logger.info("Starting key rotation")

            # Generate new key
            new_key = self.generate_key()

            # Validate new key
            if not self.validate_key(new_key):
                raise KeyRotationError("Generated key failed validation")

            # Store current key as previous
            old_key = self._current_key
            self._previous_key = old_key

            # Set new key as current
            self._current_key = new_key
            self._key_version += 1
            self._key_created_at = datetime.utcnow()

            # Backup the rotation
            self._backup_rotation(new_key, old_key)

            logger.info(f"Key rotation completed. New version: {self._key_version}")
            return new_key, old_key

        except Exception as e:
            logger.error(f"Key rotation failed: {e}")
            raise KeyRotationError(f"Failed to rotate key: {e}")

    def backup_keys(self, backup_name: Optional[str] = None) -> str:
        """
        Create an encrypted backup of current keys.

        Args:
            backup_name: Optional backup name (timestamp used if not provided)

        Returns:
            str: Path to backup file

        Raises:
            KeyBackupError: If backup fails
        """
        try:
            if backup_name is None:
                backup_name = f"key_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

            backup_path = self.backup_dir / f"{backup_name}.json"

            # Create backup data
            backup_data = {
                "version": self._key_version,
                "created_at": datetime.utcnow().isoformat(),
                "current_key": base64.urlsafe_b64encode(self._current_key).decode() if self._current_key else None,
                "previous_key": base64.urlsafe_b64encode(self._previous_key).decode() if self._previous_key else None,
                "key_created_at": self._key_created_at.isoformat() if self._key_created_at else None,
            }

            # Encrypt backup data using a backup-specific key
            backup_key = self.derive_key("backup")
            fernet = Fernet(backup_key)
            encrypted_data = fernet.encrypt(json.dumps(backup_data).encode())

            # Write encrypted backup
            with open(backup_path, 'wb') as f:
                f.write(encrypted_data)

            # Set secure permissions
            backup_path.chmod(0o600)

            logger.info(f"Key backup created: {backup_path}")
            return str(backup_path)

        except Exception as e:
            logger.error(f"Key backup failed: {e}")
            raise KeyBackupError(f"Failed to backup keys: {e}")

    def restore_keys(self, backup_path: str) -> None:
        """
        Restore keys from an encrypted backup.

        Args:
            backup_path: Path to backup file

        Raises:
            KeyBackupError: If restore fails
        """
        try:
            backup_file = Path(backup_path)
            if not backup_file.exists():
                raise KeyBackupError(f"Backup file not found: {backup_path}")

            # Read encrypted backup
            with open(backup_file, 'rb') as f:
                encrypted_data = f.read()

            # Decrypt backup data
            backup_key = self.derive_key("backup")
            fernet = Fernet(backup_key)
            decrypted_data = fernet.decrypt(encrypted_data)
            backup_data = json.loads(decrypted_data.decode())

            # Restore keys
            if backup_data.get("current_key"):
                self._current_key = base64.urlsafe_b64decode(backup_data["current_key"])

            if backup_data.get("previous_key"):
                self._previous_key = base64.urlsafe_b64decode(backup_data["previous_key"])

            self._key_version = backup_data.get("version", 1)

            if backup_data.get("key_created_at"):
                self._key_created_at = datetime.fromisoformat(backup_data["key_created_at"])

            logger.info(f"Keys restored from backup: {backup_path}")

        except Exception as e:
            logger.error(f"Key restore failed: {e}")
            raise KeyBackupError(f"Failed to restore keys: {e}")

    def _backup_rotation(self, new_key: bytes, old_key: Optional[bytes]) -> None:
        """
        Create automatic backup during key rotation.

        Args:
            new_key: New encryption key
            old_key: Previous encryption key
        """
        try:
            backup_name = f"rotation_backup_v{self._key_version}"
            self.backup_keys(backup_name)
            logger.info(f"Rotation backup created: {backup_name}")
        except Exception as e:
            logger.warning(f"Failed to create rotation backup: {e}")

    def list_backups(self) -> List[Dict[str, str]]:
        """
        List available key backups.

        Returns:
            List[Dict[str, str]]: List of backup information
        """
        backups = []
        for backup_file in self.backup_dir.glob("*.json"):
            stat = backup_file.stat()
            backups.append({
                "name": backup_file.stem,
                "path": str(backup_file),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "size": stat.st_size
            })

        return sorted(backups, key=lambda x: x["created"], reverse=True)

    def cleanup_old_backups(self, keep_count: int = 10) -> int:
        """
        Clean up old backup files, keeping only the most recent ones.

        Args:
            keep_count: Number of backups to keep

        Returns:
            int: Number of backups deleted
        """
        backups = self.list_backups()
        deleted_count = 0

        if len(backups) > keep_count:
            for backup in backups[keep_count:]:
                try:
                    Path(backup["path"]).unlink()
                    deleted_count += 1
                    logger.info(f"Deleted old backup: {backup['name']}")
                except Exception as e:
                    logger.warning(f"Failed to delete backup {backup['name']}: {e}")

        return deleted_count

    def get_key_info(self) -> Dict[str, any]:
        """
        Get information about current keys.

        Returns:
            Dict[str, any]: Key information
        """
        return {
            "version": self._key_version,
            "has_current_key": self._current_key is not None,
            "has_previous_key": self._previous_key is not None,
            "key_created_at": self._key_created_at.isoformat() if self._key_created_at else None,
            "backup_dir": str(self.backup_dir),
            "backup_count": len(list(self.backup_dir.glob("*.json")))
        }


# Global key manager instance
_key_manager: Optional[LocalKeyManager] = None


def get_key_manager() -> LocalKeyManager:
    """
    Get the global key manager instance.

    Returns:
        LocalKeyManager: Global key manager instance
    """
    global _key_manager
    if _key_manager is None:
        _key_manager = LocalKeyManager()
    return _key_manager


def initialize_key_manager(backup_dir: Optional[str] = None) -> LocalKeyManager:
    """
    Initialize the global key manager with custom settings.

    Args:
        backup_dir: Custom backup directory

    Returns:
        LocalKeyManager: Initialized key manager
    """
    global _key_manager
    _key_manager = LocalKeyManager(backup_dir)
    return _key_manager