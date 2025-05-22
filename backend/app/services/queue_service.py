"""AWS SQS service for HIPAA-compliant message queuing."""

import boto3
import json
import logging
from typing import Dict, Optional, List
from datetime import datetime
from botocore.exceptions import ClientError

from app.core.config import settings
from app.services.encryption import EncryptionService

logger = logging.getLogger(__name__)


class QueueService:
    """AWS SQS service for message queuing."""

    def __init__(self):
        """Initialize SQS service."""
        self.sqs_client = boto3.client(
            'sqs',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.encryption_service = EncryptionService()
        
        # Queue URLs
        self.main_queue_url = settings.SQS_MAIN_QUEUE_URL
        self.dlq_url = settings.SQS_DEAD_LETTER_QUEUE_URL
        
        # Configure queues
        self._configure_queues()

    def _configure_queues(self):
        """Configure SQS queues and attributes."""
        try:
            # Configure main queue
            self.sqs_client.set_queue_attributes(
                QueueUrl=self.main_queue_url,
                Attributes={
                    'VisibilityTimeout': '300',  # 5 minutes
                    'MessageRetentionPeriod': '86400',  # 24 hours
                    'RedrivePolicy': json.dumps({
                        'deadLetterTargetArn': settings.SQS_DLQ_ARN,
                        'maxReceiveCount': '3'
                    })
                }
            )
            
            # Configure DLQ
            self.sqs_client.set_queue_attributes(
                QueueUrl=self.dlq_url,
                Attributes={
                    'MessageRetentionPeriod': '1209600'  # 14 days
                }
            )
            
        except ClientError as e:
            logger.error(f"Failed to configure queues: {str(e)}")
            raise

    async def send_message(
        self,
        message: Dict,
        user_id: str,
        territory: Optional[str] = None,
        delay_seconds: int = 0
    ) -> bool:
        """Send message to SQS queue."""
        try:
            # Encrypt message content
            encrypted_message = self.encryption_service.encrypt(
                json.dumps(message)
            )
            
            # Prepare message attributes
            message_attributes = {
                'UserId': {
                    'DataType': 'String',
                    'StringValue': user_id
                }
            }
            
            if territory:
                message_attributes['Territory'] = {
                    'DataType': 'String',
                    'StringValue': territory
                }
            
            # Send to SQS
            response = self.sqs_client.send_message(
                QueueUrl=self.main_queue_url,
                MessageBody=encrypted_message,
                MessageAttributes=message_attributes,
                DelaySeconds=delay_seconds
            )
            
            logger.info(
                f"Message sent to queue, MessageId: {response['MessageId']}"
            )
            return True
            
        except Exception as e:
            logger.error(f"Failed to send message to queue: {str(e)}")
            return False

    async def receive_messages(
        self,
        max_messages: int = 10,
        visibility_timeout: int = 300
    ) -> List[Dict]:
        """Receive messages from SQS queue."""
        try:
            response = self.sqs_client.receive_message(
                QueueUrl=self.main_queue_url,
                MaxNumberOfMessages=max_messages,
                VisibilityTimeout=visibility_timeout,
                MessageAttributeNames=['All']
            )
            
            messages = []
            for message in response.get('Messages', []):
                try:
                    # Decrypt message content
                    decrypted_content = self.encryption_service.decrypt(
                        message['Body']
                    )
                    content = json.loads(decrypted_content)
                    
                    messages.append({
                        'message_id': message['MessageId'],
                        'receipt_handle': message['ReceiptHandle'],
                        'content': content,
                        'attributes': message.get('MessageAttributes', {})
                    })
                    
                except Exception as e:
                    logger.error(
                        f"Failed to process message {message['MessageId']}: {str(e)}"
                    )
                    await self._move_to_dlq(message)
                    
            return messages
            
        except Exception as e:
            logger.error(f"Failed to receive messages: {str(e)}")
            return []

    async def delete_message(self, receipt_handle: str) -> bool:
        """Delete message from queue after processing."""
        try:
            self.sqs_client.delete_message(
                QueueUrl=self.main_queue_url,
                ReceiptHandle=receipt_handle
            )
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete message: {str(e)}")
            return False

    async def _move_to_dlq(self, message: Dict):
        """Move failed message to Dead Letter Queue."""
        try:
            # Add failure metadata
            message['Metadata'] = {
                'failure_time': datetime.utcnow().isoformat(),
                'source_queue': self.main_queue_url
            }
            
            # Send to DLQ
            self.sqs_client.send_message(
                QueueUrl=self.dlq_url,
                MessageBody=json.dumps(message),
                MessageAttributes=message.get('MessageAttributes', {})
            )
            
            # Delete from main queue
            await self.delete_message(message['ReceiptHandle'])
            
        except Exception as e:
            logger.error(f"Failed to move message to DLQ: {str(e)}")

    async def process_dlq(self):
        """Process messages in Dead Letter Queue."""
        try:
            response = self.sqs_client.receive_message(
                QueueUrl=self.dlq_url,
                MaxNumberOfMessages=10,
                MessageAttributeNames=['All']
            )
            
            for message in response.get('Messages', []):
                try:
                    # Process DLQ message (implement retry logic)
                    await self._process_dlq_message(message)
                    
                    # Delete from DLQ if processed successfully
                    self.sqs_client.delete_message(
                        QueueUrl=self.dlq_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                    
                except Exception as e:
                    logger.error(
                        f"Failed to process DLQ message: {str(e)}"
                    )
                    
        except Exception as e:
            logger.error(f"Failed to process DLQ: {str(e)}")

    async def _process_dlq_message(self, message: Dict):
        """Process a single message from DLQ."""
        # TODO: Implement DLQ message processing logic
        pass 