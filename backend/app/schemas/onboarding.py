"""Onboarding schemas for the healthcare IVR platform."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from uuid import UUID


class OnboardingStepBase(BaseModel):
    """Base schema for onboarding steps."""
    step_name: str = Field(..., description="Name of the onboarding step")
    step_order: int = Field(
        ..., description="Order of the step in the sequence"
    )
    completed: bool = Field(
        default=False, description="Whether step is completed"
    )
    data: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Additional step data"
    )


class OnboardingStepCreate(OnboardingStepBase):
    """Schema for creating onboarding steps."""
    user_id: UUID = Field(..., description="User ID for the onboarding step")


class OnboardingStepUpdate(BaseModel):
    """Schema for updating onboarding steps."""
    completed: Optional[bool] = Field(
        None, description="Whether step is completed"
    )
    data: Optional[Dict[str, Any]] = Field(
        None, description="Additional step data"
    )


class OnboardingStepResponse(OnboardingStepBase):
    """Schema for onboarding step responses."""
    id: UUID = Field(..., description="Unique identifier for the step")
    user_id: UUID = Field(..., description="User ID for the onboarding step")
    completed_at: Optional[datetime] = Field(None, description="When step was completed")
    created_at: datetime = Field(..., description="When step was created")
    updated_at: datetime = Field(..., description="When step was last updated")

    class Config:
        from_attributes = True


class OnboardingProgressResponse(BaseModel):
    """Schema for overall onboarding progress."""
    user_id: UUID = Field(..., description="User ID")
    total_steps: int = Field(..., description="Total number of onboarding steps")
    completed_steps: int = Field(..., description="Number of completed steps")
    current_step: Optional[str] = Field(None, description="Current step name")
    progress_percentage: float = Field(..., description="Progress as percentage")
    onboarding_completed: bool = Field(..., description="Whether onboarding is complete")
    onboarding_started_at: Optional[datetime] = Field(None, description="When onboarding started")
    onboarding_completed_at: Optional[datetime] = Field(None, description="When onboarding completed")
    steps: List[OnboardingStepResponse] = Field(..., description="List of onboarding steps")

    class Config:
        from_attributes = True


class OnboardingStartRequest(BaseModel):
    """Schema for starting onboarding."""
    skip_welcome: bool = Field(default=False, description="Whether to skip welcome step")


class OnboardingCompleteRequest(BaseModel):
    """Schema for completing onboarding."""
    feedback: Optional[str] = Field(None, description="User feedback about onboarding")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1-5")


class RoleOnboardingConfig(BaseModel):
    """Schema for role-specific onboarding configuration."""
    role: str = Field(..., description="User role")
    steps: List[Dict[str, Any]] = Field(..., description="Onboarding steps configuration")
    estimated_duration: int = Field(..., description="Estimated duration in minutes")
    welcome_message: str = Field(..., description="Welcome message for the role")
    completion_message: str = Field(..., description="Completion message for the role")


class OnboardingAnalytics(BaseModel):
    """Schema for onboarding analytics."""
    total_users: int = Field(..., description="Total users with onboarding")
    completed_users: int = Field(..., description="Users who completed onboarding")
    completion_rate: float = Field(..., description="Completion rate as percentage")
    average_completion_time: Optional[float] = Field(None, description="Average completion time in hours")
    step_completion_rates: Dict[str, float] = Field(..., description="Completion rates by step")
    role_completion_rates: Dict[str, float] = Field(..., description="Completion rates by role")

    class Config:
        from_attributes = True