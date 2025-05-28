"""IVR workflow service."""
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.ivr.models import (
    IVRRequest,
    IVRStatus,
    IVRStatusHistory,
    IVRApproval,
    IVREscalation,
    IVRReview,
)
from app.api.ivr.schemas import (
    IVRRequestCreate,
    IVRApprovalCreate,
    IVREscalationCreate,
    IVRQueueParams,
    IVRBatchAction,
)
from app.services.notification_service import NotificationService
from app.core.exceptions import (
    NotFoundException,
    ValidationError,
)


class IVRWorkflowService:
    """Service for managing IVR workflows."""

    def __init__(self, db: AsyncSession):
        """Initialize IVR workflow service."""
        self.db = db
        self.notification_service = NotificationService()

    async def get_request(self, request_id: UUID) -> Optional[IVRRequest]:
        """Get IVR request by ID."""
        request = await self.db.get(IVRRequest, request_id)

        if not request:
            raise NotFoundException("IVR request not found")

        return request

    async def create_request(
        self,
        request_data: Dict[str, Any],
        current_user: Dict[str, Any]
    ) -> IVRRequest:
        """Create a new IVR request."""
        # Create request
        request = IVRRequest(
            patient_id=request_data["patient_id"],
            provider_id=request_data["provider_id"],
            facility_id=request_data["facility_id"],
            service_type=request_data["service_type"],
            priority=request_data["priority"],
            status="pending",
            request_metadata=request_data.get("request_metadata"),
            notes=request_data.get("notes"),
            created_by=current_user["id"],
            updated_by=current_user["id"]
        )
        self.db.add(request)

        # Commit transaction
        try:
            await self.db.commit()
            await self.db.refresh(request)
            return request
        except Exception as e:
            await self.db.rollback()
            raise ValidationError(
                f"Failed to create IVR request: {str(e)}"
            )

    async def update_request(
        self,
        request_id: UUID,
        request_data: Dict[str, Any],
        current_user: Dict[str, Any]
    ) -> IVRRequest:
        """Update an existing IVR request."""
        # Get request
        request = await self.get_request(request_id)

        # Validate status transition
        if request_data.get("status"):
            await self._validate_status_transition(
                request,
                request_data["status"]
            )

        # Update fields
        for field, value in request_data.items():
            if value is not None:
                setattr(request, field, value)

        # Update audit field
        request.updated_by = current_user["id"]

        # Commit changes
        try:
            await self.db.commit()
            await self.db.refresh(request)
            return request
        except Exception as e:
            await self.db.rollback()
            raise ValidationError(
                f"Failed to update IVR request: {str(e)}"
            )

    async def _validate_status_transition(
        self,
        request: IVRRequest,
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

        if new_status not in valid_transitions.get(request.status, []):
            raise ValidationError(
                f"Invalid status transition from "
                f"{request.status} to {new_status}"
            )

    def create_ivr_request(
        self,
        request_data: IVRRequestCreate
    ) -> IVRRequest:
        """Create a new IVR request with initial validation."""
        # Create IVR request
        ivr_request = IVRRequest(**request_data.dict())
        self.db.add(ivr_request)

        # Create initial status history
        status_history = IVRStatusHistory(
            ivr_request=ivr_request,
            to_status=IVRStatus.SUBMITTED,
            changed_by_id=self.current_user["id"],
        )
        self.db.add(status_history)

        self.db.commit()
        self.db.refresh(ivr_request)

        # Send notifications
        self._notify_submission(ivr_request)
        return ivr_request

    def update_ivr_status(
        self,
        request_id: str,
        new_status: IVRStatus,
        reason: Optional[str] = None
    ) -> IVRRequest:
        """Update IVR request status with history tracking."""
        ivr_request = self._get_ivr_request(request_id)

        # Create status history
        status_history = IVRStatusHistory(
            ivr_request=ivr_request,
            from_status=ivr_request.status,
            to_status=new_status,
            changed_by_id=self.current_user["id"],
            reason=reason,
        )
        self.db.add(status_history)

        # Update request status
        ivr_request.status = new_status
        ivr_request.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(ivr_request)

        # Send notifications
        self._notify_status_change(ivr_request, status_history)
        return ivr_request

    def assign_reviewer(self, request_id: str, reviewer_id: str) -> IVRRequest:
        """Assign a reviewer to an IVR request."""
        ivr_request = self._get_ivr_request(request_id)

        # Create review assignment
        review = IVRReview(
            ivr_request=ivr_request,
            reviewer_id=reviewer_id,
            status="assigned",
        )
        self.db.add(review)

        # Update request status and reviewer
        ivr_request.current_reviewer_id = reviewer_id
        ivr_request.status = IVRStatus.IN_REVIEW
        ivr_request.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(ivr_request)

        # Send notifications
        self._notify_reviewer_assignment(ivr_request, reviewer_id)
        return ivr_request

    def approve_request(
        self, request_id: str, approval_data: IVRApprovalCreate
    ) -> IVRRequest:
        """Approve an IVR request with optional multi-level approval."""
        ivr_request = self._get_ivr_request(request_id)

        # Create approval record
        approval = IVRApproval(
            ivr_request=ivr_request,
            approver_id=self.current_user["id"],
            **approval_data.dict(),
        )
        self.db.add(approval)

        # Update request status based on approval level
        if approval_data.approval_level == 1:
            ivr_request.status = IVRStatus.APPROVED
            ivr_request.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(ivr_request)

        # Send notifications
        self._notify_approval(ivr_request, approval)
        return ivr_request

    def escalate_request(
        self,
        request_id: str,
        escalation_data: IVREscalationCreate
    ) -> IVRRequest:
        """Escalate an IVR request to a higher authority."""
        ivr_request = self._get_ivr_request(request_id)

        # Create escalation record
        escalation = IVREscalation(
            ivr_request=ivr_request,
            escalated_by_id=self.current_user["id"],
            **escalation_data.dict(),
        )
        self.db.add(escalation)

        # Update request status
        ivr_request.status = IVRStatus.ESCALATED
        ivr_request.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(ivr_request)

        # Send notifications
        self._notify_escalation(ivr_request, escalation)
        return ivr_request

    def get_review_queue(
        self,
        queue_params: IVRQueueParams,
        page: int = 1,
        size: int = 20
    ) -> Dict:
        """Get IVR requests queue with filtering and pagination."""
        query = self.db.query(IVRRequest)

        # Apply filters
        if queue_params.facility_id:
            query = query.filter(
                IVRRequest.facility_id == queue_params.facility_id
            )

        if queue_params.status:
            query = query.filter(IVRRequest.status == queue_params.status)

        if queue_params.priority:
            query = query.filter(
                IVRRequest.priority == queue_params.priority
            )

        if queue_params.reviewer_id:
            query = query.filter(
                IVRRequest.current_reviewer_id == queue_params.reviewer_id
            )

        # Apply pagination
        total = query.count()
        items = query.offset((page - 1) * size).limit(size).all()

        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
        }

    def process_batch_action(
        self,
        batch_action: IVRBatchAction
    ) -> Dict:
        """Process batch actions on multiple IVR requests."""
        success = []
        failed = {}

        for request_id in batch_action.request_ids:
            try:
                if batch_action.action == "assign":
                    self.assign_reviewer(
                        request_id,
                        batch_action.reviewer_id
                    )
                elif batch_action.action == "approve":
                    self.approve_request(
                        request_id,
                        IVRApprovalCreate(
                            decision="approved",
                            reason=batch_action.notes
                        )
                    )
                elif batch_action.action == "reject":
                    self.approve_request(
                        request_id,
                        IVRApprovalCreate(
                            decision="rejected",
                            reason=batch_action.notes
                        )
                    )
                success.append(request_id)
            except Exception as e:
                failed[request_id] = str(e)

        return {
            "success": success,
            "failed": failed,
            "total_processed": len(
                batch_action.request_ids
            )
        }

    def _get_ivr_request(
        self,
        request_id: str
    ) -> IVRRequest:
        """Get IVR request."""
        ivr_request = (
            self.db.query(IVRRequest)
            .filter_by(id=request_id)
            .first()
        )
        if not ivr_request:
            raise NotFoundException("IVR request not found")

        return ivr_request

    def _notify_submission(
        self,
        ivr_request: IVRRequest
    ):
        """Send notifications for new IVR submission."""
        self.notification_service.notify_new_ivr(ivr_request)

    def _notify_status_change(
        self, ivr_request: IVRRequest, status_history: IVRStatusHistory
    ):
        """Send notifications for IVR status changes."""
        self.notification_service.notify_status_change(ivr_request, status_history)

    def _notify_reviewer_assignment(self, ivr_request: IVRRequest, reviewer_id: str):
        """Send notifications for reviewer assignment."""
        self.notification_service.notify_reviewer_assignment(ivr_request, reviewer_id)

    def _notify_approval(self, ivr_request: IVRRequest, approval: IVRApproval):
        """Send notifications for IVR approval/rejection."""
        self.notification_service.notify_approval(ivr_request, approval)

    def _notify_escalation(self, ivr_request: IVRRequest, escalation: IVREscalation):
        """Send notifications for IVR escalation."""
        self.notification_service.notify_escalation(ivr_request, escalation)