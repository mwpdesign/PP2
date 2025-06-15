"""
Pydantic schemas for User Invitation System
Task ID: mbvu8p4nc9bidurxtvc
Phase 2: Service Layer Implementation

These schemas define the API request/response models for the invitation system.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID as PyUUID

from pydantic import BaseModel, EmailStr, Field, validator


# ==================== BASE SCHEMAS ====================

class InvitationBase(BaseModel):
    """Base invitation schema with common fields."""
    email: EmailStr = Field(..., description="Invitee's email address")
    invitation_type: str = Field(..., description="Type of invitation")
    role_name: str = Field(..., description="Role to assign to the user")
    first_name: Optional[str] = Field(None, description="Invitee's first name")
    last_name: Optional[str] = Field(None, description="Invitee's last name")
    invitation_message: Optional[str] = Field(
        None, description="Custom invitation message"
    )
    expires_in_days: int = Field(
        7, ge=1, le=30, description="Days until invitation expires"
    )

    @validator('invitation_type')
    def validate_invitation_type(cls, v):
        valid_types = [
            "doctor", "sales", "distributor", "master_distributor",
            "office_admin", "medical_staff", "ivr_company", "shipping_logistics",
            "admin", "chp_admin"
        ]
        if v not in valid_types:
            raise ValueError(
                f"Invalid invitation type. Must be one of: {valid_types}"
            )
        return v


# ==================== REQUEST SCHEMAS ====================

class InvitationCreateRequest(InvitationBase):
    """Schema for creating a new invitation."""
    organization_id: Optional[PyUUID] = Field(
        None, description="Organization ID"
    )

    # Hierarchy relationships (optional)
    parent_sales_id: Optional[PyUUID] = Field(
        None, description="Parent sales representative ID"
    )
    parent_distributor_id: Optional[PyUUID] = Field(
        None, description="Parent distributor ID"
    )
    parent_master_distributor_id: Optional[PyUUID] = Field(
        None, description="Parent master distributor ID"
    )
    parent_doctor_id: Optional[PyUUID] = Field(
        None, description="Parent doctor ID (for practice staff)"
    )


class DoctorInvitationRequest(BaseModel):
    """Schema for creating a doctor invitation."""
    email: EmailStr = Field(..., description="Doctor's email address")
    organization_id: PyUUID = Field(..., description="Organization ID")
    first_name: Optional[str] = Field(None, description="Doctor's first name")
    last_name: Optional[str] = Field(None, description="Doctor's last name")
    invitation_message: Optional[str] = Field(None, description="Custom invitation message")


class SalesInvitationRequest(BaseModel):
    """Schema for creating a sales representative invitation."""
    email: EmailStr = Field(..., description="Sales rep's email address")
    organization_id: PyUUID = Field(..., description="Organization ID")
    parent_distributor_id: Optional[PyUUID] = Field(None, description="Parent distributor ID")
    first_name: Optional[str] = Field(None, description="Sales rep's first name")
    last_name: Optional[str] = Field(None, description="Sales rep's last name")
    invitation_message: Optional[str] = Field(None, description="Custom invitation message")


class PracticeStaffInvitationRequest(BaseModel):
    """Schema for creating practice staff invitations."""
    email: EmailStr = Field(..., description="Staff member's email address")
    organization_id: PyUUID = Field(..., description="Organization ID")
    staff_role: str = Field(..., description="Staff role (office_admin or medical_staff)")
    first_name: Optional[str] = Field(None, description="Staff member's first name")
    last_name: Optional[str] = Field(None, description="Staff member's last name")
    invitation_message: Optional[str] = Field(None, description="Custom invitation message")

    @validator('staff_role')
    def validate_staff_role(cls, v):
        if v not in ["office_admin", "medical_staff"]:
            raise ValueError("Staff role must be 'office_admin' or 'medical_staff'")
        return v


class InvitationAcceptRequest(BaseModel):
    """Schema for accepting an invitation."""
    password: str = Field(..., min_length=8, description="User's password")
    first_name: Optional[str] = Field(None, description="User's first name (if not provided in invitation)")
    last_name: Optional[str] = Field(None, description="User's last name (if not provided in invitation)")
    phone: Optional[str] = Field(None, description="User's phone number")

    # Additional user profile fields can be added here
    additional_data: Optional[Dict[str, Any]] = Field(None, description="Additional user data")


class InvitationResendRequest(BaseModel):
    """Schema for resending an invitation."""
    extend_expiry: bool = Field(True, description="Whether to extend expiry if expired")


class InvitationCancelRequest(BaseModel):
    """Schema for cancelling an invitation."""
    reason: Optional[str] = Field(None, description="Reason for cancellation")


class InvitationExtendRequest(BaseModel):
    """Schema for extending invitation expiry."""
    days: int = Field(7, ge=1, le=30, description="Number of days to extend")


# ==================== RESPONSE SCHEMAS ====================

class InvitationResponse(BaseModel):
    """Schema for invitation response."""
    id: PyUUID = Field(..., description="Invitation ID")
    email: str = Field(..., description="Invitee's email address")
    invitation_type: str = Field(..., description="Type of invitation")
    role_name: str = Field(..., description="Role to assign")
    first_name: Optional[str] = Field(None, description="Invitee's first name")
    last_name: Optional[str] = Field(None, description="Invitee's last name")
    full_name: Optional[str] = Field(None, description="Invitee's full name")
    organization_id: Optional[PyUUID] = Field(None, description="Organization ID")
    status: str = Field(..., description="Invitation status")
    invited_by_id: Optional[PyUUID] = Field(None, description="ID of user who created invitation")
    invited_at: datetime = Field(..., description="When invitation was created")
    sent_at: Optional[datetime] = Field(None, description="When invitation was sent")
    accepted_at: Optional[datetime] = Field(None, description="When invitation was accepted")
    expires_at: datetime = Field(..., description="When invitation expires")
    invitation_message: Optional[str] = Field(None, description="Custom invitation message")
    email_attempts: int = Field(..., description="Number of email send attempts")
    email_delivery_status: Optional[str] = Field(None, description="Email delivery status")
    is_expired: bool = Field(..., description="Whether invitation has expired")
    is_pending: bool = Field(..., description="Whether invitation is pending")
    is_accepted: bool = Field(..., description="Whether invitation has been accepted")
    days_until_expiry: int = Field(..., description="Days until expiry")
    created_at: datetime = Field(..., description="When record was created")
    updated_at: datetime = Field(..., description="When record was last updated")

    class Config:
        from_attributes = True


class InvitationListResponse(BaseModel):
    """Schema for paginated invitation list response."""
    invitations: List[InvitationResponse] = Field(..., description="List of invitations")
    total_count: int = Field(..., description="Total number of invitations")
    limit: int = Field(..., description="Number of items per page")
    offset: int = Field(..., description="Number of items skipped")
    has_more: bool = Field(..., description="Whether there are more items")


class InvitationAcceptResponse(BaseModel):
    """Schema for invitation acceptance response."""
    invitation: InvitationResponse = Field(..., description="Accepted invitation")
    user_id: PyUUID = Field(..., description="Created user ID")
    message: str = Field(..., description="Success message")


class InvitationStatisticsResponse(BaseModel):
    """Schema for invitation statistics response."""
    total_invitations: int = Field(..., description="Total number of invitations")
    by_status: Dict[str, int] = Field(..., description="Count by status")
    by_type: Dict[str, int] = Field(..., description="Count by invitation type")
    acceptance_rate: float = Field(..., description="Acceptance rate percentage")
    average_acceptance_time_hours: float = Field(..., description="Average time to accept in hours")
    pending_count: int = Field(..., description="Number of pending invitations")
    expired_count: int = Field(..., description="Number of expired invitations")


# ==================== QUERY PARAMETER SCHEMAS ====================

class InvitationListParams(BaseModel):
    """Schema for invitation list query parameters."""
    organization_id: Optional[PyUUID] = Field(None, description="Filter by organization")
    invitation_type: Optional[str] = Field(None, description="Filter by invitation type")
    status: Optional[str] = Field(None, description="Filter by status")
    invited_by_id: Optional[PyUUID] = Field(None, description="Filter by inviter")
    limit: int = Field(50, ge=1, le=100, description="Number of items per page")
    offset: int = Field(0, ge=0, description="Number of items to skip")
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", description="Sort order (asc or desc)")

    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ["asc", "desc"]:
            raise ValueError("Sort order must be 'asc' or 'desc'")
        return v

    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = ["pending", "sent", "accepted", "expired", "cancelled", "failed"]
            if v not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
        return v


class InvitationStatisticsParams(BaseModel):
    """Schema for invitation statistics query parameters."""
    organization_id: Optional[PyUUID] = Field(None, description="Filter by organization")
    days: int = Field(30, ge=1, le=365, description="Number of days to include in statistics")


# ==================== ERROR SCHEMAS ====================

class InvitationErrorResponse(BaseModel):
    """Schema for invitation error responses."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


