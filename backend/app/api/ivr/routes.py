from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.ivr.schemas import (
    IVRRequestCreate,
    IVRRequestResponse,
    IVRApprovalCreate,
    IVREscalationCreate,
    IVRQueueParams,
    IVRQueueResponse,
    IVRBatchAction,
    IVRBatchResponse,
    IVRSessionCreate,
    IVRSessionUpdate,
    IVRSessionResponse,
    IVRDocumentCreate,
    IVRDocumentResponse
)
from app.api.ivr.models import IVRStatus
from app.api.ivr.workflow_service import IVRWorkflowService
from app.core.database import get_db
from app.core.security import get_current_user, require_permissions
from app.core.audit import audit_log
from app.models.ivr import IVRRequest, IVRSession, IVRDocument
from app.services.ivr_service import IVRService

router = APIRouter(prefix="/ivr", tags=["ivr"])

@router.post("/requests", response_model=IVRRequestResponse)
@audit_log("create_ivr_request")
async def create_ivr_request(
    request_data: IVRRequestCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Submit a new IVR request."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        ivr_request = workflow_service.create_ivr_request(request_data)
        return ivr_request
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/requests", response_model=IVRQueueResponse)
@audit_log("list_ivr_requests")
async def list_ivr_requests(
    queue_params: IVRQueueParams = Depends(),
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """List IVR requests with filtering and pagination."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        results = workflow_service.get_review_queue(queue_params, page, size)
        return IVRQueueResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/requests/{request_id}", response_model=IVRRequestResponse)
@audit_log("get_ivr_request")
async def get_ivr_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get specific IVR request details."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        ivr_request = workflow_service._get_ivr_request(request_id)
        return ivr_request
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/requests/{request_id}/status", response_model=IVRRequestResponse)
@audit_log("update_ivr_status")
async def update_ivr_status(
    request_id: str,
    new_status: IVRStatus,
    reason: str = None,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update IVR request status."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        ivr_request = workflow_service.update_ivr_status(request_id, new_status, reason)
        return ivr_request
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/requests/{request_id}/approve", response_model=IVRRequestResponse)
@audit_log("approve_ivr_request")
async def approve_ivr_request(
    request_id: str,
    approval_data: IVRApprovalCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Approve an IVR request."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        ivr_request = workflow_service.approve_request(request_id, approval_data)
        return ivr_request
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/requests/{request_id}/reject", response_model=IVRRequestResponse)
@audit_log("reject_ivr_request")
async def reject_ivr_request(
    request_id: str,
    approval_data: IVRApprovalCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Reject an IVR request."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        approval_data.decision = "rejected"
        ivr_request = workflow_service.approve_request(request_id, approval_data)
        return ivr_request
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/requests/{request_id}/escalate", response_model=IVRRequestResponse)
@audit_log("escalate_ivr_request")
async def escalate_ivr_request(
    request_id: str,
    escalation_data: IVREscalationCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Escalate an IVR request."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        ivr_request = workflow_service.escalate_request(request_id, escalation_data)
        return ivr_request
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/queue", response_model=IVRQueueResponse)
@audit_log("get_review_queue")
async def get_review_queue(
    queue_params: IVRQueueParams = Depends(),
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get IVR review queue with filtering."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        results = workflow_service.get_review_queue(queue_params, page, size)
        return IVRQueueResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batch-process", response_model=IVRBatchResponse)
@audit_log("batch_process_ivr")
async def batch_process_ivr(
    batch_action: IVRBatchAction,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Process batch actions on multiple IVR requests."""
    workflow_service = IVRWorkflowService(db, current_user)
    try:
        results = workflow_service.process_batch_action(batch_action)
        return IVRBatchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/sessions",
    response_model=IVRSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_session(
    session_data: IVRSessionCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> IVRSessionResponse:
    """Create a new IVR session."""
    ivr_service = IVRService(db)
    return await ivr_service.create_session(
        session_data,
        current_user
    )

@router.get(
    "/sessions/{session_id}",
    response_model=IVRSessionResponse
)
async def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> IVRSessionResponse:
    """Get IVR session details by ID."""
    ivr_service = IVRService(db)
    session = await ivr_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IVR session not found"
        )
    return session

@router.put(
    "/sessions/{session_id}",
    response_model=IVRSessionResponse
)
async def update_session(
    session_id: UUID,
    session_data: IVRSessionUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> IVRSessionResponse:
    """Update an existing IVR session."""
    ivr_service = IVRService(db)
    return await ivr_service.update_session(
        session_id,
        session_data,
        current_user
    ) 