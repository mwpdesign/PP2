"""AWS SES service for HIPAA-compliant email notifications."""

import boto3
import json
import logging
from typing import Dict, Optional
from botocore.exceptions import ClientError
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from app.core.config import settings
from app.services.aws_kms import KMSService

logger = logging.getLogger(__name__)


class SESService:
    """AWS SES service for sending HIPAA-compliant emails."""

    def __init__(self):
        """Initialize SES service."""
        self.ses_client = boto3.client(
            'ses',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.kms_service = KMSService()

        # Email configuration
        self.sender = settings.SES_SENDER_EMAIL
        self.bounce_topic_arn = settings.SNS_BOUNCE_TOPIC_ARN
        self.complaint_topic_arn = settings.SNS_COMPLAINT_TOPIC_ARN

    async def send_email(
        self,
        recipient_id: str,
        content: str,
        metadata: Dict,
        attachments: Optional[Dict[str, bytes]] = None
    ) -> bool:
        """Send HIPAA-compliant email."""
        try:
            # Get recipient email from user service
            recipient_email = await self._get_recipient_email(recipient_id)

            # Create message container
            msg = MIMEMultipart('alternative')
            msg['Subject'] = metadata.get('subject', 'Healthcare Notification')
            msg['From'] = self.sender
            msg['To'] = recipient_email

            # Create HTML and plain text versions
            text_content = self._create_text_content(content)
            html_content = self._create_html_content(content)

            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            # Add attachments if any
            if attachments:
                for filename, file_content in attachments.items():
                    # Encrypt attachment
                    encrypted_content = self.kms_service.encrypt(file_content)

                    attachment = MIMEApplication(encrypted_content)
                    attachment.add_header(
                        'Content-Disposition',
                        'attachment',
                        filename=filename
                    )
                    msg.attach(attachment)

            # Send email
            response = self.ses_client.send_raw_email(
                Source=self.sender,
                Destinations=[recipient_email],
                RawMessage={'Data': msg.as_string()},
                ConfigurationSetName=settings.SES_CONFIGURATION_SET
            )

            logger.info(
                f"Email sent successfully to {recipient_email}, "
                f"MessageId: {response['MessageId']}"
            )

            return True

        except ClientError as e:
            error = e.response['Error']
            logger.error(
                f"Failed to send email: {error['Message']}, "
                f"Type: {error['Code']}"
            )
            return False

        except Exception as e:
            logger.error(f"Unexpected error sending email: {str(e)}")
            return False

    async def _get_recipient_email(self, recipient_id: str) -> str:
        """Get recipient email from user service."""
        # TODO: Implement user service integration
        return "test@example.com"  # Placeholder

    def _create_text_content(self, content: str) -> str:
        """Create plain text email content."""
        return f"""
        {content}

        ---
        This is a secure healthcare notification.
        Please do not reply to this email.
        """

    def _create_html_content(self, content: str) -> str:
        """Create HTML email content."""
        return f"""
        <html>
        <head></head>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px;">
                    <p style="font-size: 16px; line-height: 1.5;">
                        {content}
                    </p>
                </div>
                <div style="margin-top: 20px; padding: 10px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is a secure healthcare notification.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

    def configure_bounce_handling(self):
        """Configure bounce and complaint handling."""
        try:
            # Set up bounce notifications
            self.ses_client.set_identity_notification_topic(
                Identity=self.sender,
                NotificationType='Bounce',
                SnsTopic=self.bounce_topic_arn
            )

            # Set up complaint notifications
            self.ses_client.set_identity_notification_topic(
                Identity=self.sender,
                NotificationType='Complaint',
                SnsTopic=self.complaint_topic_arn
            )

            # Enable notifications
            self.ses_client.set_identity_feedback_forwarding_enabled(
                Identity=self.sender,
                ForwardingEnabled=True
            )

            logger.info("Successfully configured bounce and complaint handling")

        except ClientError as e:
            logger.error(f"Failed to configure bounce handling: {str(e)}")
            raise