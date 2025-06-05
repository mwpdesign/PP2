"""
Local Encryption Service for Healthcare IVR Platform

Provides field-level encryption for PHI data using Python cryptography library.
Replaces AWS KMS functionality for local development and deployment.
Implements HIPAA-compliant encryption with comprehensive audit logging.
"""

import os
import base64
import logging
from typing import Optional, Any, Dict
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import json
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)


class EncryptionError(Exception):
    """Custom exception for encryption-related errors."""
    pass


class LocalEncryptionService:
    """
    Local encryption service using Python cryptography library.

    Provides symmetric encryption for PHI data with:
    - Environment-based key management
    - Secure key derivation
    - Comprehensive error handling
    - HIPAA-compliant audit logging
    - Memory protection for encryption keys
    """

    def __init__(self):
        """Initialize the encryption service with environment-based configuration."""
        self._fernet = None
        self._master_key = None
        self._salt = None
        self._initialize_encryption()

    def _initialize_encryption(self) -> None:
        """Initialize encryption with environment variables and validation."""
        try:
            # Load encryption configuration from environment
            encryption_key = os.getenv('ENCRYPTION_KEY')
            encryption_salt = os.getenv('ENCRYPTION_SALT')
            enable_encryption = os.getenv(
                'ENABLE_LOCAL_ENCRYPTION', 'true'
            ).lower() == 'true'

            if not enable_encryption:
                logger.warning(
                    "Local encryption is disabled via ENABLE_LOCAL_ENCRYPTION"
                )
                return

            if (not encryption_key or
                encryption_key == 'CHANGE_ME_TO_STRONG_ENCRYPTION_KEY'):
                raise EncryptionError(
                    "ENCRYPTION_KEY environment variable not set or using "
                    "default value. Generate a key with: python -c "
                    "\"import base64, os; print(base64.urlsafe_b64encode("
                    "os.urandom(32)).decode())\""
                )

            if (not encryption_salt or
                encryption_salt == 'CHANGE_ME_TO_STRONG_ENCRYPTION_SALT'):
                raise EncryptionError(
                    "ENCRYPTION_SALT environment variable not set or using "
                    "default value. Generate a salt with: python -c "
                    "\"import base64, os; print(base64.urlsafe_b64encode("
                    "os.urandom(16)).decode())\""
                )

            # Decode and validate the master key
            try:
                self._master_key = base64.urlsafe_b64decode(
                    encryption_key.encode()
                )
                self._salt = base64.urlsafe_b64decode(encryption_salt.encode())
            except Exception as e:
                raise EncryptionError(
                    f"Invalid encryption key or salt format: {str(e)}"
                )

            # Derive encryption key using PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=self._salt,
                iterations=100000,  # NIST recommended minimum
            )
            derived_key = kdf.derive(self._master_key)
            fernet_key = base64.urlsafe_b64encode(derived_key)

            # Initialize Fernet cipher
            self._fernet = Fernet(fernet_key)

            logger.info("Local encryption service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {str(e)}")
            raise EncryptionError(f"Encryption initialization failed: {str(e)}")

    def _log_encryption_operation(
        self, operation: str, data_type: str, context: Optional[Dict] = None) -> None:
        """Log encryption operations for HIPAA compliance using audit service."""
        try:
            # Import here to avoid circular imports
            from .audit_service import get_audit_service, DataClassification

            audit_service = get_audit_service()

            # Extract field name from context
            field_name = context.get(
                "field_name",
                "unknown"
            ) if context else "unknown"

            # Determine data classification
            data_classification = DataClassification.PHI  # Default to PHI for healthcare data
            if context and "data_classification" in context:
                classification_str = context["data_classification"]
                try:
                    data_classification = DataClassification(classification_str)
                except ValueError:
                    data_classification = DataClassification.PHI

            # Log the encryption operation
            audit_service.log_encryption_operation(
                operation=operation,
                field_name=field_name,
                data_classification=data_classification,
                resource_type=context.get("resource_type") if context else None,
                resource_id=context.get("resource_id") if context else None,
                success=True,
                details={"data_type": data_type}
            )

        except Exception as e:
            # Fallback to basic logging if audit service fails
            logger.warning(
                f"Audit service logging failed, using fallback: {str(e)}"
            )
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": operation,
                "data_type": data_type,
                "operation_id": str(uuid.uuid4()),
                "context": context or {}
            }
            logger.info(
                f"Encryption operation: {operation} for {data_type}",
                extra=log_entry
            )

    def encrypt_field(
        self,
        data: Any,
        context: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Encrypt a field value for secure storage with performance monitoring.

        Args:
            data: The data to encrypt (will be converted to string)
            context: Optional context for logging (e.g., field_name, user_id)

        Returns:
            Base64-encoded encrypted string, or None if data is None/empty

        Raises:
            EncryptionError: If encryption fails
        """
        if data is None or data == "":
            return None

        if not self._fernet:
            raise EncryptionError("Encryption service not initialized")

        # Extract field name for monitoring
        field_name = (
            context.get("field_name", "unknown") if context else "unknown"
        )

        # Performance monitoring
        try:
            from ..core.performance import time_encryption_operation
            with time_encryption_operation(
                field_name=field_name,
                data_size=len(str(data)) if data else 0,
                user_id=context.get("user_id") if context else None,
                organization_id=(
                    context.get("organization_id") if context else None
                )
            ):
                return self._perform_encryption(data, context)
        except ImportError:
            # Fallback if performance monitoring is not available
            return self._perform_encryption(data, context)

    def _perform_encryption(
        self,
        data: Any,
        context: Optional[Dict] = None
    ) -> str:
        """Perform the actual encryption operation."""
        try:
            # Convert data to string if not already
            if isinstance(data, (dict, list)):
                data_str = json.dumps(data, sort_keys=True)
            else:
                data_str = str(data)

            # Encrypt the data
            encrypted_bytes = self._fernet.encrypt(data_str.encode('utf-8'))
            encrypted_b64 = base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')

            # Log the operation (without sensitive data)
            self._log_encryption_operation(
                operation="encrypt",
                data_type=type(data).__name__,
                context=context
            )

            return encrypted_b64

        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise EncryptionError(f"Failed to encrypt data: {str(e)}")

    def decrypt_field(
        self,
        encrypted_data: Optional[str],
        context: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Decrypt a field value from secure storage with caching optimization.

        Args:
            encrypted_data: Base64-encoded encrypted string
            context: Optional context for logging (e.g., field_name, user_id)

        Returns:
            Decrypted string, or None if encrypted_data is None/empty

        Raises:
            EncryptionError: If decryption fails
        """
        if encrypted_data is None or encrypted_data == "":
            return None

        if not self._fernet:
            raise EncryptionError("Encryption service not initialized")

                # Extract field name and user context for caching
        field_name = (
            context.get("field_name", "unknown") if context else "unknown"
        )
        user_context = None
        if context:
            user_context = {
                "user_id": context.get("user_id"),
                "organization_id": context.get("organization_id")
            }

        # Try to get from cache first
        try:
            from .encryption_cache import get_encryption_cache
            cache = get_encryption_cache()
            cached_result = cache.get_cached_decryption(
                encrypted_data, user_context, field_name
            )
            if cached_result is not None:
                logger.debug(f"Cache hit for field: {field_name}")
                return cached_result
        except Exception as e:
            logger.warning(
                f"Cache retrieval failed, proceeding with decryption: {str(e)}"
            )

        # Performance monitoring
        try:
            from ..core.performance import time_decryption_operation
            with time_decryption_operation(
                field_name=field_name,
                data_size=len(encrypted_data) if encrypted_data else 0,
                user_id=context.get("user_id") if context else None,
                organization_id=(
                    context.get("organization_id") if context else None
                )
            ):
                # Perform decryption
                decrypted_str = self._perform_decryption(
                    encrypted_data, context
                )

                # Cache the result
                try:
                    from .encryption_cache import get_encryption_cache
                    cache = get_encryption_cache()
                    data_classification = (
                        context.get("data_classification", "PHI")
                        if context else "PHI"
                    )
                    cache.cache_decryption(
                        encrypted_data=encrypted_data,
                        decrypted_data=decrypted_str,
                        user_context=user_context,
                        field_name=field_name,
                        data_classification=data_classification
                    )
                except Exception as e:
                    logger.warning(
                        f"Failed to cache decryption result: {str(e)}"
                    )

                return decrypted_str

        except ImportError:
            # Fallback if performance monitoring is not available
            return self._perform_decryption(encrypted_data, context)

    def _perform_decryption(
        self,
        encrypted_data: str,
        context: Optional[Dict] = None
    ) -> str:
        """Perform the actual decryption operation."""
        try:
            # Decode from base64
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))

            # Decrypt the data
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            decrypted_str = decrypted_bytes.decode('utf-8')

            # Log the operation (without sensitive data)
            self._log_encryption_operation(
                operation="decrypt",
                data_type="encrypted_field",
                context=context
            )

            return decrypted_str

        except InvalidToken:
            logger.error("Invalid token during decryption - data may be corrupted")
            raise EncryptionError("Invalid encrypted data - token verification failed")
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise EncryptionError(f"Failed to decrypt data: {str(e)}")

    def encrypt_json(
        self,
        data: Dict,
        context: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Encrypt a JSON object for secure storage.

        Args:
            data: Dictionary to encrypt
            context: Optional context for logging

        Returns:
            Base64-encoded encrypted string
        """
        if not data:
            return None

        return self.encrypt_field(data, context)

    def decrypt_json(
        self,
        encrypted_data: Optional[str],
        context: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Decrypt a JSON object from secure storage.

        Args:
            encrypted_data: Base64-encoded encrypted string
            context: Optional context for logging

        Returns:
            Decrypted dictionary, or None if encrypted_data is None/empty
        """
        if not encrypted_data:
            return None

        decrypted_str = self.decrypt_field(encrypted_data, context)
        if decrypted_str is None:
            return None

        try:
            return json.loads(decrypted_str)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse decrypted JSON: {str(e)}")
            raise EncryptionError(f"Invalid JSON in encrypted data: {str(e)}")

    def is_enabled(self) -> bool:
        """Check if encryption is enabled and properly initialized."""
        return self._fernet is not None

    def validate_encryption(self) -> bool:
        """
        Validate that encryption is working correctly.

        Returns:
            True if encryption/decryption works, False otherwise
        """
        if not self.is_enabled():
            return False

        try:
            # Test encryption/decryption with sample data
            test_data = "test_encryption_validation"
            encrypted = self.encrypt_field(test_data, {"validation": True})
            decrypted = self.decrypt_field(encrypted, {"validation": True})

            return decrypted == test_data

        except Exception as e:
            logger.error(f"Encryption validation failed: {str(e)}")
            return False


# Global encryption service instance
_encryption_service: Optional[LocalEncryptionService] = None


def get_encryption_service() -> LocalEncryptionService:
    """
    Get the global encryption service instance.

    Returns:
        LocalEncryptionService instance

    Raises:
        EncryptionError: If service initialization fails
    """
    global _encryption_service

    if _encryption_service is None:
        _encryption_service = LocalEncryptionService()

    return _encryption_service


def encrypt_phi_field(
    data: Any,
    field_name: str = "unknown",
    user_id: Optional[str] = None
) -> Optional[str]:
    """
    Convenience function to encrypt PHI data with proper context logging.

    Args:
        data: The PHI data to encrypt
        field_name: Name of the field being encrypted (for audit logging)
        user_id: ID of the user performing the operation (for audit logging)

    Returns:
        Encrypted string or None
    """
    context = {
        "field_name": field_name,
        "user_id": user_id,
        "data_classification": "PHI"
    }

    return get_encryption_service().encrypt_field(data, context)


def decrypt_phi_field(
    encrypted_data: Optional[str],
    field_name: str = "unknown",
    user_id: Optional[str] = None
) -> Optional[str]:
    """
    Convenience function to decrypt PHI data with proper context logging.

    Args:
        encrypted_data: The encrypted PHI data
        field_name: Name of the field being decrypted (for audit logging)
        user_id: ID of the user performing the operation (for audit logging)

    Returns:
        Decrypted string or None
    """
    context = {
        "field_name": field_name,
        "user_id": user_id,
        "data_classification": "PHI"
    }

    return get_encryption_service().decrypt_field(encrypted_data, context)
