"""Document service module for healthcare IVR platform."""
from datetime import datetime
from typing import Optional, List, Dict
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.provider import ProviderCredentials
from app.services.s3_service import S3Service


class DocumentService:
    """Service for document-related operations."""

    def __init__(self, db: AsyncSession):
        """Initialize document service with database session."""
        self.db = db
        self.s3_service = S3Service()

    async def upload_document(
        self,
        file_data: bytes,
        filename: str,
        user_id: str,
        document_type: str,
        territory_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Upload a document to secure storage.
        Uses S3 with server-side encryption for HIPAA compliance.
        """
        # Generate unique S3 key
        date_path = datetime.utcnow().strftime('%Y/%m/%d')
        s3_key = f"documents/{document_type}/{date_path}/{uuid4()}/{filename}"

        # Add required metadata
        doc_metadata = {
            'user_id': user_id,
            'document_type': document_type,
            'original_filename': filename,
            'territory_id': territory_id,
            **(metadata or {})
        }

        # Upload to S3
        result = await self.s3_service.upload_file(
            file_content=file_data,
            s3_key=s3_key,
            content_type='application/octet-stream',
            metadata=doc_metadata
        )

        return {
            'document_id': result['s3_key'],
            'metadata': doc_metadata
        }

    async def get_document(
        self,
        document_id: str,
        user_id: str,
        territory_id: Optional[str] = None
    ) -> Dict:
        """
        Retrieve document by ID with access control.
        Includes audit logging for HIPAA compliance.
        """
        try:
            return await self.s3_service.download_file(
                s3_key=document_id,
                user_id=user_id,
                territory_id=territory_id
            )
        except HTTPException as e:
            if e.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Document not found"
                )
            raise

    async def delete_document(
        self,
        document_id: str,
        user_id: str
    ) -> None:
        """
        Delete document from storage.
        Ensures proper cleanup of PHI data.
        """
        await self.s3_service.delete_file(document_id)

    async def get_provider_documents(
        self,
        provider_id: str
    ) -> List[Dict]:
        """Get all documents associated with a provider."""
        query = select(ProviderCredentials).where(
            ProviderCredentials.provider_id == provider_id
        )
        result = await self.db.execute(query)
        credentials = result.scalars().all()

        documents = []
        for cred in credentials:
            if cred.document_key:
                try:
                    doc_metadata = await self.s3_service.list_files(
                        prefix=cred.document_key
                    )
                    documents.extend(doc_metadata.get('files', []))
                except HTTPException:
                    continue

        return documents