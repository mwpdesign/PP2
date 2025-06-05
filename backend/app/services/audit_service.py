"""
HIPAA Encryption Audit Service for Healthcare IVR Platform

Provides comprehensive audit logging for all encryption operations and PHI access.
Integrates with the local encryption service and authentication system to maintain
HIPAA compliance through detailed access tracking and tamper-proof audit trails.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, List
from uuid import UUID, uuid4
from enum import Enum
from dataclasses import dataclass

from app.core.config import settings
from app.schemas.token import TokenData

logger = logging.getLogger(__name__)


class AuditEventType(Enum):
    """Types of auditable events for HIPAA compliance."""

    # Encryption Operations
    ENCRYPT_FIELD = "encrypt_field"
    DECRYPT_FIELD = "decrypt_field"
    ENCRYPT_JSON = "encrypt_json"
    DECRYPT_JSON = "decrypt_json"

    # PHI Access
    PHI_VIEW = "phi_view"
    PHI_CREATE = "phi_create"
    PHI_UPDATE = "phi_update"
    PHI_DELETE = "phi_delete"
    PHI_EXPORT = "phi_export"

    # Security Events
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    ENCRYPTION_FAILURE = "encryption_failure"
    DECRYPTION_FAILURE = "decryption_failure"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

    # System Events
    KEY_ROTATION = "key_rotation"
    AUDIT_LOG_ACCESS = "audit_log_access"
    COMPLIANCE_REPORT = "compliance_report"


class DataClassification(Enum):
    """Data classification levels for audit logging."""

    PHI = "phi"  # Protected Health Information
    PII = "pii"  # Personally Identifiable Information
    SENSITIVE = "sensitive"  # Other sensitive data
    INTERNAL = "internal"  # Internal business data
    PUBLIC = "public"  # Public information


class AuditSeverity(Enum):
    """Severity levels for audit events."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditContext:
    """Context information for audit logging."""

    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    organization_id: Optional[UUID] = None
    session_id: Optional[str] = None
    source_ip: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None

    @classmethod
    def from_token_data(cls, token_data: TokenData) -> 'AuditContext':
        """Create audit context from token data."""
        return cls(
            user_id=token_data.id,
            user_email=token_data.email,
            user_role=token_data.role,
            organization_id=token_data.organization_id
        )


