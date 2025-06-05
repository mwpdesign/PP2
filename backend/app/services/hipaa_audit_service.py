"""
HIPAA Compliance Audit Service.
Provides comprehensive audit logging and compliance monitoring.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.config import get_settings
from app.models.audit import (
    AuditLog,
    ComplianceCheck,
    PHIAccess,
    SecurityIncident,
    AuditReport,
)


class HIPAAComplianceService:
    """Service for managing HIPAA compliance and audit logging."""

    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

        # HIPAA compliance requirements
        self.phi_retention_period = timedelta(days=365 * 6)  # 6 years
        self.max_failed_logins = 3
        self.password_expiry_days = 90
        self.session_timeout_minutes = 15

        # PHI access patterns to monitor
        self.suspicious_patterns = {
            "bulk_access": 50,  # Max records per minute
            "off_hours_access": {"start": 22, "end": 5},  # 10 PM - 5 AM
            "multiple_territories": 3,  # Max territories per minute
        }

    async def log_phi_access(
        self,
        user_id: int,
        patient_id: int,
        action: str,
        territory_id: int,
        resource_type: str,
        resource_id: int,
        accessed_fields: List[str],
        request_metadata: Dict[str, Any],
    ) -> None:
        """
        Log PHI access with detailed tracking.

        Args:
            user_id: ID of user accessing PHI
            patient_id: ID of patient whose PHI is being accessed
            action: Type of action being performed
            territory_id: Territory where access occurred
            resource_type: Type of resource being accessed
            resource_id: ID of the resource being accessed
            accessed_fields: List of PHI fields that were accessed
            request_metadata: Additional request context
        """
        try:
            # Create PHI access log
            phi_access = PHIAccess(
                user_id=user_id,
                patient_id=patient_id,
                action=action,
                territory_id=territory_id,
                resource_type=resource_type,
                resource_id=resource_id,
                accessed_fields=accessed_fields,
                ip_address=request_metadata.get("ip_address"),
                user_agent=request_metadata.get("user_agent"),
                request_id=request_metadata.get("request_id"),
                correlation_id=request_metadata.get("correlation_id"),
                session_id=request_metadata.get("session_id"),
                access_reason=request_metadata.get("access_reason"),
                access_location=request_metadata.get("access_location"),
            )
            self.db.add(phi_access)

            # Create general audit log
            audit_log = AuditLog(
                user_id=user_id,
                action=f"phi_access_{action}",
                resource_type=resource_type,
                resource_id=resource_id,
                territory_id=territory_id,
                details={
                    "patient_id": patient_id,
                    "accessed_fields": accessed_fields,
                    "metadata": request_metadata,
                },
            )
            self.db.add(audit_log)

            # Commit the transaction
            self.db.commit()

            # Check for suspicious patterns
            await self._check_access_patterns(
                user_id,
                patient_id,
                territory_id
            )

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=(f"Failed to log PHI access: {str(e)}")
            )

    async def run_compliance_check(
        self, check_type: str, territory_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Run automated compliance checks.

        Args:
            check_type: Type of compliance check to run
            territory_id: Optional territory to scope the check to
        """
        try:
            results = {
                "status": "completed",
                "timestamp": datetime.utcnow(),
                "violations": [],
                "warnings": [],
            }

            if check_type == "phi_access":
                # Check PHI access patterns
                violations = await self._check_phi_access_compliance(
                    territory_id)
                results["violations"].extend(violations)

            elif check_type == "audit_logs":
                # Check audit log completeness
                violations = await self._check_audit_log_compliance(territory_id)
                results["violations"].extend(violations)

            elif check_type == "encryption":
                # Check encryption compliance
                violations = await self._check_encryption_compliance(territory_id)
                results["violations"].extend(violations)

            # Record compliance check
            check = ComplianceCheck(
                check_type=check_type,
                territory_id=territory_id,
                status="completed",
                results=results,
            )
            self.db.add(check)
            self.db.commit()

            return results

        except Exception as e:
            self.db.rollback()
            msg = f"Failed to run compliance check: {str(e)}"
            raise HTTPException(status_code=500, detail=msg)

    async def generate_audit_report(
        self,
        report_type: str,
        start_date: datetime,
        end_date: datetime,
        territory_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate HIPAA compliance audit report.

        Args:
            report_type: Type of report to generate
            start_date: Start date for report period
            end_date: End date for report period
            territory_id: Optional territory to scope the report to
        """
        try:
            report_data = {
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                },
                "generated_at": datetime.utcnow().isoformat(),
                "metrics": {},
                "violations": [],
                "recommendations": [],
            }

            # Get PHI access statistics
            phi_stats = await self._get_phi_access_stats(
                start_date, end_date, territory_id
            )
            report_data["metrics"]["phi_access"] = phi_stats

            # Get security incidents
            security_stats = await self._get_security_incidents(
                start_date, end_date, territory_id
            )
            report_data["metrics"]["security"] = security_stats

            # Get compliance check results
            compliance_stats = await self._get_compliance_check_results(
                start_date, end_date, territory_id
            )
            report_data["metrics"]["compliance"] = compliance_stats

            # Save report
            report = AuditReport(
                report_type=report_type,
                territory_id=territory_id,
                start_date=start_date,
                end_date=end_date,
                report_data=report_data,
            )
            self.db.add(report)
            self.db.commit()

            return report_data

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=(f"Failed to generate audit report: {str(e)}")
            )

    async def report_security_incident(
        self,
        incident_type: str,
        description: str,
        user_id: int,
        territory_id: int,
        severity: str,
        affected_resources: List[Dict[str, Any]],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SecurityIncident:
        """
        Report a security incident for HIPAA compliance.

        Args:
            incident_type: Type of security incident
            description: Description of the incident
            user_id: ID of user reporting the incident
            territory_id: Territory where incident occurred
            severity: Severity level of the incident
            affected_resources: List of affected resources
            metadata: Additional incident context
        """
        try:
            incident = SecurityIncident(
                incident_type=incident_type,
                description=description,
                reported_by=user_id,
                territory_id=territory_id,
                severity=severity,
                affected_resources=affected_resources,
                metadata=metadata or {},
                status="open",
                reported_at=datetime.utcnow(),
            )
            self.db.add(incident)
            self.db.commit()
            return incident

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=(f"Failed to report security incident: {str(e)}"),
            )

    async def _check_access_patterns(
        self, user_id: int, patient_id: int, territory_id: int
    ) -> None:
        """Check for suspicious PHI access patterns."""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)

        # Check for bulk access
        bulk_access = (
            self.db.query(PHIAccess)
            .filter(
                and_(
                    PHIAccess.user_id == user_id,
                    PHIAccess.created_at >= hour_ago
                )
            )
            .count()
        )

        if bulk_access > self.settings.MAX_PHI_ACCESS_PER_HOUR:
            await self.report_security_incident(
                incident_type="bulk_access",
                description=(f"User accessed {bulk_access} PHI records in 1 hour"),
                user_id=user_id,
                territory_id=territory_id,
                severity="medium",
                affected_resources=[{"type": "patient", "id": patient_id}],
            )

        # Check for territory hopping
        territories = (
            self.db.query(PHIAccess.territory_id)
            .filter(
                and_(
                    PHIAccess.user_id == user_id,
                    PHIAccess.created_at >= hour_ago
                )
            )
            .distinct()
            .count()
        )

        if territories > self.settings.MAX_TERRITORIES_PER_HOUR:
            await self.report_security_incident(
                incident_type="territory_hopping",
                description=(f"User accessed {territories} territories in 1 hour"),
                user_id=user_id,
                territory_id=territory_id,
                severity="high",
                affected_resources=[{"type": "patient", "id": patient_id}],
            )

    async def _check_phi_access_compliance(
        self, territory_id: Optional[int]
    ) -> List[Dict[str, Any]]:
        """Check PHI access compliance."""
        violations = []
        now = datetime.utcnow()
        day_ago = now - timedelta(days=1)

        # Base query
        query = self.db.query(PHIAccess).filter(PHIAccess.created_at >= day_ago)

        if territory_id:
            query = query.filter(PHIAccess.territory_id == territory_id)

        # Check for missing audit fields
        missing_fields = query.filter(
            or_(
                PHIAccess.access_reason.is_(None),
                PHIAccess.ip_address.is_(None),
                PHIAccess.user_agent.is_(None),
            )
        ).all()

        if missing_fields:
            violations.append(
                {
                    "type": "incomplete_audit_logs",
                    "description": "PHI access logs missing required fields",
                    "count": len(missing_fields),
                }
            )

        return violations

    async def _check_audit_log_compliance(
        self, territory_id: Optional[int]
    ) -> List[Dict[str, Any]]:
        """Check audit log compliance."""
        violations = []
        now = datetime.utcnow()
        month_ago = now - timedelta(days=30)

        # Base query
        query = self.db.query(AuditLog).filter(AuditLog.created_at >= month_ago)

        if territory_id:
            query = query.filter(AuditLog.territory_id == territory_id)

        # Check for gaps in audit logs
        gaps = await self._find_audit_log_gaps(query)
        if gaps:
            violations.append(
                {
                    "type": "audit_log_gaps",
                    "description": "Gaps detected in audit log timeline",
                    "gaps": gaps,
                }
            )

        return violations

    async def _check_encryption_compliance(
        self, territory_id: Optional[int]
    ) -> List[Dict[str, Any]]:
        """Check encryption compliance."""
        # This is a placeholder for actual encryption checks
        # Implementation would depend on the encryption service
        return []

    async def _get_phi_access_stats(
        self, start_date: datetime, end_date: datetime, territory_id: Optional[int]
    ) -> Dict[str, Any]:
        """Get PHI access statistics."""
        # Base query
        query = self.db.query(PHIAccess).filter(
            and_(
                PHIAccess.created_at >= start_date,
                PHIAccess.created_at <= end_date
            )
        )

        if territory_id:
            query = query.filter(PHIAccess.territory_id == territory_id)

        return {
            "total_access": query.count(),
            "unique_users": query.with_entities(PHIAccess.user_id).distinct().count(),
            "unique_patients": query.with_entities(PHIAccess.patient_id)
            .distinct()
            .count(),
            "by_action": dict(
                query.with_entities(PHIAccess.action, func.count(PHIAccess.id))
                .group_by(PHIAccess.action)
                .all()
            ),
        }

    async def _get_security_incidents(
        self, start_date: datetime, end_date: datetime, territory_id: Optional[int]
    ) -> Dict[str, Any]:
        """Get security incident statistics."""
        # Base query
        query = self.db.query(SecurityIncident).filter(
            and_(
                SecurityIncident.reported_at >= start_date,
                SecurityIncident.reported_at <= end_date,
            )
        )

        if territory_id:
            query = query.filter(SecurityIncident.territory_id == territory_id)

        return {
            "total_incidents": query.count(),
            "by_type": dict(
                query.with_entities(
                    SecurityIncident.incident_type, func.count(SecurityIncident.id)
                )
                .group_by(SecurityIncident.incident_type)
                .all()
            ),
            "by_severity": dict(
                query.with_entities(
                    SecurityIncident.severity, func.count(SecurityIncident.id)
                )
                .group_by(SecurityIncident.severity)
                .all()
            ),
            "open_incidents": query.filter(SecurityIncident.status == "open").count(),
        }

    async def _get_compliance_check_results(
        self, start_date: datetime, end_date: datetime, territory_id: Optional[int]
    ) -> Dict[str, Any]:
        """Get compliance check statistics."""
        # Base query
        query = self.db.query(ComplianceCheck).filter(
            and_(
                ComplianceCheck.created_at >= start_date,
                ComplianceCheck.created_at <= end_date,
            )
        )

        if territory_id:
            query = query.filter(ComplianceCheck.territory_id == territory_id)

        return {
            "total_checks": query.count(),
            "by_type": dict(
                query.with_entities(
                    ComplianceCheck.check_type, func.count(ComplianceCheck.id)
                )
                .group_by(ComplianceCheck.check_type)
                .all()
            ),
            "violations_found": query.filter(
                ComplianceCheck.results["violations"].cast(str) != "[]"
            ).count(),
        }

    async def _find_audit_log_gaps(self, query: Any) -> List[Dict[str, Any]]:
        """Find gaps in audit log timeline."""
        gaps = []
        logs = query.order_by(AuditLog.created_at).all()

        if not logs:
            return gaps

        for i in range(len(logs) - 1):
            current = logs[i]
            next_log = logs[i + 1]
            gap = next_log.created_at - current.created_at

            # Flag gaps longer than 1 hour
            if gap > timedelta(hours=1):
                gaps.append(
                    {
                        "start": current.created_at.isoformat(),
                        "end": next_log.created_at.isoformat(),
                        "duration_minutes": gap.total_seconds() / 60,
                    }
                )

        return gaps
