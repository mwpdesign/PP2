from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, constr, Field
from app.api.ivr.models import IVRStatus, IVRPriority
from uuid import UUID

# Base Schemas
class IVRRequestBase(BaseModel):
    patient_id: str
    provider_id: str
    facility_id: str
    territory_id: str
    service_type: str
    priority: IVRPriority = IVRPriority.MEDIUM
    notes: Optional[str] = None
    metadata: Optional[dict] = None

class IVRDocumentBase(BaseModel):
    document_type: str
    verification_notes: Optional[str] = None

class IVRReviewBase(BaseModel):
    notes: Optional[str] = None

class IVREscalationBase(BaseModel):
    escalated_to_id: str
    reason: str
    resolution_notes: Optional[str] = None

class IVRApprovalBase(BaseModel):
    decision: str
    reason: Optional[str] = None
    approval_level: int = 1

# Create Request Schemas
class IVRRequestCreate(IVRRequestBase):
    pass

class IVRDocumentCreate(IVRDocumentBase):
    pass

class IVRReviewCreate(IVRReviewBase):
    reviewer_id: str

class IVREscalationCreate(IVREscalationBase):
    pass

class IVRApprovalCreate(IVRApprovalBase):
    pass

# Response Schemas
class UserBrief(BaseModel):
    id: str
    name: str

    class Config:
        orm_mode = True

class IVRDocumentResponse(IVRDocumentBase):
    id: str
    ivr_request_id: str
    document_key: str
    status: str
    uploaded_by: UserBrief
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class IVRReviewResponse(IVRReviewBase):
    id: str
    ivr_request_id: str
    reviewer: UserBrief
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True

class IVREscalationResponse(IVREscalationBase):
    id: str
    ivr_request_id: str
    escalated_by: UserBrief
    escalated_to: UserBrief
    resolved: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        orm_mode = True

class IVRApprovalResponse(IVRApprovalBase):
    id: str
    ivr_request_id: str
    approver: UserBrief
    created_at: datetime

    class Config:
        orm_mode = True

class IVRStatusHistoryResponse(BaseModel):
    id: str
    from_status: Optional[IVRStatus]
    to_status: IVRStatus
    changed_by: UserBrief
    reason: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class IVRRequestResponse(IVRRequestBase):
    id: str
    status: IVRStatus
    current_reviewer: Optional[UserBrief]
    created_at: datetime
    updated_at: datetime
    documents: List[IVRDocumentResponse] = []
    reviews: List[IVRReviewResponse] = []
    escalations: List[IVREscalationResponse] = []
    approvals: List[IVRApprovalResponse] = []
    status_history: List[IVRStatusHistoryResponse] = []

    class Config:
        orm_mode = True

# Queue and Search Schemas
class IVRQueueParams(BaseModel):
    territory_id: Optional[str] = None
    facility_id: Optional[str] = None
    status: Optional[IVRStatus] = None
    priority: Optional[IVRPriority] = None
    reviewer_id: Optional[str] = None

class IVRQueueResponse(BaseModel):
    items: List[IVRRequestResponse]
    total: int
    page: int
    size: int

# Batch Processing Schemas
class IVRBatchAction(BaseModel):
    action: str  # assign, approve, reject
    request_ids: List[str]
    reviewer_id: Optional[str] = None
    notes: Optional[str] = None

class IVRBatchResponse(BaseModel):
    success: List[str]
    failed: dict  # request_id: error_message
    total_processed: int

# IVR session schemas
class IVRSessionItemBase(BaseModel):
    """Base schema for IVR session item data."""
    product_id: UUID
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    insurance_coverage: Optional[Dict] = None

class IVRSessionItemCreate(IVRSessionItemBase):
    """Schema for creating a new IVR session item."""
    pass

class IVRSessionItemResponse(IVRSessionItemBase):
    """Schema for IVR session item response data."""
    id: UUID
    session_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class IVRSessionBase(BaseModel):
    """Base schema for IVR session data."""
    patient_id: UUID
    provider_id: UUID
    territory_id: UUID
    insurance_data: Optional[Dict] = None
    metadata: Optional[Dict] = None

class IVRSessionCreate(IVRSessionBase):
    """Schema for creating a new IVR session."""
    items: List[IVRSessionItemCreate]

class IVRSessionUpdate(BaseModel):
    """Schema for updating an IVR session."""
    insurance_data: Optional[Dict] = None
    metadata: Optional[Dict] = None
    status: Optional[str] = Field(
        None,
        regex='^(pending|verified|approved|completed|cancelled)$'
    )

class IVRSessionResponse(IVRSessionBase):
    """Schema for IVR session response data."""
    id: UUID
    status: str
    items: List[IVRSessionItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 