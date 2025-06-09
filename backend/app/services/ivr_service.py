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

from app.models.ivr import IVRSession, IVRRequest, IVRProduct, IVRProductSize
from app.schemas.ivr import (
    IVRSessionCreate, IVRSessionUpdate, IVRRequestCreate,
    ProductSelectionCreate
)
from app.core.exceptions import ValidationError

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
                    await self._create_ivr_product(ivr_request.id, product_data)

            await self.db.commit()
            await self.db.refresh(ivr_request)
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
                    selectinload(IVRRequest.products).selectinload(IVRProduct.sizes)
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
                    selectinload(IVRRequest.products).selectinload(IVRProduct.sizes)
                )
                .offset(skip)
                .limit(limit)
            )

            if filters:
                for field, value in filters.items():
                    if hasattr(IVRRequest, field):
                        query = query.where(getattr(IVRRequest, field) == value)

            result = await self.db.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error("Failed to list IVR requests: %s", str(e))
            raise

    async def update_ivr_request_status(
        self,
        request_id: UUID,
        new_status: str,
        metadata: Optional[Dict] = None
    ) -> Optional[IVRRequest]:
        """Update IVR request status and metadata."""
        try:
            ivr_request = await self.get_ivr_request(request_id)
            if not ivr_request:
                return None

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
            return ivr_request
        except Exception as e:
            logger.error("Failed to update IVR request status: %s", str(e))
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
                f"Invalid status transition from {session.status} to {new_status}"
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
