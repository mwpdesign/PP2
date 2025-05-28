"""IVR request and session schemas."""
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from app.api.ivr.models import IVRStatus, IVRPriority
from uuid import UUID

# Base Schemas
class IVRRequestBase(BaseModel):
    """Base schema for IVR requests."""
    patient_id: UUID
    provider_id: UUID
    facility_id: UUID
    service_type: str = Field(..., max_length=100)
    priority: IVRPriority = Field(default=IVRPriority.MEDIUM)
    metadata: Optional[Dict] = Field(default_factory=dict)
    notes: Optional[str] = Field(default=None, max_length=1000)

class IVRDocumentBase(BaseModel):
    """Base schema for IVR documents."""
    ivr_request_id: UUID
    document_type: str = Field(..., max_length=50)
    document_key: str = Field(..., max_length=255)

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
    """Schema for creating IVR requests."""
    pass

class IVRDocumentCreate(IVRDocumentBase):
    """Schema for creating IVR documents."""
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
        from_attributes = True

class IVRDocumentResponse(IVRDocumentBase):
    id: UUID
    uploaded_by_id: UUID
    status: str = Field(default="pending", max_length=20)
    verification_notes: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IVRReviewResponse(IVRReviewBase):
    id: str
    ivr_request_id: str
    reviewer: UserBrief
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class IVREscalationResponse(IVREscalationBase):
    id: str
    ivr_request_id: str
    escalated_by: UserBrief
    escalated_to: UserBrief
    resolved: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

class IVRApprovalResponse(IVRApprovalBase):
    id: str
    ivr_request_id: str
    approver: UserBrief
    created_at: datetime

    class Config:
        from_attributes = True

class IVRStatusHistoryResponse(BaseModel):
    id: str
    from_status: Optional[IVRStatus]
    to_status: IVRStatus
    changed_by: UserBrief
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class IVRRequestResponse(IVRRequestBase):
    id: UUID
    status: IVRStatus
    current_reviewer_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    documents: List[IVRDocumentResponse] = []
    reviews: List[IVRReviewResponse] = []
    escalations: List[IVREscalationResponse] = []
    approvals: List[IVRApprovalResponse] = []
    status_history: List[IVRStatusHistoryResponse] = []

    class Config:
        from_attributes = True

# Queue and Search Schemas
class IVRQueueParams(BaseModel):
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
        from_attributes = True

class IVRSessionBase(BaseModel):
    """Base schema for IVR sessions."""
    patient_id: UUID
    provider_id: UUID
    status: str = Field(default="pending", max_length=20)
    insurance_data: Optional[Dict] = Field(default_factory=dict)
    metadata: Optional[Dict] = Field(default_factory=dict)

class IVRSessionCreate(IVRSessionBase):
    """Schema for creating IVR sessions."""
    items: List[IVRSessionItemCreate]

class IVRSessionUpdate(BaseModel):
    """Schema for updating an IVR session."""
    insurance_data: Optional[Dict] = None
    metadata: Optional[Dict] = None
    status: Optional[str] = Field(
        None,
        pattern='^(pending|verified|approved|completed|cancelled)$'
    )

class IVRSessionResponse(IVRSessionBase):
    """Schema for IVR session responses."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True