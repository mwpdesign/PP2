"""
IVR session management service.
"""
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ivr import IVRSession, IVRRequest
from app.schemas.ivr import (
    IVRSessionCreate,
    IVRSessionUpdate
)
from app.core.exceptions import (
    NotFoundException,
    ValidationError,
    UnauthorizedError
)
from app.core.security import verify_territory_access


class IVRService:
    """Service for managing IVR sessions."""

    def __init__(self, db: Session):
        """Initialize IVR service."""
        self.db = db

    async def get_session(self, session_id: UUID) -> Optional[IVRSession]:
        """Get IVR session by ID."""
        session = self.db.query(IVRSession).filter(
            IVRSession.id == session_id
        ).first()
        
        if not session:
            raise NotFoundException("IVR session not found")
        
        return session

    async def create_session(
        self,
        session_data: IVRSessionCreate,
        current_user: Dict[str, Any]
    ) -> IVRSession:
        """Create a new IVR session."""
        # Verify territory access
        if not verify_territory_access(
            current_user,
            session_data.territory_id
        ):
            raise UnauthorizedError(
                "No access to specified territory"
            )

        # Create session
        session = IVRSession(
            patient_id=session_data.patient_id,
            provider_id=session_data.provider_id,
            territory_id=session_data.territory_id,
            status='pending',
            insurance_data=session_data.insurance_data,
            session_metadata=session_data.session_metadata
        )
        self.db.add(session)

        # Create session items
        for item_data in session_data.items:
            item = IVRRequest(
                session_id=session.id,
                service_type=item_data.service_type,
                priority=item_data.priority,
                notes=item_data.notes,
                request_metadata=item_data.request_metadata
            )
            self.db.add(item)

        # Commit transaction
        try:
            self.db.commit()
            self.db.refresh(session)
            return session
        except Exception as e:
            self.db.rollback()
            raise ValidationError(
                f"Failed to create IVR session: {str(e)}"
            )

    async def update_session(
        self,
        session_id: UUID,
        session_data: IVRSessionUpdate,
        current_user: Dict[str, Any]
    ) -> IVRSession:
        """Update an existing IVR session."""
        # Get session
        session = await self.get_session(session_id)

        # Verify territory access
        if not verify_territory_access(
            current_user,
            session.territory_id
        ):
            raise UnauthorizedError(
                "No access to session's territory"
            )

        # Validate status transition
        if session_data.status:
            await self._validate_status_transition(
                session,
                session_data.status
            )

        # Update fields
        if session_data.insurance_data is not None:
            session.insurance_data = session_data.insurance_data
        if session_data.session_metadata is not None:
            session.session_metadata = session_data.session_metadata
        if session_data.status is not None:
            session.status = session_data.status

        # Commit changes
        try:
            self.db.commit()
            self.db.refresh(session)
            return session
        except Exception as e:
            self.db.rollback()
            raise ValidationError(
                f"Failed to update IVR session: {str(e)}"
            )

    async def _validate_status_transition(
        self,
        session: IVRSession,
        new_status: str
    ) -> None:
        """Validate if status transition is allowed."""
        valid_transitions = {
            'pending': ['verified', 'cancelled'],
            'verified': ['approved', 'cancelled'],
            'approved': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        }

        if new_status not in valid_transitions.get(session.status, []):
            raise ValidationError(
                f"Invalid status transition from "
                f"{session.status} to {new_status}"
            ) 