# ==================== BULK OPERATION SCHEMAS ====================

class BulkInvitationRequest(BaseModel):
    """Schema for bulk invitation creation."""
    invitations: List[InvitationCreateRequest] = Field(..., description="List of invitations to create")
    send_immediately: bool = Field(True, description="Whether to send invitations immediately")


class BulkInvitationResponse(BaseModel):
    """Schema for bulk invitation creation response."""
    created_invitations: List[InvitationResponse] = Field(..., description="Successfully created invitations")
    failed_invitations: List[Dict[str, Any]] = Field(..., description="Failed invitation attempts with errors")
    total_requested: int = Field(..., description="Total number of invitations requested")
    total_created: int = Field(..., description="Total number of invitations created")
    total_failed: int = Field(..., description="Total number of failed invitations")


class BulkOperationResponse(BaseModel):
    """Schema for bulk operation responses."""
    affected_count: int = Field(..., description="Number of items affected")
    message: str = Field(..., description="Operation result message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional operation details")


# ==================== INVITATION URL SCHEMA ====================

class InvitationUrlResponse(BaseModel):
    """Schema for invitation URL response."""
    invitation_url: str = Field(..., description="Complete invitation acceptance URL")
    token: str = Field(..., description="Invitation token")
    expires_at: datetime = Field(..., description="When invitation expires")


