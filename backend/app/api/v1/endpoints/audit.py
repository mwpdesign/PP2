"""
Audit & Compliance API Endpoints
Phase 2: Foundation Systems - Task ID: mbrgdnzkoihwtfftils

API endpoints for HIPAA-compliant audit logging and compliance reporting.
"""

import csv
import io
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.services.comprehensive_audit_service import (
    ComprehensiveAuditService,
    ActionType,
    ResourceType,
    AuditContext,
    get_audit_service,
    create_audit_context
)

router = APIRouter()


# Pydantic schemas for API requests/responses
class AuditLogResponse(BaseModel):
    """Response schema for audit log entries."""

    id: str
    user_id: str
    organization_id: str
    action_type: str
    resource_type: str
    resource_id: Optional[str] = None
    patient_id: Optional[str] = None
    ip_address: str
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    success: bool
    error_message: Optional[str] = None
    created_at: str


class AuditLogListResponse(BaseModel):
    """Response schema for paginated audit log list."""

    audit_logs: List[AuditLogResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


class AuditLogFilters(BaseModel):
    """Filters for audit log queries."""

    user_id: Optional[UUID] = None
    action_type: Optional[str] = None
    resource_type: Optional[str] = None
    patient_id: Optional[UUID] = None
    success: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ExportRequest(BaseModel):
    """Request schema for audit log export."""

    export_type: str = Field(..., regex="^(CSV|PDF|JSON)$")
    start_date: datetime
    end_date: datetime
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ComplianceReportResponse(BaseModel):
    """Response schema for compliance reports."""

    report_id: str
    generated_at: str
    period: Dict[str, str]
    organization_id: str
    summary: Dict[str, Any]
    compliance_status: str
    recommendations: List[str] = Field(default_factory=list)


@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    request: Request,
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    patient_id: Optional[UUID] = Query(None, description="Filter by patient ID"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve audit logs with filtering and pagination.

    Requires appropriate permissions to view audit logs.
    """

    # Check if user has permission to view audit logs
    if current_user.role not in ["admin", "compliance_officer"]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view audit logs"
        )

    # Create audit context and log this access
    audit_context = create_audit_context(current_user, request)
    audit_service = get_audit_service(db)

    # Log the audit log access
    await audit_service.log_user_action(
        context=audit_context,
        action=ActionType.AUDIT_LOG_ACCESS,
        resource_type=ResourceType.AUDIT_LOG,
        metadata={
            "filters": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "user_id": str(user_id) if user_id else None,
                "action_type": action_type,
                "resource_type": resource_type,
                "patient_id": str(patient_id) if patient_id else None,
                "success": success
            },
            "pagination": {"limit": limit, "offset": offset}
        }
    )

    # Build filters
    filters = {}
    if user_id:
        filters["user_id"] = user_id
    if action_type:
        filters["action_type"] = action_type
    if resource_type:
        filters["resource_type"] = resource_type
    if patient_id:
        filters["patient_id"] = patient_id
    if success is not None:
        filters["success"] = success

    # Get audit logs
    result = await audit_service.get_audit_logs(
        organization_id=current_user.organization_id,
        filters=filters,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )

    return AuditLogListResponse(**result)


@router.post("/export")
async def export_audit_logs(
    export_request: ExportRequest,
    request: Request,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export audit logs in the specified format.

    Supports CSV, PDF, and JSON exports with filtering.
    """

    # Check permissions
    if current_user.role not in ["admin", "compliance_officer"]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to export audit logs"
        )

    # Create audit context
    audit_context = create_audit_context(current_user, request)
    audit_service = get_audit_service(db)

    # Get audit logs for export
    result = await audit_service.get_audit_logs(
        organization_id=current_user.organization_id,
        filters=export_request.filters,
        start_date=export_request.start_date,
        end_date=export_request.end_date,
        limit=10000  # Large limit for exports
    )

    # Generate export file
    if export_request.export_type == "CSV":
        content, filename = _generate_csv_export(result["audit_logs"])
        media_type = "text/csv"
    elif export_request.export_type == "JSON":
        content, filename = _generate_json_export(result["audit_logs"])
        media_type = "application/json"
    else:
        raise HTTPException(
            status_code=400,
            detail="PDF export not yet implemented"
        )

    # Calculate file hash
    file_hash = hashlib.sha256(content.encode()).hexdigest()

    # Log the export
    await audit_service.log_data_export(
        context=audit_context,
        export_type=export_request.export_type,
        date_range_start=export_request.start_date,
        date_range_end=export_request.end_date,
        filters=export_request.filters,
        record_count=len(result["audit_logs"]),
        file_hash=file_hash
    )

    # Return file as streaming response
    return StreamingResponse(
        io.StringIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/compliance-report", response_model=ComplianceReportResponse)
async def generate_compliance_report(
    request: Request,
    start_date: datetime = Query(..., description="Report start date"),
    end_date: datetime = Query(..., description="Report end date"),
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a HIPAA compliance report for the specified period.

    Includes PHI access statistics, security events, and compliance metrics.
    """

    # Check permissions
    if current_user.role not in ["admin", "compliance_officer"]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to generate compliance reports"
        )

    # Create audit context
    audit_context = create_audit_context(current_user, request)
    audit_service = get_audit_service(db)

    # Log the compliance report generation
    await audit_service.log_user_action(
        context=audit_context,
        action=ActionType.COMPLIANCE_REPORT,
        resource_type=ResourceType.REPORT,
        metadata={
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    )

    # Generate compliance report
    report = await _generate_compliance_report(
        audit_service=audit_service,
        organization_id=current_user.organization_id,
        start_date=start_date,
        end_date=end_date
    )

    return ComplianceReportResponse(**report)


@router.get("/action-types")
async def get_action_types(
    current_user: TokenData = Depends(get_current_user)
):
    """Get list of available action types for filtering."""

    if current_user.role not in ["admin", "compliance_officer"]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view action types"
        )

    return {
        "action_types": [action.value for action in ActionType],
        "resource_types": [resource.value for resource in ResourceType]
    }


@router.get("/statistics")
async def get_audit_statistics(
    request: Request,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit statistics for the dashboard.

    Returns summary statistics for the specified time period.
    """

    if current_user.role not in ["admin", "compliance_officer"]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view audit statistics"
        )

    # Create audit context
    audit_context = create_audit_context(current_user, request)
    audit_service = get_audit_service(db)

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get audit logs for statistics
    result = await audit_service.get_audit_logs(
        organization_id=current_user.organization_id,
        start_date=start_date,
        end_date=end_date,
        limit=10000
    )

    # Calculate statistics
    logs = result["audit_logs"]
    statistics = {
        "total_events": len(logs),
        "phi_access_events": len([log for log in logs if log["action_type"] == "phi_access"]),
        "failed_events": len([log for log in logs if not log["success"]]),
        "unique_users": len(set(log["user_id"] for log in logs)),
        "security_events": len([log for log in logs if "security_event" in log.get("metadata", {})]),
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        }
    }

    # Log the statistics access
    await audit_service.log_user_action(
        context=audit_context,
        action=ActionType.AUDIT_LOG_ACCESS,
        resource_type=ResourceType.AUDIT_LOG,
        metadata={"statistics_request": True, "days": days}
    )

    return statistics


# Helper functions
def _generate_csv_export(audit_logs: List[Dict[str, Any]]) -> tuple[str, str]:
    """Generate CSV export content."""

    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "ID", "User ID", "Action Type", "Resource Type", "Resource ID",
        "Patient ID", "IP Address", "Success", "Created At", "Metadata"
    ])

    # Write data
    for log in audit_logs:
        writer.writerow([
            log["id"],
            log["user_id"],
            log["action_type"],
            log["resource_type"],
            log.get("resource_id", ""),
            log.get("patient_id", ""),
            log["ip_address"],
            log["success"],
            log["created_at"],
            str(log.get("metadata", {}))
        ])

    content = output.getvalue()
    filename = f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return content, filename


