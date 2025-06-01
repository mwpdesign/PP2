"""
Insurance verification service for real-time eligibility checking.
Implements HIPAA-compliant insurance status verification.
"""

from datetime import datetime
from typing import Dict
from enum import Enum
import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.services.aws_kms import AWSKMSService


class InsuranceVerificationStatus(str, Enum):
    """Status of insurance verification."""

    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"


class InsuranceVerificationService:
    def __init__(self):
        """Initialize insurance verification service."""
        self.settings = get_settings()
        self.kms_service = AWSKMSService()
        self.client = httpx.AsyncClient(timeout=30.0)

        # Provider API configurations
        self.provider_configs = {
            "medicare": {
                "api_url": self.settings.medicare_api_url,
                "api_key": self.settings.medicare_api_key,
            },
            "medicaid": {
                "api_url": self.settings.medicaid_api_url,
                "api_key": self.settings.medicaid_api_key,
            },
            "private": {
                "api_url": self.settings.private_insurance_api_url,
                "api_key": self.settings.private_insurance_api_key,
            },
        }

    async def verify_insurance(
        self, insurance_data: Dict, user_id: int, territory_id: int
    ) -> Dict:
        """
        Verify insurance eligibility in real-time.
        Includes coverage verification and benefits check.
        """
        try:
            provider_type = insurance_data.get("insurance_type", "").lower()
            if provider_type not in self.provider_configs:
                raise HTTPException(
                    status_code=400, detail="Unsupported insurance provider"
                )

            # Prepare verification request
            config = self.provider_configs[provider_type]
            verification_request = await self._prepare_verification_request(
                insurance_data, config
            )

            # Call provider API
            async with self.client as client:
                response = await client.post(
                    config["api_url"],
                    json=verification_request,
                    headers={
                        "Authorization": f"Bearer {config['api_key']}",
                        "X-Territory-ID": str(territory_id),
                        "X-User-ID": str(user_id),
                    },
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Insurance verification failed",
                    )

            # Process verification response
            verification_result = await self._process_verification_response(
                response.json(), insurance_data
            )

            return {
                "status": InsuranceVerificationStatus.VERIFIED,
                "verified_at": datetime.utcnow().isoformat(),
                "coverage_details": verification_result["coverage"],
                "benefits_info": verification_result["benefits"],
                "verification_id": verification_result["verification_id"],
                "provider_response": verification_result["provider_response"],
            }

        except httpx.RequestError as e:
            return {
                "status": InsuranceVerificationStatus.FAILED,
                "error": "Failed to connect to insurance provider",
                "error_details": str(e),
                "verified_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {
                "status": InsuranceVerificationStatus.FAILED,
                "error": "Insurance verification failed",
                "error_details": str(e),
                "verified_at": datetime.utcnow().isoformat(),
            }

    async def _prepare_verification_request(
        self, insurance_data: Dict, config: Dict
    ) -> Dict:
        """
        Prepare the verification request for the provider API.
        Encrypts sensitive data and formats request.
        """
        # Encrypt sensitive fields
        encrypted_fields = await self._encrypt_sensitive_fields(insurance_data, config)

        return {
            "member_id": encrypted_fields["insurance_id"],
            "group_number": encrypted_fields.get("insurance_group"),
            "provider_info": {
                "id": insurance_data.get("insurance_provider"),
                "plan_type": insurance_data.get("insurance_type"),
            },
            "verification_type": "eligibility",
            "service_date": datetime.utcnow().isoformat(),
            "request_id": f"req_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        }

    async def _process_verification_response(
        self, response_data: Dict, original_request: Dict
    ) -> Dict:
        """
        Process and validate the verification response.
        Extracts coverage and benefits information.
        """
        coverage = {
            "is_active": response_data.get("is_active", False),
            "coverage_start": response_data.get("coverage_start"),
            "coverage_end": response_data.get("coverage_end"),
            "plan_type": response_data.get("plan_type"),
            "network_status": response_data.get("network_status"),
        }

        benefits = {
            "deductible": response_data.get("deductible", {}),
            "copay": response_data.get("copay", {}),
            "coinsurance": response_data.get("coinsurance", {}),
            "out_of_pocket_max": response_data.get("out_of_pocket_max", {}),
            "service_coverage": response_data.get("service_coverage", {}),
        }

        return {
            "coverage": coverage,
            "benefits": benefits,
            "verification_id": response_data.get("verification_id"),
            "provider_response": response_data.get("provider_response", {}),
        }

    async def _encrypt_sensitive_fields(self, data: Dict, config: Dict) -> Dict:
        """
        Encrypt sensitive insurance information.
        Uses AWS KMS for field-level encryption.
        """
        encrypted_data = data.copy()
        sensitive_fields = ["insurance_id", "insurance_group"]

        for field in sensitive_fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = await self.kms_service.encrypt_field(
                    str(encrypted_data[field]),
                    {
                        "field": field,
                        "provider": data.get("insurance_provider"),
                        "api_url": config["api_url"],
                    },
                )

        return encrypted_data

    async def check_coverage_status(
        self, verification_id: str, user_id: int, territory_id: int
    ) -> Dict:
        """
        Check the current status of insurance coverage.
        Used for status updates and monitoring.
        """
        try:
            # Implementation for coverage status check
            # This would typically call the insurance provider's status API
            pass

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to check coverage status: {str(e)}"
            )

    async def update_verification_status(
        self,
        verification_id: str,
        status: InsuranceVerificationStatus,
        user_id: int,
        territory_id: int,
    ) -> Dict:
        """
        Update the verification status.
        Used for manual updates and corrections.
        """
        try:
            # Implementation for status updates
            # This would typically update the local database
            pass

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update verification status: {str(e)}",
            )
