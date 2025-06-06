"""
Pydantic schemas for delegation management endpoints.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DelegationCreate(BaseModel):
    """Schema for creating a new delegation permission."""

    delegator_id: UUID = Field(..., description="User delegating permissions")
    delegate_id: UUID = Field(..., description="User receiving delegation")
    permissions: List[str] = Field(
        ...,
        description="List of permissions being delegated",
        min_items=1
    )
    organization_id: UUID = Field(..., description="Organization context")
    expires_at: Optional[datetime] = Field(
        None,
        description="When delegation expires (optional)"
    )
    requires_approval: bool = Field(
        False,
        description="Whether delegated actions need approval"
    )
    delegation_reason: Optional[str] = Field(
        None,
        description="Reason for delegation",
        max_length=500
    )
    scope_restrictions: Optional[Dict[str, Any]] = Field(
        None,
        description="Restrictions on delegation scope"
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes",
        max_length=1000
    )


class DelegationUpdate(BaseModel):
    """Schema for updating delegation permission."""

    permissions: Optional[List[str]] = Field(
        None,
        description="Updated list of permissions"
    )
    expires_at: Optional[datetime] = Field(
        None,
        description="Updated expiration date"
    )
    requires_approval: Optional[bool] = Field(
        None,
        description="Updated approval requirement"
    )
    delegation_reason: Optional[str] = Field(
        None,
        description="Updated reason for delegation",
        max_length=500
    )
    scope_restrictions: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated scope restrictions"
    )
    notes: Optional[str] = Field(
        None,
        description="Updated notes",
        max_length=1000
    )


class DelegationValidate(BaseModel):
    """Schema for validating delegation permission."""

    delegate_id: UUID = Field(..., description="User attempting delegation")
    permission: str = Field(..., description="Permission being checked")
    delegator_id: Optional[UUID] = Field(
        None,
        description="Specific delegator (optional)"
    )


class ProxySubmission(BaseModel):
    """Schema for submitting actions on behalf of another user."""

    delegate_id: UUID = Field(..., description="User performing the action")
    delegator_id: UUID = Field(
        ...,
        description="User on whose behalf action is performed"
    )
    action: str = Field(..., description="Action being performed")
    resource_data: Dict[str, Any] = Field(
        ...,
        description="Data for the action"
    )
    delegation_context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Context about the delegation"
    )


class UserInfo(BaseModel):
    """Schema for user information in delegation responses."""

    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    organization_id: UUID


class DelegationResponse(BaseModel):
    """Schema for delegation permission response."""

    id: UUID
    delegator_id: UUID
    delegate_id: UUID
    organization_id: UUID
    permissions: List[str]
    scope_restrictions: Dict[str, Any]
    expires_at: Optional[datetime]
    requires_approval: bool
    delegation_reason: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    created_by_id: UUID
    approved_at: Optional[datetime]
    approved_by_id: Optional[UUID]
    revoked_at: Optional[datetime]
    revoked_by_id: Optional[UUID]

    # Related user information (when loaded)
    delegator: Optional[UserInfo] = None
    delegate: Optional[UserInfo] = None

    class Config:
        from_attributes = True


class DelegationListResponse(BaseModel):
    """Schema for delegation list response."""

    delegations: List[DelegationResponse]
    total_count: int
    page: int = 1
    page_size: int = 20


class DelegationValidationResponse(BaseModel):
    """Schema for delegation validation response."""

    is_valid: bool
    delegation_id: Optional[UUID] = None
    delegator_id: Optional[UUID] = None
    permissions: List[str] = Field(default_factory=list)
    scope_restrictions: Dict[str, Any] = Field(default_factory=dict)
    requires_approval: bool = False
    delegation_reason: Optional[str] = None
    message: Optional[str] = None


class ProxySubmissionResponse(BaseModel):
    """Schema for proxy submission response."""

    success: bool
    delegation_id: UUID
    delegator_id: UUID
    delegate_id: UUID
    on_behalf_of: bool = True
    delegation_reason: Optional[str]
    requires_approval: bool
    message: Optional[str] = None


class DelegationApproval(BaseModel):
    """Schema for delegation approval."""

    approved: bool = True
    approval_notes: Optional[str] = Field(
        None,
        description="Notes about the approval",
        max_length=500
    )


class DelegationStats(BaseModel):
    """Schema for delegation statistics."""

    total_delegations: int
    active_delegations: int
    pending_approval: int
    expired_delegations: int
    delegations_given: int
    delegations_received: int


class DelegationAuditEntry(BaseModel):
    """Schema for delegation audit trail entry."""

    id: UUID
    action: str
    delegation_id: UUID
    user_id: UUID
    timestamp: datetime
    details: Dict[str, Any]
    ip_address: Optional[str]
    user_agent: Optional[str]

    class Config:
        from_attributes = True


class DelegationAuditResponse(BaseModel):
    """Schema for delegation audit trail response."""

    audit_entries: List[DelegationAuditEntry]
    total_count: int
    page: int = 1
    page_size: int = 20