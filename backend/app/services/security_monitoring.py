"""
Security Monitoring Service.
Provides real-time threat detection and security monitoring capabilities.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import boto3
from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException
import logging

from app.core.config import get_settings
from app.models.security import (
    SecurityEvent,
    SecurityAlert,
    SecurityIncident,
    ThreatDetectionRule,
)
from app.models.auth import User
from app.models.compliance import ComplianceCheck
from app.services.notification_service import NotificationService
from app.services.hipaa_audit_service import HIPAAComplianceService
from app.core.compliance import SecurityIncidentSeverity, ComplianceService


class SecurityMonitoringService:
    """Service for real-time security monitoring and threat detection."""

    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.notification_service = NotificationService(db)
        self.hipaa_service = HIPAAComplianceService(db)
        self.logger = logging.getLogger("security.monitoring")

        # Initialize AWS clients
        self.cloudtrail = boto3.client(
            "cloudtrail",
            aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
            region_name=self.settings.AWS_REGION,
        )
        self.cloudwatch = boto3.client(
            "cloudwatch",
            aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
            region_name=self.settings.AWS_REGION,
        )
        self.sns = boto3.client("sns")
        self.securityhub = boto3.client(
            "securityhub",
            aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
            region_name=self.settings.AWS_REGION,
        )

        # Security thresholds
        self.thresholds = {
            "failed_logins": 5,  # Max failed logins before lockout
            "concurrent_sessions": 3,  # Max concurrent sessions
            "phi_access_rate": 100,  # Max PHI accesses per minute
            "territory_switches": 5,  # Max territory switches per hour
            "off_hours_access": {  # Off-hours access window
                "start": 22,  # 10 PM
                "end": 5,  # 5 AM
            },
        }

        self.compliance_service = ComplianceService(db)

    async def monitor_security_events(
        self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
    ) -> Dict:
        """Monitor and analyze security events."""
        try:
            if not start_time:
                start_time = datetime.utcnow() - timedelta(hours=1)
            if not end_time:
                end_time = datetime.utcnow()

            # Get CloudTrail events
            trail_events = await self._get_cloudtrail_events(start_time, end_time)

            # Get Security Hub findings
            security_findings = await self._get_security_findings()

            # Analyze for threats
            threats = await self._analyze_threats(trail_events, security_findings)

            # Generate alerts for detected threats
            if threats:
                await self._generate_security_alerts(threats)

            return {
                "events_analyzed": len(trail_events),
                "threats_detected": len(threats),
                "timestamp": datetime.utcnow().isoformat(),
                "period": {
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat(),
                },
            }

        except Exception as e:
            self.logger.error(f"Security monitoring failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Security monitoring failed")

    async def _get_cloudtrail_events(
        self, start_time: datetime, end_time: datetime
    ) -> List[Dict]:
        """Retrieve CloudTrail events for analysis."""
        try:
            response = self.cloudtrail.lookup_events(
                StartTime=start_time,
                EndTime=end_time,
                MaxResults=50,  # Adjust based on requirements
            )
            return response.get("Events", [])
        except Exception as e:
            self.logger.error(f"Failed to get CloudTrail events: {str(e)}")
            return []

    async def _get_security_findings(self) -> List[Dict]:
        """Get Security Hub findings."""
        try:
            response = self.securityhub.get_findings(
                Filters={"RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}]},
                MaxResults=100,  # Adjust based on requirements
            )
            return response.get("Findings", [])
        except Exception as e:
            self.logger.error(f"Failed to get Security Hub findings: {str(e)}")
            return []

    async def _analyze_threats(
        self, trail_events: List[Dict], security_findings: List[Dict]
    ) -> List[Dict]:
        """Analyze events and findings for potential threats."""
        threats = []

        # Analyze CloudTrail events
        for event in trail_events:
            if await self._is_suspicious_event(event):
                threats.append(
                    {
                        "type": "suspicious_activity",
                        "source": "cloudtrail",
                        "details": event,
                        "severity": SecurityIncidentSeverity.HIGH,
                    }
                )

        # Analyze Security Hub findings
        for finding in security_findings:
            if await self._is_critical_finding(finding):
                threats.append(
                    {
                        "type": "security_finding",
                        "source": "securityhub",
                        "details": finding,
                        "severity": SecurityIncidentSeverity.CRITICAL,
                    }
                )

        return threats

    async def _is_suspicious_event(self, event: Dict) -> bool:
        """Determine if a CloudTrail event is suspicious."""
        # TODO: Implement suspicious event detection logic
        return False

    async def _is_critical_finding(self, finding: Dict) -> bool:
        """Determine if a Security Hub finding is critical."""
        # TODO: Implement critical finding detection logic
        return False

    async def _generate_security_alerts(self, threats: List[Dict]) -> None:
        """Generate alerts for detected threats."""
        for threat in threats:
            await self.compliance_service.report_security_incident(
                incident_type=threat["type"],
                severity=threat["severity"],
                details=threat["details"],
            )

    async def handle_failed_authentication(
        self, user_id: int, ip_address: str, user_agent: str
    ) -> None:
        """Handle failed authentication attempts."""
        try:
            # Record failed login
            event = SecurityEvent(
                event_type="failed_authentication",
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                severity="medium",
                details={
                    "timestamp": datetime.utcnow().isoformat(),
                    "location": await self._get_ip_location(ip_address),
                },
            )
            self.db.add(event)

            # Check for lockout threshold
            recent_failures = (
                self.db.query(SecurityEvent)
                .filter(
                    and_(
                        SecurityEvent.event_type == "failed_authentication",
                        SecurityEvent.user_id == user_id,
                        SecurityEvent.created_at
                        >= datetime.utcnow() - timedelta(minutes=30),
                    )
                )
                .count()
            )

            if recent_failures >= self.thresholds["failed_logins"]:
                await self._lock_account(user_id, "excessive_failed_logins")

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error handling failed authentication: {str(e)}",
            )

    async def detect_suspicious_patterns(
        self, user_id: int, territory_id: int, action: str, resource_type: str
    ) -> None:
        """Detect suspicious access patterns."""
        try:
            # Check access rate
            access_count = await self._get_access_rate(user_id)
            if access_count > self.thresholds["phi_access_rate"]:
                await self._create_security_alert(
                    alert_type="excessive_access",
                    severity="high",
                    user_id=user_id,
                    territory_id=territory_id,
                    details={
                        "access_count": access_count,
                        "threshold": self.thresholds["phi_access_rate"],
                    },
                )

            # Check territory switching
            territory_switches = await self._get_territory_switches(user_id)
            if territory_switches > self.thresholds["territory_switches"]:
                await self._create_security_alert(
                    alert_type="territory_hopping",
                    severity="high",
                    user_id=user_id,
                    territory_id=territory_id,
                    details={
                        "switch_count": territory_switches,
                        "threshold": self.thresholds["territory_switches"],
                    },
                )

            # Check off-hours access
            if await self._is_off_hours_access():
                await self._create_security_alert(
                    alert_type="off_hours_access",
                    severity="medium",
                    user_id=user_id,
                    territory_id=territory_id,
                    details={
                        "access_time": datetime.utcnow().isoformat(),
                        "allowed_hours": self.thresholds["off_hours_access"],
                    },
                )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error detecting suspicious patterns: {str(e)}"
            )

    async def get_security_metrics(
        self,
        start_date: datetime,
        end_date: datetime,
        territory_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Get security metrics for the dashboard."""
        try:
            # Base query
            query = self.db.query(SecurityEvent)

            if territory_id:
                query = query.filter(SecurityEvent.territory_id == territory_id)

            query = query.filter(
                and_(
                    SecurityEvent.created_at >= start_date,
                    SecurityEvent.created_at <= end_date,
                )
            )

            # Calculate metrics
            metrics = {
                "total_events": query.count(),
                "by_severity": dict(
                    query.with_entities(
                        SecurityEvent.severity, func.count(SecurityEvent.id)
                    )
                    .group_by(SecurityEvent.severity)
                    .all()
                ),
                "by_type": dict(
                    query.with_entities(
                        SecurityEvent.event_type, func.count(SecurityEvent.id)
                    )
                    .group_by(SecurityEvent.event_type)
                    .all()
                ),
                "active_incidents": (
                    self.db.query(SecurityIncident)
                    .filter(SecurityIncident.status != "resolved")
                    .count()
                ),
                "compliance_status": await self._get_compliance_status(),
            }

            return metrics

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error retrieving security metrics: {str(e)}"
            )

    async def _evaluate_rule(self, rule: ThreatDetectionRule) -> None:
        """Evaluate a threat detection rule."""
        try:
            # Get events matching rule criteria
            events = (
                self.db.query(SecurityEvent)
                .filter(
                    and_(
                        SecurityEvent.event_type.in_(rule.event_types),
                        SecurityEvent.severity.in_(rule.severity_levels),
                        SecurityEvent.created_at
                        >= (datetime.utcnow() - timedelta(minutes=rule.time_window)),
                    )
                )
                .all()
            )

            if len(events) >= rule.threshold:
                await self._create_security_alert(
                    alert_type=rule.alert_type,
                    severity=rule.severity,
                    details={
                        "rule_id": rule.id,
                        "rule_name": rule.name,
                        "matched_events": len(events),
                        "threshold": rule.threshold,
                    },
                )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error evaluating rule: {str(e)}"
            )

    async def _check_cloudtrail_events(self) -> None:
        """Check AWS CloudTrail events for security issues."""
        try:
            # Get recent CloudTrail events
            response = self.cloudtrail.lookup_events(
                LookupAttributes=[
                    {"AttributeKey": "ReadOnly", "AttributeValue": "false"}
                ],
                StartTime=datetime.utcnow() - timedelta(minutes=5),
            )

            for event in response["Events"]:
                # Parse event
                event_data = json.loads(event["CloudTrailEvent"])

                # Check for sensitive operations
                if event_data["eventType"] in ["AwsApiCall", "AwsConsoleAction"]:
                    if any(
                        s in event_data["eventName"].lower()
                        for s in ["delete", "update", "modify"]
                    ):
                        await self._create_security_alert(
                            alert_type="sensitive_aws_operation",
                            severity="high",
                            details={
                                "event_name": event_data["eventName"],
                                "event_time": event_data["eventTime"],
                                "aws_region": event_data["awsRegion"],
                                "source_ip": event_data["sourceIPAddress"],
                            },
                        )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error checking CloudTrail events: {str(e)}"
            )

    async def _create_security_alert(
        self,
        alert_type: str,
        severity: str,
        user_id: Optional[int] = None,
        territory_id: Optional[int] = None,
        details: Optional[Dict] = None,
    ) -> None:
        """Create a security alert and notify relevant parties."""
        try:
            # Create alert
            alert = SecurityAlert(
                alert_type=alert_type,
                severity=severity,
                user_id=user_id,
                territory_id=territory_id,
                details=details or {},
            )
            self.db.add(alert)

            # Create incident if high severity
            if severity == "high":
                incident = SecurityIncident(
                    incident_type=alert_type,
                    severity=severity,
                    status="open",
                    user_id=user_id,
                    territory_id=territory_id,
                    details=details or {},
                )
                self.db.add(incident)

            # Send notifications
            await self._send_security_notifications(alert)

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Error creating security alert: {str(e)}"
            )

    async def _lock_account(self, user_id: int, reason: str) -> None:
        """Lock a user account for security reasons."""
        try:
            # Update user status
            user = self.db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_active = False
                user.locked_reason = reason
                user.locked_at = datetime.utcnow()

                # Create security event
                event = SecurityEvent(
                    event_type="account_lockout",
                    user_id=user_id,
                    severity="high",
                    details={
                        "reason": reason,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                )
                self.db.add(event)

                # Notify user and security team
                await self._send_lockout_notifications(user_id, reason)

                self.db.commit()

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Error locking account: {str(e)}"
            )

    async def _send_security_notifications(self, alert: SecurityAlert) -> None:
        """Send security alert notifications."""
        try:
            # Get notification recipients
            recipients = await self._get_security_team_members(alert.territory_id)

            # Send notifications
            await self.notification_service.send_notification(
                user_ids=recipients,
                notification_type="security_alert",
                data={
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "details": alert.details,
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

            # Send SNS alert for high severity
            if alert.severity == "high":
                await self._send_sns_alert(alert)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error sending security notifications: {str(e)}",
            )

    async def _send_sns_alert(self, alert: SecurityAlert) -> None:
        """Send alert to AWS SNS topic."""
        try:
            message = {
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "details": alert.details,
                "timestamp": datetime.utcnow().isoformat(),
            }

            self.sns.publish(
                TopicArn=self.settings.SECURITY_ALERTS_SNS_TOPIC,
                Message=json.dumps(message),
                Subject=f"High Severity Security Alert: {alert.alert_type}",
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error sending SNS alert: {str(e)}"
            )

    async def _get_security_team_members(
        self, territory_id: Optional[int]
    ) -> List[int]:
        """Get security team members for notifications."""
        try:
            query = self.db.query(User).filter(
                User.roles.contains(["security_officer"])
            )

            if territory_id:
                query = query.filter(User.primary_territory_id == territory_id)

            return [user.id for user in query.all()]

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error getting security team members: {str(e)}"
            )

    async def _get_compliance_status(self) -> Dict[str, Any]:
        """Get current compliance status."""
        try:
            # Get latest compliance check results
            latest_check = (
                self.db.query(ComplianceCheck)
                .order_by(ComplianceCheck.created_at.desc())
                .first()
            )

            if not latest_check:
                return {"status": "unknown", "last_check": None, "violations": []}

            return {
                "status": (
                    "compliant" if not latest_check.violations else "non_compliant"
                ),
                "last_check": latest_check.created_at.isoformat(),
                "violations": latest_check.violations,
            }

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error getting compliance status: {str(e)}"
            )
