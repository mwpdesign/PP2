"""
AWS KMS Integration Service for HIPAA-compliant field-level encryption.
This service handles encryption/decryption operations using AWS KMS.
"""

from typing import Dict, Optional
import boto3
import base64
import os
from datetime import datetime
from botocore.exceptions import ClientError
from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.core.config import get_settings


class AWSKMSService:
    def __init__(self):
        """Initialize AWS KMS client and configure key settings."""
        self.settings = get_settings()

        # Configure KMS client with proper region and endpoint
        client_config = {
            "aws_access_key_id": self.settings.aws_access_key_id,
            "aws_secret_access_key": self.settings.aws_secret_access_key,
            "region_name": self.settings.aws_region,
        }

        # Add endpoint URL if configured (for LocalStack)
        if self.settings.aws_endpoint_url:
            client_config["endpoint_url"] = self.settings.aws_endpoint_url

        self.kms_client = boto3.client("kms", **client_config)
        self.key_id = self.settings.aws_kms_key_id
        self.key_alias = os.getenv(
            "AWS_KMS_KEY_ALIAS", "alias/healthcare-ivr-phi")
        self.region = self.settings.aws_region

        # Encryption context for additional security
        self.base_encryption_context = {
            "application": "healthcare-ivr-platform",
            "environment": os.getenv("ENVIRONMENT", "production"),
        }

    async def create_data_key(self, context: Optional[Dict] = None) -> Dict:
        """
        Generate a new data key for encrypting PHI data.
        Returns both plaintext and encrypted versions of the key.
        """
        try:
            encryption_context = {**self.base_encryption_context, **(context or {})}

            response = self.kms_client.generate_data_key(
                KeyId=self.key_id,
                KeySpec="AES_256",
                EncryptionContext=encryption_context,
            )

            return {
                "plaintext_key": base64.b64encode(response["Plaintext"]).decode(
                    "utf-8"
                ),
                "encrypted_key": base64.b64encode(response["CiphertextBlob"]).decode(
                    "utf-8"
                ),
                "key_id": response["KeyId"],
                "created_at": datetime.utcnow().isoformat(),
            }
        except ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to generate data key: {str(e)}"
            )

    async def encrypt_field(
        self,
        plaintext: str,
        context: Optional[Dict] = None,
        data_key: Optional[Dict] = None,
    ) -> Dict:
        """
        Encrypt a single field using AWS KMS.
        Uses envelope encryption for better performance.
        """
        try:
            # Generate or use provided data key
            key_data = data_key or await self.create_data_key(context)

            # Encrypt the field using the data key
            f = Fernet(key_data["plaintext_key"])
            encrypted_data = f.encrypt(plaintext.encode())

            return {
                "encrypted_data": base64.b64encode(encrypted_data).decode("utf-8"),
                "encrypted_key": key_data["encrypted_key"],
                "key_id": key_data["key_id"],
                "encryption_context": context or {},
                "encrypted_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Encryption failed: {str(e)}"
            )

    async def decrypt_field(
        self, encrypted_data: str, encrypted_key: str, context: Optional[Dict] = None
    ) -> str:
        """
        Decrypt a field using AWS KMS.
        Verifies encryption context before decryption.
        """
        try:
            encryption_context = {**self.base_encryption_context, **(context or {})}

            # Decrypt the data key
            key_response = self.kms_client.decrypt(
                CiphertextBlob=base64.b64decode(encrypted_key),
                EncryptionContext=encryption_context,
            )

            # Use the decrypted data key to decrypt the field
            f = Fernet(base64.b64encode(key_response["Plaintext"]))
            decrypted_data = f.decrypt(base64.b64decode(encrypted_data))

            return decrypted_data.decode("utf-8")
        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Decryption failed: {str(e)}"
            )

    async def rotate_key(self, old_key_id: str) -> Dict:
        """
        Rotate encryption key and re-encrypt data.
        Returns new key information.
        """
        try:
            # Create new CMK
            new_key = self.kms_client.create_key(
                Description="Healthcare IVR Platform PHI Encryption Key",
                KeyUsage="ENCRYPT_DECRYPT",
                Origin="AWS_KMS",
                Tags=[
                    {"TagKey": "Application", "TagValue": "healthcare-ivr-platform"},
                    {"TagKey": "Purpose", "TagValue": "phi-encryption"},
                ],
            )

            # Update key alias to point to new key
            self.kms_client.update_alias(
                AliasName=self.key_alias, TargetKeyId=new_key["KeyMetadata"]["KeyId"]
            )

            return {
                "new_key_id": new_key["KeyMetadata"]["KeyId"],
                "old_key_id": old_key_id,
                "rotated_at": datetime.utcnow().isoformat(),
            }
        except ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Key rotation failed: {str(e)}"
            )

    async def reencrypt_data(
        self, encrypted_data: Dict, new_context: Optional[Dict] = None
    ) -> Dict:
        """
        Re-encrypt data using a new key after key rotation.
        """
        try:
            # Decrypt with old key
            decrypted_data = await self.decrypt_field(
                encrypted_data["encrypted_data"],
                encrypted_data["encrypted_key"],
                encrypted_data.get("encryption_context", {}),
            )

            # Encrypt with new key
            return await self.encrypt_field(
                decrypted_data,
                new_context or encrypted_data.get("encryption_context", {}),
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Re-encryption failed: {str(e)}"
            )
