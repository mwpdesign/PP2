"""Audit logging module for HIPAA compliance."""
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID as PyUUID

from app.core.config import settings
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column


class AuditLogger:
    """HIPAA-compliant audit logging."""

    def __init__(self):
        """Initialize audit logger with HIPAA-compliant configuration."""
        self.logger = logging.getLogger("hipaa_audit")
        self.logger.setLevel(logging.INFO)

        # Configure file handler for audit logs
        handler = logging.FileHandler(
            f"logs/hipaa_audit_{datetime.now().strftime('%Y%m')}.log"
        )
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"event": %(message)s}'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def log_action(
        self,
        action: str,
        user_id: PyUUID,
        resource_id: PyUUID,
        resource_type: str,
        organization_id: PyUUID,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        severity: str = "info"
    ) -> None:
        """
        Log an auditable action in HIPAA-compliant format.

        Args:
            action: Type of action being performed
            user_id: ID of user performing the action
            resource_id: ID of resource being acted upon
            resource_type: Type of resource (user, patient, etc.)
            organization_id: Organization ID for data segregation
            details: Additional details about the action
            status: Outcome status of the action
            severity: Severity level of the action
        """
        try:
            audit_event = {
                "action": action,
                "user_id": str(user_id),
                "resource_id": str(resource_id),
                "resource_type": resource_type,
                "organization_id": str(organization_id),
                "status": status,
                "severity": severity,
                "source_ip": self._get_source_ip(),
                "session_id": self._get_session_id(),
                "details": details or {}
            }

            # Log the audit event
            self.logger.info(json.dumps(audit_event))

            # Handle high-severity events
            if severity in ["critical", "high"]:
                self._handle_high_severity_event(audit_event)

        except Exception as e:
            # Log audit logging failures separately
            self.logger.error(
                json.dumps({
                    "error": "Audit logging failed",
                    "details": str(e),
                    "original_action": action
                })
            )

    def log_phi_access(
        self,
        user_id: PyUUID,
        patient_id: PyUUID,
        action: str,
        reason: str,
        organization_id: PyUUID,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log PHI access events with special handling.

        Args:
            user_id: ID of user accessing PHI
            patient_id: ID of patient whose PHI is being accessed
            action: Type of access (view, modify, etc.)
            reason: Business reason for PHI access
            organization_id: Organization ID for data segregation
            details: Additional details about the access
        """
        phi_event = {
            "action": f"phi_{action}",
            "user_id": str(user_id),
            "patient_id": str(patient_id),
            "reason": reason,
            "organization_id": str(organization_id),
            "access_type": "phi",
            "details": details or {}
        }

        # Log PHI access with high severity
        self.log_action(
            action=f"phi_{action}",
            user_id=user_id,
            resource_id=patient_id,
            resource_type="patient",
            organization_id=organization_id,
            details=phi_event,
            severity="high"
        )

    def log_security_event(
        self,
        event_type: str,
        user_id: Optional[PyUUID],
        status: str,
        organization_id: PyUUID,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log security-related events.

        Args:
            event_type: Type of security event
            user_id: ID of user involved (if applicable)
            status: Outcome status of the event
            organization_id: Organization ID for data segregation
            details: Additional details about the event
        """
        security_event = {
            "event_type": event_type,
            "user_id": str(user_id) if user_id else None,
            "status": status,
            "organization_id": str(organization_id),
            "details": details or {}
        }

        self.log_action(
            action="security_event",
            user_id=user_id or PyUUID(int=0),
            resource_id=PyUUID(int=0),
            resource_type="security",
            organization_id=organization_id,
            details=security_event,
            severity="high"
        )

    def _get_source_ip(self) -> Optional[str]:
        """Get source IP from request context."""
        # Implement request context access
        return None

    def _get_session_id(self) -> Optional[str]:
        """Get current session ID."""
        # Implement session ID retrieval
        return None

    def _handle_high_severity_event(self, event: Dict[str, Any]) -> None:
        """Handle high-severity audit events."""
        if not settings.AUDIT_ENABLE_OBJECT_LOGGING:
            return

        # Log full event details for high-severity events
        self.logger.warning(
            json.dumps({
                "high_severity_event": True,
                "event_data": event,
                "timestamp": datetime.utcnow().isoformat()
            })
        )


# Initialize global audit logger instance
audit_logger = AuditLogger()


def audit_shipping_operation(
    operation: str,
    user_id: PyUUID,
    order_id: PyUUID,
    organization_id: PyUUID,
    carrier: str,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """
    Audit shipping-related operations.

    Args:
        operation: Type of shipping operation (rate_check, label_creation,
            etc.)
        user_id: ID of user performing the operation
        order_id: ID of the order being shipped
        organization_id: Organization ID for data segregation
        carrier: Shipping carrier being used
        details: Additional details about the operation
    """
    shipping_event = {
        "operation": operation,
        "carrier": carrier,
        "order_id": str(order_id),
        "details": details or {}
    }

    audit_logger.log_action(
        action=f"shipping_{operation}",
        user_id=user_id,
        resource_id=order_id,
        resource_type="shipping",
        organization_id=organization_id,
        details=shipping_event,
        severity="info"
    )


"""Audit mixin for tracking model changes."""


class AuditMixin:
    """Mixin class for adding audit fields to models."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )

    # Relationships
    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        backref="created_records"
    )
    updated_by = relationship(
        "User",
        foreign_keys=[updated_by_id],
        backref="updated_records"
    )
