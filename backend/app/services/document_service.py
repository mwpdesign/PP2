"""Document management service."""

import logging
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate

logger = logging.getLogger(__name__)


async def create_document(
    session: AsyncSession,
    organization_id: UUID,
    document_data: DocumentCreate,
) -> Document:
    """Create a new document."""
    try:
        document = Document(
            organization_id=organization_id,
            **document_data.model_dump(exclude_unset=True),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(document)
        await session.commit()
        await session.refresh(document)
        return document
    except Exception as e:
        logger.error("Failed to create document: %s", str(e))
        await session.rollback()
        raise


async def get_document(
    session: AsyncSession,
    document_id: UUID,
) -> Optional[Document]:
    """Get a document by ID."""
    try:
        result = await session.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error("Failed to get document: %s", str(e))
        raise


async def update_document(
    session: AsyncSession,
    document_id: UUID,
    document_data: DocumentUpdate,
) -> Optional[Document]:
    """Update a document."""
    try:
        document = await get_document(session, document_id)
        if not document:
            return None

        for field, value in document_data.model_dump(exclude_unset=True).items():
            setattr(document, field, value)
        document.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(document)
        return document
    except Exception as e:
        logger.error("Failed to update document: %s", str(e))
        await session.rollback()
        raise


async def delete_document(
    session: AsyncSession,
    document_id: UUID,
) -> bool:
    """Delete a document."""
    try:
        document = await get_document(session, document_id)
        if not document:
            return False

        await session.delete(document)
        await session.commit()
        return True
    except Exception as e:
        logger.error("Failed to delete document: %s", str(e))
        await session.rollback()
        raise


async def list_documents(
    session: AsyncSession,
    organization_id: UUID,
    filters: Optional[Dict] = None,
) -> List[Document]:
    """List documents with optional filters."""
    try:
        query = select(Document).where(Document.organization_id == organization_id)

        if filters:
            for field, value in filters.items():
                if hasattr(Document, field):
                    query = query.where(getattr(Document, field) == value)

        result = await session.execute(query)
        return result.scalars().all()
    except Exception as e:
        logger.error("Failed to list documents: %s", str(e))
        raise
