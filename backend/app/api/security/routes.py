"""
Security monitoring and dashboard routes.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, get_current_territory
from app.services.security_monitoring import SecurityMonitoringService
from app.api.security.schemas import (
    SecurityMetricsResponse,
    SecurityAlertResponse,
    SecurityIncidentResponse,
    SecurityEventResponse,
    ComplianceStatusResponse,
    CreateIncidentRequest,
    UpdateIncidentRequest
)

router = APIRouter()


@router.get(
    "/security/metrics",
    response_model=SecurityMetricsResponse,
    tags=["security"]
)
async def get_security_metrics(
    request: Request,
    start_date: datetime = Query(
        default_factory=lambda: datetime.utcnow() - timedelta(days=7)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.utcnow()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Get security metrics for the dashboard."""
    service = SecurityMonitoringService(db)
    metrics = await service.get_security_metrics(
        start_date=start_date,
        end_date=end_date,
        territory_id=territory_id
    )
    return metrics


@router.get(
    "/security/alerts",
    response_model=List[SecurityAlertResponse],
    tags=["security"]
)
async def get_security_alerts(
    request: Request,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    start_date: datetime = Query(
        default_factory=lambda: datetime.utcnow() - timedelta(days=1)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.utcnow()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Get security alerts."""
    service = SecurityMonitoringService(db)
    alerts = await service.get_security_alerts(
        severity=severity,
        alert_type=alert_type,
        start_date=start_date,
        end_date=end_date,
        territory_id=territory_id
    )
    return alerts


@router.get(
    "/security/incidents",
    response_model=List[SecurityIncidentResponse],
    tags=["security"]
)
async def get_security_incidents(
    request: Request,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: datetime = Query(
        default_factory=lambda: datetime.utcnow() - timedelta(days=7)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.utcnow()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Get security incidents."""
    service = SecurityMonitoringService(db)
    incidents = await service.get_security_incidents(
        status=status,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        territory_id=territory_id
    )
    return incidents


@router.post(
    "/security/incidents",
    response_model=SecurityIncidentResponse,
    tags=["security"]
)
async def create_security_incident(
    request: Request,
    incident_data: CreateIncidentRequest,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Create a new security incident."""
    service = SecurityMonitoringService(db)
    incident = await service.create_security_incident(
        incident_type=incident_data.incident_type,
        severity=incident_data.severity,
        description=incident_data.description,
        user_id=current_user["id"],
        territory_id=territory_id,
        details=incident_data.details
    )
    return incident


@router.put(
    "/security/incidents/{incident_id}",
    response_model=SecurityIncidentResponse,
    tags=["security"]
)
async def update_security_incident(
    request: Request,
    incident_id: int,
    update_data: UpdateIncidentRequest,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Update a security incident."""
    service = SecurityMonitoringService(db)
    incident = await service.update_security_incident(
        incident_id=incident_id,
        status=update_data.status,
        resolution=update_data.resolution,
        user_id=current_user["id"],
        territory_id=territory_id
    )
    return incident


@router.get(
    "/security/events",
    response_model=List[SecurityEventResponse],
    tags=["security"]
)
async def get_security_events(
    request: Request,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: datetime = Query(
        default_factory=lambda: datetime.utcnow() - timedelta(hours=24)
    ),
    end_date: datetime = Query(
        default_factory=lambda: datetime.utcnow()
    ),
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Get security events."""
    service = SecurityMonitoringService(db)
    events = await service.get_security_events(
        event_type=event_type,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        territory_id=territory_id
    )
    return events


@router.get(
    "/security/compliance-status",
    response_model=ComplianceStatusResponse,
    tags=["security"]
)
async def get_compliance_status(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
    territory_id: int = Depends(get_current_territory)
):
    """Get current compliance status."""
    service = SecurityMonitoringService(db)
    status = await service.get_compliance_status()
    return status