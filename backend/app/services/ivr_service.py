"""
IVR session management service.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.ivr import IVRSession, IVRRequest
from app.schemas.ivr import IVRSessionCreate, IVRSessionUpdate
from app.core.exceptions import (
    NotFoundException,
    ValidationError,
    UnauthorizedError,
)
from app.core.security import verify_territory_access

logger = logging.getLogger(__name__)


class IVRService:
    """Service for managing IVR sessions."""

    def __init__(self, db: AsyncSession):
        """Initialize IVR service."""
        self.db = db

    async def get_session(self, session_id: UUID) -> Optional[IVRSession]:
        """Get IVR session by ID."""
        try:
            result = await self.db.execute(
                select(IVRSession).where(IVRSession.id == session_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("Failed to get IVR session: %s", str(e))
            raise

    async def create_session(
        self,
        session_data: IVRSessionCreate,
    ) -> IVRSession:
        """Create a new IVR session."""
        try:
            ivr_session = IVRSession(
                **session_data.model_dump(exclude_unset=True),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(ivr_session)
            await self.db.commit()
            await self.db.refresh(ivr_session)
            return ivr_session
        except Exception as e:
            logger.error("Failed to create IVR session: %s", str(e))
            await self.db.rollback()
            raise

    async def update_session(
        self,
        session_id: UUID,
        session_data: IVRSessionUpdate,
    ) -> Optional[IVRSession]:
        """Update an existing IVR session."""
        try:
            ivr_session = await self.get_session(session_id)
            if not ivr_session:
                return None

            for field, value in session_data.model_dump(exclude_unset=True).items():
                setattr(ivr_session, field, value)
            ivr_session.updated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(ivr_session)
            return ivr_session
        except Exception as e:
            logger.error("Failed to update IVR session: %s", str(e))
            await self.db.rollback()
            raise

    async def _validate_status_transition(
        self, session: IVRSession, new_status: str
    ) -> None:
        """Validate if status transition is allowed."""
        valid_transitions = {
            "pending": ["verified", "cancelled"],
            "verified": ["approved", "cancelled"],
            "approved": ["completed", "cancelled"],
            "completed": [],
            "cancelled": [],
        }

        if new_status not in valid_transitions.get(session.status, []):
            raise ValidationError(
                f"Invalid status transition from " f"{session.status} to {new_status}"
            )

    async def delete_session(self, session_id: UUID) -> bool:
        """Delete an IVR session."""
        try:
            ivr_session = await self.get_session(session_id)
            if not ivr_session:
                return False

            await self.db.delete(ivr_session)
            await self.db.commit()
            return True
        except Exception as e:
            logger.error("Failed to delete IVR session: %s", str(e))
            await self.db.rollback()
            raise

    async def list_sessions(
        self, organization_id: UUID, filters: Optional[Dict] = None
    ) -> List[IVRSession]:
        """List IVR sessions with optional filters."""
        try:
            query = select(IVRSession).where(
                IVRSession.organization_id == organization_id
            )

            if filters:
                for field, value in filters.items():
                    if hasattr(IVRSession, field):
                        query = query.where(
                            getattr(IVRSession,
                            field) == value
                        )

            result = await self.db.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error("Failed to list IVR sessions: %s", str(e))
            raise
