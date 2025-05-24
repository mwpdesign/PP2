"""HIPAA-compliant encryption service using AWS KMS."""
import boto3
import json
from botocore.exceptions import ClientError
from typing import Any, Dict
import base64
from datetime import datetime
from uuid import UUID

from app.core.config import settings
from app.core.encryption import encrypt_field, decrypt_field


class KMSEncryption:
    """AWS KMS encryption service."""

    def __init__(self):
        """Initialize KMS client."""
        self.client = boto3.client(
            'kms',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_ENDPOINT_URL
        )
        self.key_id = settings.AWS_KMS_KEY_ID

    def _serialize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert datetime and UUID objects to strings."""
        serialized = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                serialized[key] = value.strftime('%Y-%m-%d')
            elif isinstance(value, UUID):
                serialized[key] = str(value)
            elif isinstance(value, dict):
                serialized[key] = self._serialize_data(value)
            elif isinstance(value, list):
                serialized[key] = [
                    self._serialize_data(item) if isinstance(item, dict)
                    else item.strftime('%Y-%m-%d') if isinstance(item, datetime)
                    else str(item) if isinstance(item, UUID)
                    else item
                    for item in value
                ]
            else:
                serialized[key] = value
        return serialized

    def encrypt(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt data using KMS."""
        # If encryption is disabled, return data as is
        if not settings.ENABLE_PHI_ENCRYPTION:
            return self._serialize_data(data)

        try:
            # Serialize data
            serialized_data = self._serialize_data(data)
            
            # Convert data to JSON string
            data_str = json.dumps(serialized_data)
            
            # Encrypt data
            response = self.client.encrypt(
                KeyId=self.key_id,
                Plaintext=data_str.encode('utf-8')
            )
            
            # Base64 encode the encrypted data
            encrypted = base64.b64encode(
                response['CiphertextBlob']
            ).decode('utf-8')
            
            # Return encrypted data
            return {
                key: encrypted if key in [
                    'first_name', 'last_name', 'email',
                    'date_of_birth', 'insurance_provider', 'insurance_id'
                ] else value
                for key, value in serialized_data.items()
            }
        except ClientError as e:
            raise Exception(f"Failed to encrypt data: {str(e)}")

    def decrypt(self, encrypted_data: str) -> Dict[str, Any]:
        """Decrypt data using KMS."""
        try:
            # Base64 decode the encrypted data
            ciphertext = base64.b64decode(encrypted_data)
            
            # Decrypt data
            response = self.client.decrypt(
                CiphertextBlob=ciphertext,
                KeyId=self.key_id
            )
            
            # Parse decrypted JSON string
            decrypted = json.loads(response['Plaintext'].decode())
            
            # Handle date_of_birth field specially
            if 'date_of_birth' in decrypted:
                try:
                    decrypted['date_of_birth'] = datetime.strptime(
                        decrypted['date_of_birth'],
                        '%Y-%m-%d'
                    )
                except (ValueError, TypeError):
                    pass
            
            return decrypted
        except ClientError as e:
            raise Exception(f"Failed to decrypt data: {str(e)}")


# Initialize KMS encryption client
kms = KMSEncryption()


def encrypt_patient_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt patient data."""
    # Convert UUIDs to strings and handle date_of_birth
    data_copy = data.copy()
    for key, value in data_copy.items():
        if isinstance(value, UUID):
            data_copy[key] = str(value)
        elif key == 'date_of_birth' and value:
            if isinstance(value, str):
                try:
                    dt = datetime.fromisoformat(
                        value.replace('Z', '+00:00')
                    )
                    data_copy[key] = dt.strftime('%Y-%m-%d')
                except ValueError:
                    pass
            elif isinstance(value, datetime):
                data_copy[key] = value.strftime('%Y-%m-%d')
    
    return kms.encrypt(data_copy)


def decrypt_patient_data(patient: Any) -> Dict[str, Any]:
    """Decrypt patient data."""
    # Convert SQLAlchemy model to dict if needed
    if hasattr(patient, '__dict__'):
        patient_data = {
            c.name: getattr(patient, c.name)
            for c in patient.__table__.columns
        }
    else:
        patient_data = patient
    
    # Fields to decrypt
    sensitive_fields = [
        'first_name', 'last_name', 'email',
        'date_of_birth', 'insurance_provider', 'insurance_id'
    ]
    
    decrypted_data = {}
    for field, value in patient_data.items():
        if field in sensitive_fields and value:
            try:
                decrypted = kms.decrypt(value)
                if field == 'date_of_birth':
                    try:
                        dt = datetime.strptime(decrypted, '%Y-%m-%d')
                        decrypted_data[field] = dt
                    except ValueError:
                        decrypted_data[field] = decrypted
                else:
                    decrypted_data[field] = decrypted
            except Exception:
                decrypted_data[field] = value
        else:
            decrypted_data[field] = value
    
    return decrypted_data


def encrypt_provider_data(provider_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt provider sensitive fields"""
    encrypted_data = provider_data.copy()
    
    # Fields to encrypt
    sensitive_fields = ['tax_id']
    
    for field in sensitive_fields:
        if field in encrypted_data and encrypted_data[field]:
            encrypted_data[field] = kms.encrypt(str(encrypted_data[field]))
    
    return encrypted_data


def decrypt_provider_data(provider: Any) -> Any:
    """Decrypt provider sensitive fields"""
    # Convert SQLAlchemy model to dict if needed
    if hasattr(provider, '__dict__'):
        provider_data = {
            c.name: getattr(provider, c.name)
            for c in provider.__table__.columns
        }
    else:
        provider_data = provider.copy()
    
    # Fields to decrypt
    sensitive_fields = ['tax_id']
    
    for field in sensitive_fields:
        if field in provider_data and provider_data[field]:
            provider_data[field] = kms.decrypt(provider_data[field])
    
    return provider_data 