def _generate_json_export(audit_logs: List[Dict[str, Any]]) -> tuple[str, str]:
    """Generate JSON export content."""

    import json

    export_data = {
        "export_timestamp": datetime.utcnow().isoformat(),
        "record_count": len(audit_logs),
        "audit_logs": audit_logs
    }

    content = json.dumps(export_data, indent=2)
    filename = f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    return content, filename


async def _generate_compliance_report(
    audit_service: ComprehensiveAuditService,
    organization_id: UUID,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Generate a comprehensive compliance report."""

    # Get audit logs for the period
    result = await audit_service.get_audit_logs(
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
        limit=10000
    )

    logs = result["audit_logs"]

    # Calculate compliance metrics
    total_events = len(logs)
    phi_events = [log for log in logs if log["action_type"] in ["phi_access", "phi_edit", "phi_create"]]
    failed_events = [log for log in logs if not log["success"]]
    security_events = [log for log in logs if "security_event" in log.get("metadata", {})]

    # Generate recommendations
    recommendations = []
    if len(failed_events) > total_events * 0.05:  # More than 5% failures
        recommendations.append("High failure rate detected - review system stability")
    if len(security_events) > 0:
        recommendations.append("Security events detected - review security incidents")
    if len(phi_events) == 0:
        recommendations.append("No PHI access logged - verify audit system coverage")

    # Determine compliance status
    compliance_status = "COMPLIANT"
    if len(failed_events) > total_events * 0.1:  # More than 10% failures
        compliance_status = "NON_COMPLIANT"
    elif len(security_events) > 5:
        compliance_status = "REVIEW_REQUIRED"

    return {
        "report_id": str(UUID()),
        "generated_at": datetime.utcnow().isoformat(),
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "organization_id": str(organization_id),
        "summary": {
            "total_events": total_events,
            "phi_access_events": len(phi_events),
            "failed_events": len(failed_events),
            "security_events": len(security_events),
            "unique_users": len(set(log["user_id"] for log in logs)),
            "failure_rate": len(failed_events) / total_events if total_events > 0 else 0
        },
        "compliance_status": compliance_status,
        "recommendations": recommendations
    }