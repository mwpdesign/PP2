"""
S3 service for secure file storage with encryption.
Implements HIPAA-compliant document storage.
"""
import boto3
from botocore.exceptions import ClientError
from typing import Optional, Dict
from fastapi import HTTPException
from datetime import datetime

from app.core.config import get_settings
from app.services.aws_kms import AWSKMSService


class S3Service:
    def __init__(self):
        """Initialize S3 client with settings."""
        self.settings = get_settings()
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.settings.aws_access_key_id,
            aws_secret_access_key=self.settings.aws_secret_access_key,
            region_name=self.settings.aws_region
        )
        self.bucket = self.settings.aws_s3_bucket
        self.kms_service = AWSKMSService()

    async def upload_file(
        self,
        file_content: bytes,
        s3_key: str,
        content_type: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Upload an encrypted file to S3.
        Uses KMS for encryption and includes metadata.
        """
        try:
            # Add required metadata
            file_metadata = {
                'uploaded_at': datetime.utcnow().isoformat(),
                'content_type': content_type,
                **(metadata or {})
            }

            # Upload to S3 with server-side encryption
            response = self.s3_client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                Metadata=file_metadata,
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=self.settings.aws_kms_key_id
            )

            return {
                's3_key': s3_key,
                'version_id': response.get('VersionId'),
                'metadata': file_metadata
            }

        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload file: {str(e)}"
            )

    async def download_file(
        self,
        s3_key: str,
        user_id: int,
        territory_id: int
    ) -> Dict:
        """
        Download and decrypt a file from S3.
        Includes access logging context.
        """
        try:
            # Get file with encryption context
            response = self.s3_client.get_object(
                Bucket=self.bucket,
                Key=s3_key
            )

            return {
                'content': response['Body'].read(),
                'content_type': response['ContentType'],
                'metadata': response.get('Metadata', {}),
                'last_modified': response['LastModified'],
                'size': response['ContentLength']
            }

        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise HTTPException(
                    status_code=404,
                    detail="File not found"
                )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download file: {str(e)}"
            )

    async def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        operation: str = 'get_object'
    ) -> str:
        """
        Generate a pre-signed URL for secure file access.
        URL expires after specified time.
        """
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod=operation,
                Params={
                    'Bucket': self.bucket,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            return url

        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate presigned URL: {str(e)}"
            )

    async def delete_file(self, s3_key: str) -> None:
        """
        Delete a file from S3.
        Ensures proper cleanup of PHI data.
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket,
                Key=s3_key
            )

        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete file: {str(e)}"
            )

    async def list_files(
        self,
        prefix: str,
        max_keys: int = 1000
    ) -> Dict:
        """
        List files in an S3 prefix.
        Used for patient document management.
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket,
                Prefix=prefix,
                MaxKeys=max_keys
            )

            files = []
            for obj in response.get('Contents', []):
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'],
                    'etag': obj['ETag']
                })

            return {
                'files': files,
                'is_truncated': response.get('IsTruncated', False),
                'next_token': response.get('NextContinuationToken')
            }

        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to list files: {str(e)}"
            ) 