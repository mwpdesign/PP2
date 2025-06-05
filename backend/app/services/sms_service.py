"""AWS SNS service for HIPAA-compliant SMS notifications."""

import boto3
import logging
from typing import Dict, Optional
from botocore.exceptions import ClientError

from app.core.config import settings
from app.services.aws_kms import KMSService

logger = logging.getLogger(__name__)


class SMSService:
    """AWS SNS service for sending HIPAA-compliant SMS notifications."""

    def __init__(self):
        """Initialize SNS service."""
        self.sns_client = boto3.client(
            "sns",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.kms_service = KMSService()

        # SMS configuration
        self.sender_id = settings.SMS_SENDER_ID
        self.max_price = settings.SMS_MAX_PRICE
        self._configure_sns()

    def _configure_sns(self):
        """Configure SNS settings for SMS."""
        try:
            self.sns_client.set_sms_attributes(
                attributes={
                    "DefaultSenderID": self.sender_id,
                    "DefaultSMSType": "Transactional",
                    "MaxPrice": self.max_price,
                    "UsageReportS3Bucket": settings.SNS_USAGE_REPORT_BUCKET,
                }
            )
        except ClientError as e:
            logger.error(f"Failed to configure SNS: {str(e)}")
            raise

    async def send_sms(
        self,
        recipient_id: str,
        content: str,
        metadata: Dict
    ) -> bool:
        """Send HIPAA-compliant SMS."""
        try:
            # Get recipient phone from user service
            phone_number = await self._get_recipient_phone(recipient_id)

            # Validate phone number format
            if not self._validate_phone_number(phone_number):
                logger.error(f"Invalid phone number format: {phone_number}")
                return False

            # Check opt-out status
            if await self._is_opted_out(phone_number):
                logger.info(f"Recipient {phone_number} has opted out of SMS")
                return False

            # Send SMS
            response = self.sns_client.publish(
                PhoneNumber=phone_number,
                Message=content,
                MessageAttributes={
                    "AWS.SNS.SMS.SenderID": {
                        "DataType": "String",
                        "StringValue": self.sender_id,
                    },
                    "AWS.SNS.SMS.SMSType": {
                        "DataType": "String",
                        "StringValue": "Transactional",
                    },
                },
            )

            logger.info(
                f"SMS sent successfully to {phone_number}, "
                f"MessageId: {response['MessageId']}"
            )

            return True

        except ClientError as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return False

        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {str(e)}")
            return False

    async def _get_recipient_phone(self, recipient_id: str) -> str:
        """Get recipient phone number from user service."""
        # TODO: Implement user service integration
        return "+1234567890"  # Placeholder

    def _validate_phone_number(self, phone_number: str) -> bool:
        """Validate phone number format."""
        import re

        pattern = r"^\+[1-9]\d{1,14}$"
        return bool(re.match(pattern, phone_number))

    async def _is_opted_out(self, phone_number: str) -> bool:
        """Check if phone number has opted out."""
        try:
            response = self.sns_client.check_if_phone_number_is_opted_out(
                phoneNumber=phone_number
            )
            return response["isOptedOut"]

        except ClientError as e:
            logger.error(f"Failed to check opt-out status: {str(e)}")
            return True

    async def get_opt_out_list(self) -> list:
        """Get list of opted-out phone numbers."""
        try:
            response = self.sns_client.list_phone_numbers_opted_out()
            return response["phoneNumbers"]

        except ClientError as e:
            logger.error(f"Failed to get opt-out list: {str(e)}")
            return []

    async def handle_opt_out(self, phone_number: str):
        """Handle opt-out request."""
        try:
            # Log opt-out for compliance
            logger.info(f"Processing opt-out request for {phone_number}")

            # Update user preferences in database
            await self._update_user_preferences(phone_number, opted_out=True)

        except Exception as e:
            logger.error(f"Failed to process opt-out: {str(e)}")
            raise

    async def _update_user_preferences(
        self,
        phone_number: str,
        opted_out: bool
    ):
        """Update user notification preferences."""
        # TODO: Implement user preferences update
        pass
