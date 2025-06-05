"""Pydantic schemas for compliance and security data models."""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from app.core.compliance import SecurityIncidentSeverity
from app.core.security_events import SecurityEventType


class AuditLogEntry(BaseModel):
    """Schema for PHI access audit log entries."""

    id: str = Field(..., description="Unique audit log ID")
    timestamp: datetime = Field(..., description="Access timestamp")
    user_id: int = Field(..., description="User ID")
    patient_id: int = Field(..., description="Patient ID")
    access_type: str = Field(..., description="Access type")
    data_elements: List[str] = Field(..., description="Accessed data")
    territory_id: int = Field(..., description="Territory ID")
    ip_address: str = Field(..., description="Access IP")
    session_id: str = Field(..., description="Session ID")

    class Config:
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2024-05-22T14:30:00Z",
                "user_id": 1,
                "patient_id": 100,
                "access_type": "view",
                "data_elements": ["demographics", "medical_history"],
                "territory_id": 1,
                "ip_address": "192.168.1.1",
                "session_id": "sess_123456",
            }
        }


class SecurityIncident(BaseModel):
    """Schema for security incidents."""

    id: str = Field(..., description="Unique identifier for the incident")
    timestamp: datetime = Field(..., description="When the incident occurred")
    type: SecurityEventType = Field(..., description="Type of security event")
    severity: SecurityIncidentSeverity = Field(
        ..., description="Incident severity")
    source: str = Field(..., description="Source of the incident")
    details: Dict = Field(..., description="Detailed incident information")
    status: str = Field(..., description="Current incident status")
    affected_patients: Optional[List[int]] = Field(
        None, description="List of affected patient IDs"
    )

    class Config:
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "timestamp": "2024-05-22T14:30:00Z",
                "type": "auth_failure",
                "severity": "high",
                "source": "user_1",
                "details": {"attempt_count": 5, "ip_address": "192.168.1.1"},
                "status": "open",
                "affected_patients": [100, 101],
            }
        }


class ComplianceMetrics(BaseModel):
    """Schema for compliance and security metrics."""

    total_phi_accesses: int = Field(..., description="Total PHI access count")
    unauthorized_access_attempts: int = Field(
        ..., description="Count of unauthorized access attempts"
    )
    security_incidents: int = Field(
        ...,
        description="Total security incidents"
    )
    open_incidents: int = Field(..., description="Number of open incidents")
    average_incident_resolution_time: float = Field(
        ..., description="Average time to resolve incidents (hours)"
    )
    compliance_score: float = Field(
        ...,
        description="Overall compliance score (0-100)"
    )
    territory_metrics: Dict[str, Dict] = Field(
        ..., description="Territory-specific metrics"
    )

    class Config:
        schema_extra = {
            "example": {
                "total_phi_accesses": 1000,
                "unauthorized_access_attempts": 5,
                "security_incidents": 10,
                "open_incidents": 2,
                "average_incident_resolution_time": 4.5,
                "compliance_score": 95.5,
                "territory_metrics": {
                    "territory_1": {"phi_accesses": 500, "incidents": 3}
                },
            }
        }


class ComplianceReport(BaseModel):
    """Schema for comprehensive compliance reports."""

    report_id: str = Field(
        ..., description="Unique identifier for the report")
    generated_at: datetime = Field(
        ...,
        description="Report generation timestamp"
    )
    period_start: datetime = Field(
        ...,
        description="Start of reporting period"
    )
    period_end: datetime = Field(..., description="End of reporting period")
    territory_id: Optional[int] = Field(
        None, description="Territory ID if territory-specific"
    )
    metrics: Optional[ComplianceMetrics] = Field(
        None,
        description="Compliance metrics"
    )
    incidents: Optional[List[SecurityIncident]] = Field(
        None, description="Security incidents"
    )
    audit_logs: Optional[List[AuditLogEntry]] = Field(
        None, description="PHI access audit logs"
    )
    summary: Dict = Field(..., description="Executive summary of findings")
    recommendations: List[str] = Field(
        ...,
        description="Compliance recommendations"
    )

    class Config:
        schema_extra = {
            "example": {
                "report_id": "123e4567-e89b-12d3-a456-426614174000",
                "generated_at": "2024-05-22T14:30:00Z",
                "period_start": "2024-05-01T00:00:00Z",
                "period_end": "2024-05-22T00:00:00Z",
                "territory_id": 1,
                "metrics": {},
                "incidents": [],
                "audit_logs": [],
                "summary": {"overall_status": "compliant", "risk_level": "low"},
                "recommendations": [
                    "Implement additional access controls",
                    "Update security training",
                ],
            }
        }
