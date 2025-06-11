"""Pydantic schemas for practice delegation."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class StaffInvitationCreate(BaseModel):
    """Schema for creating a staff invitation."""

    email: EmailStr
    practice_role: str = Field(..., pattern="^(office_admin|medical_staff)$")
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)


class StaffInvitationResponse(BaseModel):
    """Schema for staff invitation response."""

    user_id: UUID
    email: str
    practice_role: str
    invitation_token: str
    invited_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    """Schema for accepting a staff invitation."""

    invitation_token: str
    password: str = Field(..., min_length=8)
    username: Optional[str] = Field(None, max_length=50)


class StaffMemberResponse(BaseModel):
    """Schema for staff member information."""

    id: UUID
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    practice_role: str
    is_active: bool
    created_at: datetime
    invited_at: Optional[datetime]
    parent_doctor_id: UUID

    class Config:
        from_attributes = True

    @property
    def full_name(self) -> str:
        """Get the staff member's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    @property
    def status(self) -> str:
        """Get the staff member's status."""
        return "active" if self.is_active else "invited"


class StaffMemberUpdate(BaseModel):
    """Schema for updating a staff member."""

    practice_role: Optional[str] = Field(
        None, pattern="^(office_admin|medical_staff)$"
    )
    is_active: Optional[bool] = None


class PracticeStatistics(BaseModel):
    """Schema for practice statistics."""

    total_staff: int
    active_staff: int
    office_admins: int
    medical_staff: int
    pending_invitations: int

    class Config:
        from_attributes = True


class PracticeScopeInfo(BaseModel):
    """Schema for practice scope information."""

    practice_doctor_id: UUID
    user_role: str
    can_manage_staff: bool
    is_staff_member: bool

    class Config:
        from_attributes = True


class StaffListResponse(BaseModel):
    """Schema for staff list response."""

    staff_members: List[StaffMemberResponse]
    statistics: PracticeStatistics

    class Config:
        from_attributes = True