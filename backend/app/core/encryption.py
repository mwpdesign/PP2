"""
Core encryption module providing encryption utilities and configuration.
Handles encryption key management and rotation policies.
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.core.config import get_settings


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