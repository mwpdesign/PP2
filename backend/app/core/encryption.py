"""
Core encryption module providing encryption utilities and configuration.
Handles encryption key management and rotation policies.
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException
import base64
import os
import boto3
from botocore.exceptions import ClientError
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import get_settings, settings


class EncryptionConfig:
    """Configuration for encryption services."""

    def __init__(self):
        """Initialize encryption configuration."""
        self.settings = get_settings()

        # KMS key configuration
        self.key_rotation_period = timedelta(days=90)  # HIPAA best practice
        self.key_alias_prefix = 'alias/healthcare-ivr'

        # Encryption contexts
        self.resource_types = {
            'patient': 'PHI',
            'order': 'PHI',
            'insurance': 'PHI',
            'document': 'PHI',
            'audit': 'AUDIT'
        }

        # Access logging configuration
        self.log_decryption_access = True
        self.log_retention_days = 365  # HIPAA requires 6 years

        # Performance optimization
        self.key_cache_ttl = timedelta(minutes=30)
        self.max_batch_size = 100

    def get_encryption_context(
        self,
        resource_type: str,
        resource_id: str,
        user_id: Optional[str] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict:
        """
        Create a standardized encryption context.
        Includes resource type, ID, and data classification.
        """
        if resource_type not in self.resource_types:
            raise ValueError(f"Invalid resource type: {resource_type}")

        context = {
            'resource_type': resource_type,
            'resource_id': resource_id,
            'data_classification': self.resource_types[resource_type],
            'environment': self.settings.environment,
            'application': 'healthcare-ivr-platform',
            'encryption_version': '1.0'
        }

        if user_id:
            context['user_id'] = user_id

        if additional_context:
            context.update(additional_context)

        return context

    def get_key_alias(self, resource_type: str) -> str:
        """Get the KMS key alias for a resource type."""
        if resource_type not in self.resource_types:
            raise ValueError(f"Invalid resource type: {resource_type}")

        return f"{self.key_alias_prefix}-{resource_type}"

    def should_rotate_key(self, key_creation_date: datetime) -> bool:
        """Check if a key should be rotated based on age."""
        age = datetime.utcnow() - key_creation_date
        return age >= self.key_rotation_period

    def validate_encryption_context(
        self,
        context: Dict,
        required_fields: Optional[list] = None
    ) -> bool:
        """
        Validate encryption context has required fields.
        Returns True if valid, raises exception if invalid.
        """
        required = required_fields or [
            'resource_type',
            'resource_id',
            'data_classification'
        ]

        try:
            for field in required:
                if field not in context:
                    raise ValueError(
                        f"Missing required field in context: {field}"
                    )

            if (
                'resource_type' in context and
                context['resource_type'] not in self.resource_types
            ):
                raise ValueError(
                    f"Invalid resource type: {context['resource_type']}"
                )

            return True
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid encryption context: {str(e)}"
            )


# Global encryption configuration instance
encryption_config = EncryptionConfig()


def get_encryption_config() -> EncryptionConfig:
    """Dependency injection for encryption configuration."""
    return encryption_config


class FieldLevelEncryption:
    """Handles field-level encryption using AWS KMS and Fernet."""

    def __init__(self):
        """Initialize encryption with AWS KMS."""
        self.kms = boto3.client('kms')
        self._data_key = None
        self._fernet = None

    @property
    def data_key(self) -> bytes:
        """Get or generate data key for encryption."""
        if not self._data_key:
            self._data_key = self._get_data_key()
        return self._data_key

    @property
    def fernet(self) -> Fernet:
        """Get Fernet instance for encryption/decryption."""
        if not self._fernet:
            self._fernet = self._create_fernet()
        return self._fernet

    def _get_data_key(self) -> bytes:
        """Get data key from AWS KMS."""
        try:
            response = self.kms.generate_data_key(
                KeyId=settings.AWS_KMS_KEY_ID,
                KeySpec='AES_256'
            )
            # Store encrypted version for later decryption
            self._encrypted_key = response['CiphertextBlob']
            # Use plaintext version for current operations
            return response['Plaintext']
        except ClientError as e:
            # Fall back to local key if KMS is not available
            if settings.ENABLE_LOCAL_ENCRYPTION:
                return self._generate_local_key()
            raise EncryptionError(
                "Failed to generate data key and local encryption "
                f"is disabled: {str(e)}"
            )

    def _create_fernet(self) -> Fernet:
        """Create Fernet instance from data key."""
        # Use PBKDF2 to derive a key from our data key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=settings.ENCRYPTION_SALT.encode(),
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.data_key))
        return Fernet(key)

    def _generate_local_key(self) -> bytes:
        """Generate a local key for development/testing."""
        if not settings.ENABLE_LOCAL_ENCRYPTION:
            raise EncryptionError(
                "Local encryption is disabled but KMS is not available"
            )
        return base64.urlsafe_b64encode(os.urandom(32))

    def encrypt(self, data: str) -> Optional[str]:
        """Encrypt data using Fernet."""
        if not data:
            return None
        try:
            encrypted = self.fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            raise EncryptionError(f"Failed to encrypt data: {str(e)}")

    def decrypt(self, encrypted_data: str) -> Optional[str]:
        """Decrypt data using Fernet."""
        if not encrypted_data:
            return None
        try:
            decrypted = self.fernet.decrypt(
                base64.urlsafe_b64decode(encrypted_data.encode())
            )
            return decrypted.decode()
        except Exception as e:
            raise EncryptionError(f"Failed to decrypt data: {str(e)}")

    def rotate_key(self):
        """Rotate encryption key."""
        # Get new data key
        old_key = self._data_key
        old_fernet = self._fernet
        self._data_key = None
        self._fernet = None

        try:
            # Re-encrypt data with new key
            new_fernet = self.fernet
            if old_fernet:
                new_fernet.rotate(old_key)
        except Exception as e:
            # Restore old key if rotation fails
            self._data_key = old_key
            self._fernet = old_fernet
            raise EncryptionError(f"Failed to rotate encryption key: {str(e)}")


class EncryptionError(Exception):
    """Custom exception for encryption-related errors."""
    pass


def get_encryption_key():
    """Get the encryption key from settings."""
    return Fernet(settings.ENCRYPTION_KEY.encode())


def encrypt_field(value: str) -> str:
    """Encrypt a field value."""
    if not value:
        return value

    # Handle date strings
    if isinstance(value, str) and 'T' in value:
        try:
            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
            value = dt.strftime('%Y-%m-%d')
        except ValueError:
            pass

    key = get_encryption_key()
    encrypted = key.encrypt(value.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_field(encrypted_value: str) -> str:
    """Decrypt a field value."""
    if not encrypted_value:
        return encrypted_value

    try:
        key = get_encryption_key()
        decoded = base64.urlsafe_b64decode(encrypted_value.encode())
        decrypted = key.decrypt(decoded).decode()
        return decrypted
    except Exception as e:
        raise EncryptionError(f"Failed to decrypt field: {str(e)}")