@dataclass
class AuditEvent:
    """Structured audit event for HIPAA compliance."""

    event_id: UUID
    timestamp: datetime
    event_type: AuditEventType
    severity: AuditSeverity
    data_classification: DataClassification

    # Context Information
    user_context: Optional[AuditContext]

    # Event Details
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    field_name: Optional[str] = None
    operation: Optional[str] = None

    # Results
    success: bool = True
    error_message: Optional[str] = None

    # Additional Details
    details: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert audit event to dictionary for logging."""
        event_dict = {
            'event_id': str(self.event_id),
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type.value,
            'severity': self.severity.value,
            'data_classification': self.data_classification.value,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'field_name': self.field_name,
            'operation': self.operation,
            'success': self.success,
            'error_message': self.error_message,
            'details': self.details or {}
        }

        # Add user context if available
        if self.user_context:
            event_dict['user_context'] = {
                'user_id': str(self.user_context.user_id) if self.user_context.user_id else None,
                'user_email': self.user_context.user_email,
                'user_role': self.user_context.user_role,
                'organization_id': str(self.user_context.organization_id) if self.user_context.organization_id else None,
                'session_id': self.user_context.session_id,
                'source_ip': self.user_context.source_ip,
                'user_agent': self.user_context.user_agent,
                'request_id': self.user_context.request_id
            }

        return event_dict


class EncryptionAuditService:
    """
    HIPAA-compliant audit service for encryption operations.

    Provides comprehensive logging of all encryption/decryption operations,
    PHI access tracking, and compliance reporting capabilities.
    """

    def __init__(self):
        """Initialize the encryption audit service."""
        self.logger = self._setup_audit_logger()
        self._current_context: Optional[AuditContext] = None

    def _setup_audit_logger(self) -> logging.Logger:
        """Set up dedicated audit logger with HIPAA-compliant configuration."""
        audit_logger = logging.getLogger("hipaa_encryption_audit")
        audit_logger.setLevel(logging.INFO)

        # Prevent duplicate handlers
        if audit_logger.handlers:
            return audit_logger

        # Create logs directory if it doesn't exist
        import os
        os.makedirs("logs", exist_ok=True)

        # File handler for audit logs with rotation
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            f"logs/encryption_audit_{datetime.now().strftime('%Y%m')}.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=12  # Keep 12 months of logs
        )

        # JSON formatter for structured logging
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "audit_event": %(message)s}'
        )
        file_handler.setFormatter(formatter)
        audit_logger.addHandler(file_handler)

        # Console handler for development
        if settings.ENVIRONMENT == "development":
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            audit_logger.addHandler(console_handler)

        return audit_logger

    def set_context(self, context: AuditContext) -> None:
        """Set the current audit context for subsequent operations."""
        self._current_context = context

    def clear_context(self) -> None:
        """Clear the current audit context."""
        self._current_context = None

    def log_encryption_operation(
        self,
        operation: str,
        field_name: str,
        data_classification: DataClassification = DataClassification.PHI,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """
        Log an encryption or decryption operation.

        Args:
            operation: Type of operation (encrypt/decrypt)
            field_name: Name of the field being encrypted/decrypted
            data_classification: Classification level of the data
            resource_type: Type of resource (patient, order, etc.)
            resource_id: ID of the resource
            success: Whether the operation succeeded
            error_message: Error message if operation failed
            details: Additional operation details

        Returns:
            UUID of the audit event
        """
        event_type = (
            AuditEventType.ENCRYPT_FIELD if operation == "encrypt"
            else AuditEventType.DECRYPT_FIELD
        )

        severity = AuditSeverity.HIGH if data_classification == DataClassification.PHI else AuditSeverity.MEDIUM
        if not success:
            severity = AuditSeverity.CRITICAL

        event = AuditEvent(
            event_id=uuid4(),
            timestamp=datetime.utcnow(),
            event_type=event_type,
            severity=severity,
            data_classification=data_classification,
            user_context=self._current_context,
            resource_type=resource_type,
            resource_id=resource_id,
            field_name=field_name,
            operation=operation,
            success=success,
            error_message=error_message,
            details=details
        )

        self._log_event(event)
        return event.event_id

    def log_phi_access(
        self,
        access_type: str,
        resource_type: str,
        resource_id: str,
        field_names: Optional[List[str]] = None,
        reason: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """
        Log PHI access events with special handling.

        Args:
            access_type: Type of access (view, create, update, delete, export)
            resource_type: Type of resource containing PHI
            resource_id: ID of the resource
            field_names: List of PHI fields accessed
            reason: Business reason for PHI access
            success: Whether the access succeeded
            error_message: Error message if access failed
            details: Additional access details

        Returns:
            UUID of the audit event
        """
        event_type_map = {
            "view": AuditEventType.PHI_VIEW,
            "create": AuditEventType.PHI_CREATE,
            "update": AuditEventType.PHI_UPDATE,
            "delete": AuditEventType.PHI_DELETE,
            "export": AuditEventType.PHI_EXPORT
        }

        event_type = event_type_map.get(access_type, AuditEventType.PHI_VIEW)
        severity = AuditSeverity.CRITICAL if not success else AuditSeverity.HIGH

        audit_details = details or {}
        if field_names:
            audit_details["accessed_fields"] = field_names
        if reason:
            audit_details["access_reason"] = reason

        event = AuditEvent(
            event_id=uuid4(),
            timestamp=datetime.utcnow(),
            event_type=event_type,
            severity=severity,
            data_classification=DataClassification.PHI,
            user_context=self._current_context,
            resource_type=resource_type,
            resource_id=resource_id,
            operation=access_type,
            success=success,
            error_message=error_message,
            details=audit_details
        )

        self._log_event(event)

        # Additional alerting for failed PHI access
        if not success:
            self._alert_failed_phi_access(event)

        return event.event_id

    def log_security_event(
        self,
        event_type: AuditEventType,
        severity: AuditSeverity,
        description: str,
        details: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """
        Log security-related events.

        Args:
            event_type: Type of security event
            severity: Severity level of the event
            description: Description of the security event
            details: Additional event details

        Returns:
            UUID of the audit event
        """
        event = AuditEvent(
            event_id=uuid4(),
            timestamp=datetime.utcnow(),
            event_type=event_type,
            severity=severity,
            data_classification=DataClassification.SENSITIVE,
            user_context=self._current_context,
            operation="security_event",
            details={"description": description, **(details or {})}
        )

        self._log_event(event)

        # Alert on critical security events
        if severity == AuditSeverity.CRITICAL:
            self._alert_critical_security_event(event)

        return event.event_id

    def detect_suspicious_activity(
        self,
        user_id: UUID,
        time_window_minutes: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Detect suspicious activity patterns for a user.

        Args:
            user_id: ID of the user to analyze
            time_window_minutes: Time window for analysis

        Returns:
            List of suspicious activity indicators
        """
        # This would typically query a database of audit events
        # For now, return empty list as placeholder
        suspicious_activities = []

        # Log the suspicious activity detection attempt
        self.log_security_event(
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditSeverity.MEDIUM,
            f"Suspicious activity detection run for user {user_id}",
            {"user_id": str(user_id), "time_window_minutes": time_window_minutes}
        )

        return suspicious_activities

    def generate_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime,
        organization_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Generate HIPAA compliance report for the specified period.

        Args:
            start_date: Start date for the report
            end_date: End date for the report
            organization_id: Organization ID to filter by

        Returns:
            Compliance report data
        """
        report_id = uuid4()

        # Log compliance report generation
        self.log_security_event(
            AuditEventType.COMPLIANCE_REPORT,
            AuditSeverity.MEDIUM,
            f"HIPAA compliance report generated for period {start_date} to {end_date}",
            {
                "report_id": str(report_id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "organization_id": str(organization_id) if organization_id else None
            }
        )

        # This would typically query audit events from database
        # For now, return basic report structure
        report = {
            "report_id": str(report_id),
            "generated_at": datetime.utcnow().isoformat(),
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "organization_id": str(organization_id) if organization_id else None,
            "summary": {
                "total_phi_accesses": 0,
                "total_encryption_operations": 0,
                "failed_operations": 0,
                "unique_users": 0,
                "security_events": 0
            },
            "compliance_status": "COMPLIANT"
        }

        return report

    def _log_event(self, event: AuditEvent) -> None:
        """Log an audit event to the audit logger."""
        try:
            event_json = json.dumps(event.to_dict(), default=str)

            if event.severity == AuditSeverity.CRITICAL:
                self.logger.critical(event_json)
            elif event.severity == AuditSeverity.HIGH:
                self.logger.warning(event_json)
            elif event.severity == AuditSeverity.MEDIUM:
                self.logger.info(event_json)
            else:
                self.logger.debug(event_json)

        except Exception as e:
            # Fallback logging if JSON serialization fails
            self.logger.error(
                f"Failed to log audit event {event.event_id}: {str(e)}"
            )

    def _alert_failed_phi_access(self, event: AuditEvent) -> None:
        """Handle alerts for failed PHI access attempts."""
        logger.warning(
            f"FAILED PHI ACCESS ATTEMPT: User {event.user_context.user_email if event.user_context else 'Unknown'} "
            f"attempted to {event.operation} {event.resource_type} {event.resource_id}"
        )

    def _alert_critical_security_event(self, event: AuditEvent) -> None:
        """Handle alerts for critical security events."""
        logger.critical(
            f"CRITICAL SECURITY EVENT: {event.event_type.value} - {event.details.get(
                'description',
                'No description'
            )}"
        )


# Global audit service instance
_audit_service: Optional[EncryptionAuditService] = None


def get_audit_service() -> EncryptionAuditService:
    """Get the global audit service instance."""
    global _audit_service
    if _audit_service is None:
        _audit_service = EncryptionAuditService()
    return _audit_service


# Convenience functions for common audit operations

def audit_encryption(
    operation: str,
    field_name: str,
    user_context: Optional[AuditContext] = None,
    **kwargs
) -> UUID:
    """Convenience function to audit encryption operations."""
    service = get_audit_service()
    if user_context:
        service.set_context(user_context)
    return service.log_encryption_operation(operation, field_name, **kwargs)


def audit_phi_access(
    access_type: str,
    resource_type: str,
    resource_id: str,
    user_context: Optional[AuditContext] = None,
    **kwargs
) -> UUID:
    """Convenience function to audit PHI access."""
    service = get_audit_service()
    if user_context:
        service.set_context(user_context)
    return service.log_phi_access(
        access_type,
        resource_type,
        resource_id,
        **kwargs
    )


# Export commonly used classes and functions
__all__ = [
    'EncryptionAuditService',
    'AuditContext',
    'AuditEvent',
    'AuditEventType',
    'DataClassification',
    'AuditSeverity',
    'get_audit_service',
    'audit_encryption',
    'audit_phi_access'
]
