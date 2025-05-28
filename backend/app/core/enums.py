"""Core enums for the healthcare IVR platform."""
import enum


class IVRStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    CANCELLED = "cancelled"


class IVRPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent" 