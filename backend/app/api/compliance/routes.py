"""
HIPAA compliance API endpoints.
"""
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.hipaa_audit_service import HIPAAComplianceService
from app.api.compliance.schemas import (
    ComplianceViolation,
    ComplianceCheckResponse,
    AccessStatistics,
    AccessPattern,
    AuditReportResponse,
    SecurityIncidentCreate,
    SecurityIncidentResponse
)
from app.core.compliance import ComplianceService, SecurityIncidentSeverity
from app.core.security_events import SecurityEventHandler, SecurityEventType
from app.schemas.compliance import (
    ComplianceReport,
    SecurityIncident,
    AuditLogEntry,
    ComplianceMetrics
)

router = APIRouter()


@router.post(
    "/compliance/check",
    response_model=ComplianceCheckResponse,
    tags=["compliance"]
)
async def run_compliance_check(
    check_type: str = Query(..., description="Type of compliance check to run"),
    territory_id: Optional[int] = Query(None, description="Territory to scope check to"),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Run a comprehensive HIPAA compliance check.
    Only accessible to users with compliance officer role.
    """
    if 'compliance_officer' not in current_user['roles']:
        raise HTTPException(
            status_code=403,
            detail="Only compliance officers can run compliance checks"
        )

    service = HIPAAComplianceService(db)
    return await service.run_compliance_check(check_type, territory_id)


@router.get(
    "/compliance/audit-report",
    response_model=AuditReportResponse,
    tags=["compliance"]
)
async def generate_audit_report(
    report_type: str = Query(..., description="Type of report to generate"),
    start_date: datetime = Query(..., description="Start date for report period"),
    end_date: datetime = Query(..., description="End date for report period"),
    territory_id: Optional[int] = Query(None, description="Territory to scope report to"),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Generate a HIPAA compliance audit report for a specified time period.
    Only accessible to users with compliance officer or auditor roles.
    """
    allowed_roles = {'compliance_officer', 'auditor'}
    if not any(role in current_user['roles'] for role in allowed_roles):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only compliance officers and auditors can access "
                "audit reports"
            )
        )

    service = HIPAAComplianceService(db)
    return await service.generate_audit_report(
        report_type,
        start_date,
        end_date,
        territory_id
    )


@router.post(
    "/compliance/incidents",
    response_model=SecurityIncidentResponse,
    tags=["compliance"]
)
async def report_security_incident(
    incident: SecurityIncidentCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Create a new security incident report.
    Accessible to all authenticated users for reporting security concerns.
    """
    service = HIPAAComplianceService(db)
    return await service.report_security_incident(
        incident_type=incident.incident_type,
        description=incident.description,
        user_id=current_user["id"],
        territory_id=incident.territory_id,
        severity=incident.severity,
        affected_resources=incident.affected_resources,
        metadata=incident.metadata
    )


@router.get(
    "/compliance/incidents",
    response_model=List[SecurityIncidentResponse],
    tags=["compliance"]
)
async def list_security_incidents(
    territory_id: Optional[int] = Query(None, description="Territory to filter by"),
    status: Optional[str] = Query(None, description="Status to filter by"),
    severity: Optional[str] = Query(None, description="Severity to filter by"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(10, description="Number of records to return"),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    List security incidents with optional filters.
    Only accessible to users with security or compliance roles.
    """
    allowed_roles = {'compliance_officer', 'security_officer'}
    if not any(role in current_user['roles'] for role in allowed_roles):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only compliance and security officers can view "
                "security incidents"
            )
        )

    service = HIPAAComplianceService(db)
    return await service.list_security_incidents(
        territory_id=territory_id,
        status=status,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )


@router.get(
    "/compliance/audit-logs",
    response_model=List[AuditLogEntry],
    summary="Get PHI access audit logs"
)
async def get_audit_logs(
    start_date: datetime = None,
    end_date: datetime = None,
    user_id: int = None,
    patient_id: int = None,
    territory_id: int = None,
    limit: int = Query(default=50, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve PHI access audit logs with filtering options."""
    compliance_service = ComplianceService(db)
    try:
        logs = await compliance_service.get_audit_logs(
            start_date=start_date,
            end_date=end_date,
            user_id=user_id,
            patient_id=patient_id,
            territory_id=territory_id,
            limit=limit
        )
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve audit logs: {str(e)}"
        )


@router.get(
    "/compliance/incidents",
    response_model=List[SecurityIncident],
    summary="Get security incidents"
)
async def get_security_incidents(
    severity: SecurityIncidentSeverity = None,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = Query(default=50, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve security incidents with filtering options."""
    compliance_service = ComplianceService(db)
    try:
        incidents = await compliance_service.get_security_incidents(
            severity=severity,
            status=status,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return incidents
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve security incidents: {str(e)}"
        )


@router.post(
    "/compliance/incidents",
    response_model=SecurityIncident,
    status_code=201,
    summary="Report security incident"
)
async def report_security_incident(
    incident_type: SecurityEventType,
    severity: SecurityIncidentSeverity,
    details: Dict,
    affected_patients: List[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Report a new security incident."""
    event_handler = SecurityEventHandler(db)
    try:
        incident = await event_handler.handle_security_event(
            event_type=incident_type,
            event_data=details,
            source=f"user_{current_user.id}",
            severity=severity
        )
        return incident
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to report security incident: {str(e)}"
        )


@router.get(
    "/compliance/metrics",
    response_model=ComplianceMetrics,
    summary="Get compliance metrics"
)
async def get_compliance_metrics(
    start_date: datetime = None,
    end_date: datetime = None,
    territory_id: int = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get compliance and security metrics."""
    compliance_service = ComplianceService(db)
    try:
        metrics = await compliance_service.get_compliance_metrics(
            start_date=start_date,
            end_date=end_date,
            territory_id=territory_id
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve compliance metrics: {str(e)}"
        )


@router.get(
    "/compliance/report",
    response_model=ComplianceReport,
    summary="Generate compliance report"
)
async def generate_compliance_report(
    start_date: datetime,
    end_date: datetime,
    territory_id: int = None,
    include_metrics: bool = True,
    include_incidents: bool = True,
    include_audit_logs: bool = True,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a comprehensive compliance report."""
    compliance_service = ComplianceService(db)
    try:
        report = await compliance_service.generate_compliance_report(
            start_date=start_date,
            end_date=end_date,
            territory_id=territory_id,
            include_metrics=include_metrics,
            include_incidents=include_incidents,
            include_audit_logs=include_audit_logs
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate compliance report: {str(e)}"
        ) 