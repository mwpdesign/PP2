import boto3
import json
from botocore.exceptions import ClientError
from typing import Any, Dict

from app.core.config import settings


class KMSEncryption:
    def __init__(self):
        self.client = boto3.client(
            'kms',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_DEFAULT_REGION
        )
        self.key_id = settings.AWS_KMS_KEY_ID

    def encrypt(self, data: str) -> str:
        """Encrypt data using AWS KMS"""
        try:
            response = self.client.encrypt(
                KeyId=self.key_id,
                Plaintext=data.encode()
            )
            return response['CiphertextBlob'].hex()
        except ClientError as e:
            raise Exception(f"Failed to encrypt data: {str(e)}")

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt data using AWS KMS"""
        try:
            response = self.client.decrypt(
                CiphertextBlob=bytes.fromhex(encrypted_data)
            )
            return response['Plaintext'].decode()
        except ClientError as e:
            raise Exception(f"Failed to decrypt data: {str(e)}")


# Initialize KMS encryption client
kms = KMSEncryption()


def encrypt_patient_data(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt patient PHI fields"""
    encrypted_data = patient_data.copy()
    
    # Fields to encrypt
    phi_fields = [
        'first_name', 'last_name', 'date_of_birth', 'ssn',
        'email', 'phone', 'address_line1', 'address_line2',
        'city', 'state', 'zip_code', 'insurance_provider',
        'insurance_id', 'insurance_group', 'insurance_phone',
        'medical_history', 'allergies', 'medications'
    ]
    
    for field in phi_fields:
        if field in encrypted_data and encrypted_data[field]:
            # Convert date objects to ISO format string
            if field == 'date_of_birth':
                value = encrypted_data[field].isoformat()
            else:
                value = str(encrypted_data[field])
                
            encrypted_data[field] = kms.encrypt(value)
    
    return encrypted_data


def decrypt_patient_data(patient: Any) -> Any:
    """Decrypt patient PHI fields"""
    # Convert SQLAlchemy model to dict if needed
    if hasattr(patient, '__dict__'):
        patient_data = {
            c.name: getattr(patient, c.name)
            for c in patient.__table__.columns
        }
    else:
        patient_data = patient.copy()
    
    # Fields to decrypt
    phi_fields = [
        'first_name', 'last_name', 'date_of_birth', 'ssn',
        'email', 'phone', 'address_line1', 'address_line2',
        'city', 'state', 'zip_code', 'insurance_provider',
        'insurance_id', 'insurance_group', 'insurance_phone',
        'medical_history', 'allergies', 'medications'
    ]
    
    for field in phi_fields:
        if field in patient_data and patient_data[field]:
            decrypted_value = kms.decrypt(patient_data[field])
            
            # Convert date strings back to date objects
            if field == 'date_of_birth':
                from datetime import date
                patient_data[field] = date.fromisoformat(decrypted_value)
            else:
                patient_data[field] = decrypted_value
    
    return patient_data


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