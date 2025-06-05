"""HIPAA compliance API endpoints."""

from typing import Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.hipaa_audit_service import HIPAAComplianceService
from app.api.compliance.schemas import (
    ComplianceCheckResponse,
    AuditReportResponse,
    SecurityIncidentCreate,
    SecurityIncidentResponse,
)
from app.core.compliance import ComplianceService, SecurityIncidentSeverity
from app.core.security_events import SecurityEventHandler, SecurityEventType
from app.schemas.compliance import (
    ComplianceReport,
    SecurityIncident,
    AuditLogEntry,
    ComplianceMetrics,
    ComplianceLogCreate,
    ComplianceLogUpdate,
    ComplianceLogResponse,
    PHIAccessCreate,
    PHIAccessUpdate,
    PHIAccessResponse,
)
from app.core.security import require_permissions

router = APIRouter()


@router.post(
    "/compliance/check", response_model=ComplianceCheckResponse, tags=["compliance"]
)
async def run_compliance_check(
    check_type: str = Query(
        ..., description="Type of compliance check to run"),
    territory_id: Optional[int] = Query(
        None, description="Territory to scope check to"
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Run a comprehensive HIPAA compliance check.
    Only accessible to users with compliance officer role.
    """
    if "compliance_officer" not in current_user["roles"]:
        raise HTTPException(
            status_code=403, detail="Only compliance officers can run compliance checks"
        )

    service = HIPAAComplianceService(db)
    return await service.run_compliance_check(check_type, territory_id)


@router.get(
    "/compliance/audit-report", response_model=AuditReportResponse, tags=["compliance"]
)
async def generate_audit_report(
    report_type: str = Query(..., description="Type of report to generate"),
    start_date: datetime = Query(
        ...,
        description="Start date for report period"
    ),
    end_date: datetime = Query(..., description="End date for report period"),
    territory_id: Optional[int] = Query(
        None, description="Territory to scope report to"
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Generate a HIPAA compliance audit report for a specified time period.
    Only accessible to users with compliance officer or auditor roles.
    """
    allowed_roles = {"compliance_officer", "auditor"}
    if not any(role in current_user["roles"] for role in allowed_roles):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only compliance officers and auditors can access " "audit reports"
            ),
        )

    service = HIPAAComplianceService(db)
    return await service.generate_audit_report(
        report_type, start_date, end_date, territory_id
    )


@router.post(
    "/compliance/incidents",
    response_model=SecurityIncidentResponse,
    tags=["compliance"],
)
async def report_security_incident(
    incident: SecurityIncidentCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
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
        metadata=incident.metadata,
    )


@router.get(
    "/compliance/incidents",
    response_model=List[SecurityIncidentResponse],
    tags=["compliance"],
)
async def list_security_incidents(
    territory_id: Optional[int] = Query(
        None,
        description="Territory to filter by"
    ),
    status: Optional[str] = Query(None, description="Status to filter by"),
    severity: Optional[str] = Query(None, description="Severity to filter by"),
    start_date: Optional[datetime] = Query(
        None, description="Start date for filtering"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="End date for filtering"
    ),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(10, description="Number of records to return"),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    List security incidents with optional filters.
    Only accessible to users with security or compliance roles.
    """
    allowed_roles = {"compliance_officer", "security_officer"}
    if not any(role in current_user["roles"] for role in allowed_roles):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only compliance and security officers can view " "security incidents"
            ),
        )

    service = HIPAAComplianceService(db)
    return await service.list_security_incidents(
        territory_id=territory_id,
        status=status,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/compliance/audit-logs",
    response_model=List[AuditLogEntry],
    summary="Get PHI access audit logs",
)
async def get_audit_logs(
    start_date: datetime = None,
    end_date: datetime = None,
    user_id: int = None,
    patient_id: int = None,
    territory_id: int = None,
    limit: int = Query(default=50, le=100),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db),
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
            limit=limit,
        )
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=(f"Error retrieving audit logs: {str(e)}")
        )


@router.get(
    "/compliance/incidents",
    response_model=List[SecurityIncident],
    summary="Get security incidents",
)
async def get_security_incidents(
    severity: SecurityIncidentSeverity = None,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    limit: int = Query(default=50, le=100),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve security incidents with filtering options."""
    compliance_service = ComplianceService(db)
    try:
        incidents = await compliance_service.get_security_incidents(
            severity=severity,
            status=status,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )
        return incidents
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve security incidents: {str(e)}"
        )


@router.post(
    "/compliance/incidents/report",
    response_model=SecurityIncident,
    status_code=201,
    summary="Report security incident",
)
async def create_security_incident(
    incident_type: SecurityEventType,
    severity: SecurityIncidentSeverity,
    details: Dict,
    affected_patients: List[int] = None,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new security incident report."""
    event_handler = SecurityEventHandler(db)
    try:
        incident = await event_handler.handle_security_event(
            event_type=incident_type,
            event_data=details,
            source=f"user_{current_user.id}",
            severity=severity,
        )
        return incident
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to report security incident: {str(e)}"
        )


@router.get("/compliance/metrics", response_model=ComplianceMetrics)
async def get_compliance_metrics(
    start_date: datetime = None,
    end_date: datetime = None,
    territory_id: int = None,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get compliance metrics for the specified time period."""
    compliance_service = ComplianceService(db)
    try:
        metrics = await compliance_service.get_compliance_metrics(
            start_date=start_date, end_date=end_date, territory_id=territory_id
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve compliance metrics: {str(e)}"
        )


@router.get("/compliance/report", response_model=ComplianceReport)
async def generate_compliance_report(
    start_date: datetime,
    end_date: datetime,
    territory_id: int = None,
    include_metrics: bool = True,
    include_incidents: bool = True,
    include_audit_logs: bool = True,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db),
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
            include_audit_logs=include_audit_logs,
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate compliance report: {str(e)}"
        )