# ==================== EMAIL TEMPLATE SCHEMAS ====================

class InvitationEmailTemplate(BaseModel):
    """Schema for invitation email template data."""
    invitation_id: PyUUID = Field(..., description="Invitation ID")
    email: str = Field(..., description="Recipient email")
    first_name: Optional[str] = Field(None, description="Recipient first name")
    last_name: Optional[str] = Field(None, description="Recipient last name")
    invitation_type: str = Field(..., description="Type of invitation")
    role_name: str = Field(..., description="Role being invited to")
    organization_name: Optional[str] = Field(None, description="Organization name")
    inviter_name: Optional[str] = Field(None, description="Name of person who sent invitation")
    invitation_message: Optional[str] = Field(None, description="Custom invitation message")
    invitation_url: str = Field(..., description="Invitation acceptance URL")
    expires_at: datetime = Field(..., description="When invitation expires")
    days_until_expiry: int = Field(..., description="Days until expiry")


# ==================== VALIDATION SCHEMAS ====================

class InvitationValidationResponse(BaseModel):
    """Schema for invitation validation response."""
    is_valid: bool = Field(..., description="Whether invitation is valid")
    invitation: Optional[InvitationResponse] = Field(None, description="Invitation details if valid")
    error: Optional[str] = Field(None, description="Error message if invalid")
    can_accept: bool = Field(..., description="Whether invitation can be accepted")
    expires_in_hours: Optional[int] = Field(None, description="Hours until expiry")


# ==================== WEBHOOK SCHEMAS ====================

class InvitationWebhookPayload(BaseModel):
    """Schema for invitation webhook payloads."""
    event_type: str = Field(..., description="Type of event (created, sent, accepted, etc.)")
    invitation_id: PyUUID = Field(..., description="Invitation ID")
    invitation: InvitationResponse = Field(..., description="Invitation data")
    timestamp: datetime = Field(..., description="When event occurred")
    user_id: Optional[PyUUID] = Field(None, description="User ID if applicable")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional event metadata")