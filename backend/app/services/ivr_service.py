"""
IVR session management service.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.ivr import (
    IVRSession, IVRRequest, IVRProduct, IVRProductSize, IVRCommunicationMessage
)
from app.schemas.ivr import (
    IVRSessionCreate, IVRSessionUpdate, IVRRequestCreate,
    ProductSelectionCreate
)
from app.core.exceptions import ValidationError
from app.services.websocket_service import websocket_manager

logger = logging.getLogger(__name__)


class IVRService:
    """Service for managing IVR sessions and requests."""

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

            for field, value in session_data.model_dump(
                exclude_unset=True
            ).items():
                setattr(ivr_session, field, value)
            ivr_session.updated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(ivr_session)
            return ivr_session
        except Exception as e:
            logger.error("Failed to update IVR session: %s", str(e))
            await self.db.rollback()
            raise

    async def create_ivr_request(
        self,
        request_data: IVRRequestCreate,
    ) -> IVRRequest:
        """Create a new IVR request with multi-size products."""
        try:
            # Create the main IVR request
            ivr_request = IVRRequest(
                patient_id=request_data.patient_id,
                provider_id=request_data.provider_id,
                facility_id=request_data.facility_id,
                service_type=request_data.service_type,
                priority=request_data.priority,
                request_metadata=request_data.request_metadata or {},
                notes=request_data.notes,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(ivr_request)
            await self.db.flush()  # Get the ID without committing

            # Create products and their sizes
            if request_data.selected_products:
                for product_data in request_data.selected_products:
                    await self._create_ivr_product(
                        ivr_request.id, product_data
                    )

            await self.db.commit()
            await self.db.refresh(ivr_request)

            # Broadcast IVR creation via WebSocket
            await self._broadcast_ivr_update(
                ivr_request,
                "created",
                {"message": "New IVR request created"}
            )

            return ivr_request
        except Exception as e:
            logger.error("Failed to create IVR request: %s", str(e))
            await self.db.rollback()
            raise

    async def _create_ivr_product(
        self,
        ivr_request_id: UUID,
        product_data: ProductSelectionCreate
    ) -> IVRProduct:
        """Create an IVR product with its sizes."""
        # Create the product
        ivr_product = IVRProduct(
            ivr_request_id=ivr_request_id,
            product_name=product_data.product_name,
            q_code=product_data.q_code,
            total_quantity=product_data.total_quantity,
            total_cost=product_data.total_cost,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(ivr_product)
        await self.db.flush()  # Get the ID without committing

        # Create the product sizes
        for size_data in product_data.sizes:
            ivr_product_size = IVRProductSize(
                ivr_product_id=ivr_product.id,
                size=size_data.size,
                dimensions=size_data.dimensions,
                unit_price=size_data.unit_price,
                quantity=size_data.quantity,
                total=size_data.total,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(ivr_product_size)

        return ivr_product

    async def get_ivr_request(self, request_id: UUID) -> Optional[IVRRequest]:
        """Get IVR request by ID with products and sizes."""
        try:
            result = await self.db.execute(
                select(IVRRequest)
                .options(
                    selectinload(IVRRequest.products).selectinload(
                        IVRProduct.sizes
                    )
                )
                .where(IVRRequest.id == request_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("Failed to get IVR request: %s", str(e))
            raise

    async def list_ivr_requests(
        self,
        filters: Optional[Dict] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[IVRRequest]:
        """List IVR requests with optional filters."""
        try:
            query = (
                select(IVRRequest)
                .options(
                    selectinload(IVRRequest.products).selectinload(
                        IVRProduct.sizes
                    )
                )
                .offset(skip)
                .limit(limit)
            )

            if filters:
                for field, value in filters.items():
                    if hasattr(IVRRequest, field):
                        query = query.where(
                            getattr(IVRRequest, field) == value
                        )

            result = await self.db.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error("Failed to list IVR requests: %s", str(e))
            raise

    async def update_ivr_request_status(
        self,
        request_id: UUID,
        new_status: str,
        metadata: Optional[Dict] = None,
        user_id: Optional[UUID] = None
    ) -> Optional[IVRRequest]:
        """Update IVR request status and metadata with WebSocket broadcast."""
        try:
            ivr_request = await self.get_ivr_request(request_id)
            if not ivr_request:
                return None

            # Store previous status for comparison
            previous_status = ivr_request.status

            # Update status
            ivr_request.status = new_status
            ivr_request.updated_at = datetime.utcnow()

            # Update metadata if provided
            if metadata:
                if ivr_request.request_metadata:
                    ivr_request.request_metadata.update(metadata)
                else:
                    ivr_request.request_metadata = metadata

            await self.db.commit()
            await self.db.refresh(ivr_request)

            # Broadcast status change via WebSocket
            await self._broadcast_ivr_update(
                ivr_request,
                "status_changed",
                {
                    "previous_status": previous_status,
                    "new_status": new_status,
                    "changed_by": str(user_id) if user_id else None,
                    "metadata": metadata
                }
            )

            return ivr_request
        except Exception as e:
            logger.error("Failed to update IVR request status: %s", str(e))
            await self.db.rollback()
            raise

    async def _broadcast_ivr_update(
        self,
        ivr_request: IVRRequest,
        update_type: str,
        additional_data: Optional[Dict] = None
    ) -> None:
        """Broadcast IVR update via WebSocket."""
        try:
            # Get organization ID from the request
            # For now, we'll use a default organization ID
            # In a real implementation, this would come from the user/request
            organization_id = UUID("00000000-0000-0000-0000-000000000001")

            # Prepare metadata
            broadcast_metadata = {
                "update_type": update_type,
                "ivr_id": str(ivr_request.id),
                "patient_id": str(ivr_request.patient_id),
                "provider_id": str(ivr_request.provider_id),
                "service_type": ivr_request.service_type,
                "priority": ivr_request.priority,
                "notes": ivr_request.notes,
                **(additional_data or {})
            }

            # Broadcast the update
            await websocket_manager.broadcast_ivr_status_update(
                ivr_id=str(ivr_request.id),
                status=ivr_request.status,
                organization_id=organization_id,
                metadata=broadcast_metadata
            )

            logger.info(
                "Broadcasted IVR update: id=%s, type=%s, status=%s",
                ivr_request.id,
                update_type,
                ivr_request.status
            )

        except Exception as e:
            logger.error(
                "Failed to broadcast IVR update: %s",
                str(e),
                exc_info=True
            )
            # Don't raise the exception as this is a non-critical operation

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
                f"Invalid status transition from {session.status} "
                f"to {new_status}"
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
                            getattr(IVRSession, field) == value
                        )

            result = await self.db.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error("Failed to list IVR sessions: %s", str(e))
            raise

    async def add_communication_message(
        self,
        ivr_request_id: UUID,
        author_id: UUID,
        message: str,
        author_type: str,
        author_name: str,
        message_type: str = "text",
        attachments: Optional[List[Dict]] = None
    ) -> IVRCommunicationMessage:
        """Add a communication message to an IVR request."""
        try:
            communication_message = IVRCommunicationMessage(
                ivr_request_id=ivr_request_id,
                author_id=author_id,
                message=message,
                message_type=message_type,
                author_type=author_type,
                author_name=author_name,
                attachments=attachments or [],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(communication_message)
            await self.db.commit()
            await self.db.refresh(communication_message)

            # Broadcast new communication message
            await self._broadcast_ivr_update(
                await self.get_ivr_request(ivr_request_id),
                "communication_added",
                {
                    "message_id": str(communication_message.id),
                    "author_type": author_type,
                    "author_name": author_name,
                    "message_type": message_type
                }
            )

            return communication_message
        except Exception as e:
            logger.error("Failed to add communication message: %s", str(e))
            await self.db.rollback()
            raise

    async def get_communication_messages(
        self,
        ivr_request_id: UUID
    ) -> List[IVRCommunicationMessage]:
        """Get all communication messages for an IVR request."""
        try:
            result = await self.db.execute(
                select(IVRCommunicationMessage)
                .where(
                    IVRCommunicationMessage.ivr_request_id == ivr_request_id
                )
                .order_by(IVRCommunicationMessage.created_at)
            )
            return result.scalars().all()
        except Exception as e:
            logger.error("Failed to get communication messages: %s", str(e))
            raise

    async def update_doctor_comment(
        self,
        request_id: UUID,
        comment: str
    ) -> Optional[IVRRequest]:
        """Update doctor comment for an IVR request."""
        try:
            ivr_request = await self.get_ivr_request(request_id)
            if not ivr_request:
                return None

            ivr_request.doctor_comment = comment
            ivr_request.comment_updated_at = datetime.utcnow()
            ivr_request.updated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(ivr_request)

            # Broadcast comment update
            await self._broadcast_ivr_update(
                ivr_request,
                "doctor_comment_updated",
                {"comment_length": len(comment)}
            )

            return ivr_request
        except Exception as e:
            logger.error("Failed to update doctor comment: %s", str(e))
            await self.db.rollback()
            raise

    async def update_ivr_response(
        self,
        request_id: UUID,
        response: str
    ) -> Optional[IVRRequest]:
        """Update IVR specialist response for an IVR request."""
        try:
            ivr_request = await self.get_ivr_request(request_id)
            if not ivr_request:
                return None

            ivr_request.ivr_response = response
            ivr_request.comment_updated_at = datetime.utcnow()
            ivr_request.updated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(ivr_request)

            # Broadcast response update
            await self._broadcast_ivr_update(
                ivr_request,
                "ivr_response_updated",
                {"response_length": len(response)}
            )

            return ivr_request
        except Exception as e:
            logger.error("Failed to update IVR response: %s", str(e))
            await self.db.rollback()
            raise