@router.post("/logs", response_model=ComplianceLogResponse)
@require_permissions(["compliance:write"])
async def create_compliance_log(
    *,
    db: AsyncSession = Depends(get_db),
    log_in: ComplianceLogCreate,
    current_user: dict = Depends(get_current_user),
) -> ComplianceLogResponse:
    """Create a new compliance log entry."""
    compliance_service = ComplianceService(db)
    log = await compliance_service.create_log(
        log_in,
        created_by_id=current_user["id"]
    )
    return log


@router.get("/logs", response_model=List[ComplianceLogResponse])
@require_permissions(["compliance:read"])
async def get_compliance_logs(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[ComplianceLogResponse]:
    """Get compliance logs."""
    compliance_service = ComplianceService(db)
    logs = await compliance_service.get_logs(
        organization_id=current_user["organization_id"], skip=skip, limit=limit
    )
    return logs


@router.get("/logs/{log_id}", response_model=ComplianceLogResponse)
@require_permissions(["compliance:read"])
async def get_compliance_log(
    *,
    db: AsyncSession = Depends(get_db),
    log_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> ComplianceLogResponse:
    """Get a compliance log by ID."""
    compliance_service = ComplianceService(db)
    log = await compliance_service.get_log(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Compliance log not found"
        )
    # Check organization access
    if log.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return log


@router.put("/logs/{log_id}", response_model=ComplianceLogResponse)
@require_permissions(["compliance:write"])
async def update_compliance_log(
    *,
    db: AsyncSession = Depends(get_db),
    log_id: UUID,
    log_in: ComplianceLogUpdate,
    current_user: dict = Depends(get_current_user),
) -> ComplianceLogResponse:
    """Update a compliance log."""
    compliance_service = ComplianceService(db)
    # Get existing log
    log = await compliance_service.get_log(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Compliance log not found"
        )
    # Check organization access
    if log.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    log = await compliance_service.update_log(
        log_id, log_in, updated_by_id=current_user["id"]
    )
    return log


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permissions(["compliance:write"])
async def delete_compliance_log(
    *,
    db: AsyncSession = Depends(get_db),
    log_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """Delete a compliance log."""
    compliance_service = ComplianceService(db)
    # Get existing log
    log = await compliance_service.get_log(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Compliance log not found"
        )
    # Check organization access
    if log.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    await compliance_service.delete_log(log_id)


@router.post("/phi-access", response_model=PHIAccessResponse)
@require_permissions(["compliance:write"])
async def create_phi_access_log(
    *,
    db: AsyncSession = Depends(get_db),
    access_in: PHIAccessCreate,
    current_user: dict = Depends(get_current_user),
) -> PHIAccessResponse:
    """Create a new PHI access log entry."""
    compliance_service = ComplianceService(db)
    access = await compliance_service.create_phi_access(
        access_in, source=f"user_{current_user['id']}", created_by_id=current_user["id"]
    )
    return access


@router.get("/phi-access", response_model=List[PHIAccessResponse])
@require_permissions(["compliance:read"])
async def get_phi_access_logs(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[PHIAccessResponse]:
    """Get PHI access logs."""
    compliance_service = ComplianceService(db)
    logs = await compliance_service.get_phi_access_logs(
        organization_id=current_user["organization_id"], skip=skip, limit=limit
    )
    return logs


@router.get("/phi-access/{access_id}", response_model=PHIAccessResponse)
@require_permissions(["compliance:read"])
async def get_phi_access_log(
    *,
    db: AsyncSession = Depends(get_db),
    access_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> PHIAccessResponse:
    """Get a PHI access log by ID."""
    compliance_service = ComplianceService(db)
    log = await compliance_service.get_phi_access_log(access_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="PHI access log not found"
        )
    # Check organization access
    if log.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return log


@router.put("/phi-access/{access_id}", response_model=PHIAccessResponse)
@require_permissions(["compliance:write"])
async def update_phi_access_log(
    *,
    db: AsyncSession = Depends(get_db),
    access_id: UUID,
    access_in: PHIAccessUpdate,
    current_user: dict = Depends(get_current_user),
) -> PHIAccessResponse:
    """Update a PHI access log."""
    compliance_service = ComplianceService(db)
    # Get existing log
    log = await compliance_service.get_phi_access_log(access_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="PHI access log not found"
        )
    # Check organization access
    if log.organization_id != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    log = await compliance_service.update_phi_access_log(
        access_id, access_in, updated_by_id=current_user["id"]
    )
    return log
