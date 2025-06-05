"""
SQLAlchemy Encrypted Field Types for Healthcare IVR Platform

Custom field types that provide transparent encryption/decryption for PHI data.
Integrates with the local encryption service for HIPAA-compliant data protection.
"""

import json
import logging
from typing import Any, Optional
from sqlalchemy import String, Text, TypeDecorator, LargeBinary
from sqlalchemy.engine import Dialect
import base64

from app.services.encryption_service import (
    get_encryption_service,
    EncryptionError
)

logger = logging.getLogger(__name__)


class EncryptedType(TypeDecorator):
    """
    Base class for encrypted SQLAlchemy field types.

    Provides common functionality for transparent encryption/decryption
    during database operations with proper error handling and logging.
    """

    cache_ok = True  # Enable SQLAlchemy caching

    def __init__(self, field_name: str = "unknown", **kwargs):
        """
        Initialize encrypted type.

        Args:
            field_name: Name of the field for audit logging
            **kwargs: Additional arguments passed to parent TypeDecorator
        """
        super().__init__(**kwargs)
        self.field_name = field_name

    def process_bind_param(
        self,
        value: Any,
        dialect: Dialect
    ) -> Optional[bytes]:
        """
        Encrypt value before storing in database.

        Args:
            value: The value to encrypt
            dialect: SQLAlchemy database dialect

        Returns:
            Encrypted bytes or None if value is None/empty
        """
        if value is None or value == "":
            return None

        try:
            encryption_service = get_encryption_service()

            # Create context for audit logging
            context = {
                "field_name": self.field_name,
                "operation": "database_save",
                "data_classification": "PHI"
            }

            encrypted_value = encryption_service.encrypt_field(value, context)

            # Convert base64 string to bytes for bytea storage
            encrypted_bytes = base64.b64decode(encrypted_value)

            logger.debug(
                f"Encrypted field '{self.field_name}' for database storage"
            )

            return encrypted_bytes

        except Exception as e:
            logger.error(
                f"Failed to encrypt field '{self.field_name}': {str(e)}"
            )
            raise EncryptionError(
                f"Database encryption failed for field "
                f"'{self.field_name}': {str(e)}"
            )

    def process_result_value(
        self,
        value: Optional[bytes],
        dialect: Dialect
    ) -> Any:
        """
        Decrypt value after loading from database.

        Args:
            value: The encrypted bytes from database
            dialect: SQLAlchemy database dialect

        Returns:
            Decrypted value or None if value is None/empty
        """
        if value is None or value == b"":
            return None

        try:
            encryption_service = get_encryption_service()

            # Convert bytes back to base64 string for decryption
            encrypted_string = base64.b64encode(value).decode('utf-8')

            # Create context for audit logging
            context = {
                "field_name": self.field_name,
                "operation": "database_load",
                "data_classification": "PHI"
            }

            decrypted_value = encryption_service.decrypt_field(
                encrypted_string, context
            )

            logger.debug(
                f"Decrypted field '{self.field_name}' from database"
            )

            return decrypted_value

        except Exception as e:
            logger.error(
                f"Failed to decrypt field '{self.field_name}': {str(e)}"
            )
            raise EncryptionError(
                f"Database decryption failed for field "
                f"'{self.field_name}': {str(e)}"
            )


class EncryptedString(EncryptedType):
    """
    Encrypted string field type for SQLAlchemy.

    Automatically encrypts string data before database storage
    and decrypts when loading from database.

    Usage:
        class Patient(Base):
            ssn = Column(EncryptedString(field_name="ssn"))
    """

    impl = LargeBinary

    def __init__(
        self,
        length: Optional[int] = None,
        field_name: str = "string_field",
        **kwargs
    ):
        """
        Initialize encrypted string field.

        Args:
            length: Maximum length for the underlying String column
            field_name: Name of the field for audit logging
            **kwargs: Additional arguments
        """
        if length:
            kwargs['length'] = length
        super().__init__(field_name=field_name, **kwargs)


class EncryptedText(EncryptedType):
    """
    Encrypted text field type for SQLAlchemy.

    Similar to EncryptedString but for longer text content.
    Uses LargeBinary as the underlying SQL type.

    Usage:
        class Patient(Base):
            medical_history = Column(EncryptedText(field_name="medical_history"))
    """

    impl = LargeBinary

    def __init__(self, field_name: str = "text_field", **kwargs):
        """
        Initialize encrypted text field.

        Args:
            field_name: Name of the field for audit logging
            **kwargs: Additional arguments
        """
        super().__init__(field_name=field_name, **kwargs)


