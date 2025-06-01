"""
Field-level encryption service for patient data using AWS KMS.
Handles encryption/decryption of PHI fields in patient records.
"""

from typing import Dict, Optional, Any
from fastapi import HTTPException, Depends

from app.services.aws_kms import AWSKMSService
from app.core.config import get_settings


class PatientEncryptionService:
    def __init__(self, kms_service: AWSKMSService = Depends(AWSKMSService)):
        """Initialize encryption service with KMS service dependency."""
        self.kms = kms_service
        self.settings = get_settings()

        # Fields that require encryption (PHI)
        self.encrypted_fields = {
            "first_name",
            "last_name",
            "date_of_birth",
            "ssn",
            "address",
            "phone_number",
            "email",
            "insurance_id",
            "medical_record_number",
            "diagnosis_codes",
            "treatment_notes",
        }

        # Fields that require special handling
        self.date_fields = {"date_of_birth"}
        self.array_fields = {"diagnosis_codes"}

    async def encrypt_patient_data(
        self, patient_data: Dict[str, Any], context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Encrypt sensitive fields in patient data.
        Uses the same data key for all fields to optimize performance.
        """
        try:
            # Generate a single data key for all fields
            encryption_context = {
                "resource_type": "patient",
                "patient_id": patient_data.get("id", "new"),
                **(context or {}),
            }
            data_key = await self.kms.create_data_key(encryption_context)

            encrypted_data = {}
            for field, value in patient_data.items():
                if field in self.encrypted_fields and value is not None:
                    # Handle special field types
                    if field in self.date_fields:
                        value = value.isoformat()
                    elif field in self.array_fields:
                        value = ",".join(value)

                    # Encrypt the field
                    encrypted_field = await self.kms.encrypt_field(
                        str(value), encryption_context, data_key
                    )
                    encrypted_data[field] = encrypted_field
                else:
                    encrypted_data[field] = value

            return encrypted_data
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to encrypt patient data: {str(e)}"
            )

    async def decrypt_patient_data(
        self, encrypted_data: Dict[str, Any], context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Decrypt encrypted fields in patient data.
        Handles special field types appropriately.
        """
        try:
            decrypted_data = {}
            for field, value in encrypted_data.items():
                if (
                    field in self.encrypted_fields
                    and isinstance(value, dict)
                    and "encrypted_data" in value
                ):
                    # Decrypt the field
                    decrypted_value = await self.kms.decrypt_field(
                        value["encrypted_data"],
                        value["encrypted_key"],
                        value.get("encryption_context", {}),
                    )

                    # Handle special field types
                    if field in self.date_fields:
                        from datetime import datetime as dt

                        decrypted_value = dt.fromisoformat(decrypted_value)
                    elif field in self.array_fields:
                        decrypted_value = (
                            decrypted_value.split(",") if decrypted_value else []
                        )

                    decrypted_data[field] = decrypted_value
                else:
                    decrypted_data[field] = value

            return decrypted_data
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to decrypt patient data: {str(e)}"
            )

    async def rotate_patient_data(
        self,
        patient_data: Dict[str, Any],
        new_key_id: str,
        context: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Re-encrypt patient data with a new key after key rotation.
        """
        try:
            rotated_data = {}
            for field, value in patient_data.items():
                if (
                    field in self.encrypted_fields
                    and isinstance(value, dict)
                    and "encrypted_data" in value
                ):
                    # Re-encrypt the field with new key
                    new_context = {
                        "resource_type": "patient",
                        "patient_id": patient_data.get("id"),
                        "key_id": new_key_id,
                        **(context or {}),
                    }
                    rotated_field = await self.kms.reencrypt_data(value, new_context)
                    rotated_data[field] = rotated_field
                else:
                    rotated_data[field] = value

            return rotated_data
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to rotate patient data encryption: {str(e)}",
            )

    def is_field_encrypted(self, field_name: str) -> bool:
        """Check if a field requires encryption."""
        return field_name in self.encrypted_fields

    async def validate_encryption(self, patient_data: Dict[str, Any]) -> bool:
        """
        Validate that all sensitive fields are properly encrypted.
        Returns True if valid, raises exception if invalid.
        """
        try:
            for field in self.encrypted_fields:
                if field in patient_data:
                    value = patient_data[field]
                    if value is not None:
                        if not isinstance(value, dict):
                            raise ValueError(f"Field {field} is not encrypted")
                        if "encrypted_data" not in value:
                            raise ValueError(f"Field {field} missing encrypted data")
                        if "encrypted_key" not in value:
                            raise ValueError(f"Field {field} missing encrypted key")
            return True
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid encryption: {str(e)}")
