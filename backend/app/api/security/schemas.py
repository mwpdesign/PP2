"""
Security API schemas.
"""

from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SecurityMetricsResponse(BaseModel):
    """Security metrics response schema."""

    total_events: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    active_incidents: int
    compliance_status: Dict[str, str]


class SecurityEventBase(BaseModel):
    """Base schema for security events."""

    event_type: str
    severity: str = Field(..., pattern="^(low|medium|high)$")
    user_id: Optional[int] = None
    territory_id: Optional[int] = None
    details: Optional[Dict] = None


class SecurityEventResponse(SecurityEventBase):
    """Security event response schema."""

    id: int
    created_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class SecurityAlertBase(BaseModel):
    """Base schema for security alerts."""

    alert_type: str
    severity: str = Field(..., pattern="^(low|medium|high)$")
    user_id: Optional[int] = None
    territory_id: Optional[int] = None
    details: Optional[Dict] = None


class SecurityAlertResponse(SecurityAlertBase):
    """Security alert response schema."""

    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None

    class Config:
        from_attributes = True


class SecurityIncidentBase(BaseModel):
    """Base schema for security incidents."""

    incident_type: str
    severity: str = Field(..., pattern="^(low|medium|high)$")
    status: str = Field(..., pattern="^(open|investigating|resolved)$")
    description: str
    details: Optional[Dict] = None


class CreateIncidentRequest(SecurityIncidentBase):
    """Create incident request schema."""

    pass


class UpdateIncidentRequest(BaseModel):
    """Update incident request schema."""

    status: str = Field(..., pattern="^(open|investigating|resolved)$")
    resolution: Optional[str] = None
    notes: Optional[str] = None


class SecurityIncidentResponse(SecurityIncidentBase):
    """Security incident response schema."""

    id: int
    created_at: datetime
    created_by: int
    territory_id: int
    escalated: bool = False
    escalated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolution: Optional[str] = None
    timeline: List[Dict]

    class Config:
        from_attributes = True


class ComplianceStatusResponse(BaseModel):
    """Compliance status response schema."""

    status: str = Field(..., pattern="^(compliant|non_compliant|unknown)$")
    last_check: Optional[datetime] = None
    violations: List[Dict] = []

    class Config:
        from_attributes = True