class EncryptedJSON(EncryptedType):
    """
    Encrypted JSON field type for SQLAlchemy.

    Automatically serializes Python objects to JSON, encrypts the JSON string,
    and stores in database. Reverses the process when loading.

    Usage:
        class Patient(Base):
            insurance_info = Column(EncryptedJSON(field_name="insurance_info"))
    """

    impl = Text  # Store as Text to accommodate large JSON

    def __init__(self, field_name: str = "json_field", **kwargs):
        """
        Initialize encrypted JSON field.

        Args:
            field_name: Name of the field for audit logging
            **kwargs: Additional arguments
        """
        super().__init__(field_name=field_name, **kwargs)

    def process_bind_param(
        self,
        value: Any,
        dialect: Dialect
    ) -> Optional[str]:
        """
        Serialize to JSON and encrypt before storing in database.

        Args:
            value: The Python object to serialize and encrypt
            dialect: SQLAlchemy database dialect

        Returns:
            Encrypted JSON string or None if value is None
        """
        if value is None:
            return None

        try:
            # Serialize to JSON first
            json_string = json.dumps(value, sort_keys=True, ensure_ascii=False)

            # Then encrypt using parent method
            return super().process_bind_param(json_string, dialect)

        except (TypeError, ValueError) as e:
            logger.error(
                f"Failed to serialize field '{self.field_name}' to JSON: {str(e)}"
            )
            raise EncryptionError(
                f"JSON serialization failed for field '{self.field_name}': {str(e)}"
            )

    def process_result_value(
        self,
        value: Optional[str],
        dialect: Dialect
    ) -> Any:
        """
        Decrypt and deserialize JSON after loading from database.

        Args:
            value: The encrypted JSON string from database
            dialect: SQLAlchemy database dialect

        Returns:
            Deserialized Python object or None if value is None
        """
        if value is None:
            return None

        try:
            # First decrypt using parent method
            decrypted_json = super().process_result_value(value, dialect)

            if decrypted_json is None:
                return None

            # Then deserialize from JSON
            return json.loads(decrypted_json)

        except json.JSONDecodeError as e:
            logger.error(
                f"Failed to deserialize field '{self.field_name}' from JSON: {str(e)}"
            )
            raise EncryptionError(
                f"JSON deserialization failed for field '{self.field_name}': {str(e)}"
            )


class SearchableEncryptedString(EncryptedString):
    """
    Encrypted string field that supports limited search operations.

    WARNING: This provides weaker security than standard EncryptedString
    as it may leak information through search patterns. Use only when
    search functionality is absolutely required for business operations.

    Usage:
        class Patient(Base):
            # Only use for fields that must be searchable
            last_name = Column(SearchableEncryptedString(field_name="last_name"))
    """

    def __init__(self, field_name: str = "searchable_field", **kwargs):
        """
        Initialize searchable encrypted string field.

        Args:
            field_name: Name of the field for audit logging
            **kwargs: Additional arguments
        """
        super().__init__(field_name=field_name, **kwargs)
        logger.warning(
            f"SearchableEncryptedString used for field '{field_name}'. "
            "This provides weaker security than standard encryption."
        )


# Convenience functions for creating encrypted fields with proper naming

def encrypted_string(
    field_name: str,
    length: Optional[int] = None
) -> EncryptedString:
    """
    Create an EncryptedString field with proper field name for audit logging.

    Args:
        field_name: Name of the field for audit logging
        length: Maximum length for the string

    Returns:
        EncryptedString instance
    """
    return EncryptedString(length=length, field_name=field_name)


def encrypted_text(field_name: str) -> EncryptedText:
    """
    Create an EncryptedText field with proper field name for audit logging.

    Args:
        field_name: Name of the field for audit logging

    Returns:
        EncryptedText instance
    """
    return EncryptedText(field_name=field_name)


def encrypted_json(field_name: str) -> EncryptedJSON:
    """
    Create an EncryptedJSON field with proper field name for audit logging.

    Args:
        field_name: Name of the field for audit logging

    Returns:
        EncryptedJSON instance
    """
    return EncryptedJSON(field_name=field_name)


def searchable_encrypted_string(
    field_name: str,
    length: Optional[int] = None
) -> SearchableEncryptedString:
    """
    Create a SearchableEncryptedString field with proper field name for audit logging.

    WARNING: Use only when search functionality is absolutely required.

    Args:
        field_name: Name of the field for audit logging
        length: Maximum length for the string

    Returns:
        SearchableEncryptedString instance
    """
    return SearchableEncryptedString(length=length, field_name=field_name)


# Export commonly used types
__all__ = [
    'EncryptedString',
    'EncryptedText',
    'EncryptedJSON',
    'SearchableEncryptedString',
    'encrypted_string',
    'encrypted_text',
    'encrypted_json',
    'searchable_encrypted_string',
    'EncryptionError'
]
