"""
Schema models for HIPAA compliance API endpoints.
"""

from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ComplianceViolation(BaseModel):
    """Schema for compliance violations."""

    type: str = Field(..., description="Type of violation")
    severity: str = Field(
        ..., description="Violation severity (low, medium, high, critical)"
    )
    description: str = Field(..., description="Description of the violation")
    affected_resources: List[str] = Field(..., description="List of affected resources")
    remediation_steps: Optional[List[str]] = Field(
        None, description="Steps to remediate the violation"
    )


class ComplianceCheckResponse(BaseModel):
    """Schema for compliance check response."""

    timestamp: datetime = Field(..., description="When check was performed")
    status: str = Field(..., description="Overall compliance status")
    violations: List[ComplianceViolation] = Field(
        default=[], description="List of compliance violations"
    )
    warnings: List[Dict] = Field(default=[], description="List of compliance warnings")
    checks_performed: List[str] = Field(..., description="List of checks performed")

    class Config:
        """Pydantic config."""

        from_attributes = True


class AccessStatistics(BaseModel):
    """Schema for PHI access statistics."""

    total_accesses: int = Field(..., description="Total PHI accesses")
    unique_users: int = Field(..., description="Unique users accessing PHI")
    access_by_type: Dict[str, int] = Field(..., description="Access counts by type")
    access_by_resource: Dict[str, int] = Field(
        ..., description="Access counts by resource"
    )
    emergency_accesses: int = Field(..., description="Number of emergency accesses")


class AccessPattern(BaseModel):
    """Schema for PHI access patterns."""

    pattern_type: str = Field(..., description="Type of access pattern")
    frequency: int = Field(..., description="Pattern frequency")
    users: List[int] = Field(..., description="Users involved")
    resources: List[str] = Field(..., description="Resources involved")
    risk_level: str = Field(..., description="Risk level (low, medium, high)")


class AuditReportResponse(BaseModel):
    """Schema for audit report response."""

    period: Dict[str, datetime] = Field(..., description="Report time period")
    generated_at: datetime = Field(..., description="When report was generated")
    statistics: AccessStatistics = Field(..., description="Access statistics")
    access_patterns: List[AccessPattern] = Field(
        ..., description="Detected access patterns"
    )
    violations: List[ComplianceViolation] = Field(
        default=[], description="Compliance violations"
    )
    compliance_status: str = Field(..., description="Overall compliance status")
    phi_access_logs: Optional[List[Dict]] = Field(
        None, description="Detailed PHI access logs"
    )
    security_incidents: Optional[List[Dict]] = Field(
        None, description="Security incidents"
    )

    class Config:
        """Pydantic config."""

        from_attributes = True


class SecurityIncidentCreate(BaseModel):
    """Schema for creating security incidents."""

    incident_type: str = Field(..., description="Type of security incident")
    severity: str = Field(
        "medium", description="Incident severity (low, medium, high, critical)"
    )
    territory_id: int = Field(..., description="Territory ID")
    details: Dict = Field(..., description="Incident details")
    notes: Optional[str] = Field(None, description="Additional notes")


class SecurityIncidentResponse(BaseModel):
    """Schema for security incident response."""

    id: int = Field(..., description="Incident ID")
    incident_type: str = Field(..., description="Type of incident")
    severity: str = Field(..., description="Incident severity")
    status: str = Field(..., description="Current status")
    user_id: int = Field(..., description="Reporting user ID")
    territory_id: int = Field(..., description="Territory ID")
    details: Dict = Field(..., description="Incident details")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")
    detected_at: datetime = Field(..., description="When incident was detected")
    resolved_at: Optional[datetime] = Field(
        None, description="When incident was resolved"
    )
    created_at: datetime = Field(..., description="When record was created")
    updated_at: Optional[datetime] = Field(
        None, description="When record was last updated"
    )

    class Config:
        """Pydantic config."""

        from_attributes = True
