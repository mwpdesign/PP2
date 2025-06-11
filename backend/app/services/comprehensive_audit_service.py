"""
Comprehensive HIPAA-Compliant Audit Service
Phase 2: Foundation Systems - Task ID: mbrgdnzkoihwtfftils

Provides centralized audit logging for all system actions and PHI access.
Ensures HIPAA compliance through immutable audit trails and comprehensive
tracking.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from enum import Enum
from dataclasses import dataclass
from ipaddress import ip_address

from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import Request, HTTPException

from app.core.config import settings
from app.schemas.token import TokenData

logger = logging.getLogger(__name__)


class ActionType(Enum):
    """HIPAA-compliant action types for audit logging."""

    # PHI Access Actions
    PHI_ACCESS = "phi_access"
    PHI_EDIT = "phi_edit"
    PHI_CREATE = "phi_create"
    PHI_DELETE = "phi_delete"
    PHI_EXPORT = "phi_export"

    # Authentication Actions
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"

    # System Actions
    IVR_STATUS_CHANGE = "ivr_status_change"
    IVR_CREATED = "ivr_created"
    IVR_APPROVED = "ivr_approved"
    IVR_REJECTED = "ivr_rejected"

    # Order Management
    ORDER_CREATED = "order_created"
    ORDER_STATUS_CHANGE = "order_status_change"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"

    # Administrative Actions
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DEACTIVATED = "user_deactivated"
    PERMISSION_CHANGED = "permission_changed"
    ROLE_ASSIGNED = "role_assigned"

    # Data Export and Compliance
    EXPORT_DATA = "export_data"
    COMPLIANCE_REPORT = "compliance_report"
    AUDIT_LOG_ACCESS = "audit_log_access"

    # Security Events
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    SECURITY_VIOLATION = "security_violation"

    # System Events
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    SYSTEM_MIGRATION = "system_migration"


class ResourceType(Enum):
    """Types of resources that can be audited."""

    PATIENT = "patient"
    IVR = "ivr"
    ORDER = "order"
    USER = "user"
    ORGANIZATION = "organization"
    DOCUMENT = "document"
    REPORT = "report"
    AUDIT_LOG = "audit_log"
    SYSTEM = "system"


@dataclass
class AuditContext:
    """Context information for audit logging."""

    user_id: UUID
    organization_id: UUID
    ip_address: str
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None


class ComprehensiveAuditService:
    """
    Comprehensive HIPAA-compliant audit service.

    Provides centralized audit logging for all system actions with:
    - Immutable audit trails
    - PHI access tracking
    - Security event monitoring
    - Compliance reporting
    - Export capabilities
    """

    def __init__(self, db: Session):
        """Initialize the audit service."""
        self.db = db
        self.logger = self._setup_audit_logger()

    def _setup_audit_logger(self) -> logging.Logger:
        """Set up dedicated audit logger with HIPAA-compliant configuration."""
        audit_logger = logging.getLogger("hipaa_audit")
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
            f"logs/audit_{datetime.now().strftime('%Y%m')}.log",
            maxBytes=50*1024*1024,  # 50MB
            backupCount=24  # Keep 24 months of logs
        )

        # JSON formatter for structured logging
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"audit_event": %(message)s}'
        )
        file_handler.setFormatter(formatter)
        audit_logger.addHandler(file_handler)

        # Console handler for development
        if settings.ENVIRONMENT == "development":
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            audit_logger.addHandler(console_handler)

        return audit_logger

    async def log_phi_access(
        self,
        context: AuditContext,
        patient_id: UUID,
        action: ActionType,
        resource_type: ResourceType,
        resource_id: Optional[UUID] = None,
        accessed_fields: Optional[List[str]] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """
        Log PHI access for HIPAA compliance.

        Args:
            context: Audit context with user and request information
            patient_id: ID of patient whose PHI is being accessed
            action: Type of action being performed
            resource_type: Type of resource being accessed
            resource_id: ID of the specific resource
            accessed_fields: List of PHI fields that were accessed
            reason: Reason for accessing PHI
            metadata: Additional context information

        Returns:
            UUID of the created audit log entry
        """
        try:
            audit_metadata = {
                "accessed_fields": accessed_fields or [],
                "reason": reason,
                "phi_access": True,
                **(metadata or {})
            }

            audit_id = await self._create_audit_log(
                context=context,
                action_type=action,
                resource_type=resource_type,
                resource_id=resource_id,
                patient_id=patient_id,
                metadata=audit_metadata,
                success=True
            )

            # Log to file for additional security
            self.logger.info(json.dumps({
                "audit_id": str(audit_id),
                "action": "PHI_ACCESS",
                "user_id": str(context.user_id),
                "patient_id": str(patient_id),
                "accessed_fields": accessed_fields,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }))

            return audit_id

        except Exception as e:
            logger.error(f"Failed to log PHI access: {str(e)}")
            # Still create a basic audit log for the failure
            await self._create_audit_log(
                context=context,
                action_type=ActionType.PHI_ACCESS,
                resource_type=resource_type,
                resource_id=resource_id,
                patient_id=patient_id,
                metadata={"error": str(e), "original_metadata": metadata},
                success=False,
                error_message=str(e)
            )
            raise HTTPException(
                status_code=500,
                detail="Failed to log PHI access - blocked for compliance"
            )

    async def log_user_action(
        self,
        context: AuditContext,
        action: ActionType,
        resource_type: ResourceType,
        resource_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> UUID:
        """
        Log general user actions.

        Args:
            context: Audit context with user and request information
            action: Type of action being performed
            resource_type: Type of resource being acted upon
            resource_id: ID of the specific resource
            metadata: Additional context information
            success: Whether the action was successful
            error_message: Error message if action failed

        Returns:
            UUID of the created audit log entry
        """
        return await self._create_audit_log(
            context=context,
            action_type=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata,
            success=success,
            error_message=error_message
        )

    async def log_security_event(
        self,
        context: AuditContext,
        event_type: ActionType,
        severity: str = "medium",
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> UUID:
        """
        Log security-related events.

        Args:
            context: Audit context with user and request information
            event_type: Type of security event
            severity: Severity level (low, medium, high, critical)
            description: Description of the security event
            metadata: Additional context information

        Returns:
            UUID of the created audit log entry
        """
        security_metadata = {
            "severity": severity,
            "description": description,
            "security_event": True,
            **(metadata or {})
        }

        audit_id = await self._create_audit_log(
            context=context,
            action_type=event_type,
            resource_type=ResourceType.SYSTEM,
            metadata=security_metadata,
            success=True
        )

        # Log high-severity events to file immediately
        if severity in ["high", "critical"]:
            self.logger.warning(json.dumps({
                "audit_id": str(audit_id),
                "security_event": event_type.value,
                "severity": severity,
                "user_id": str(context.user_id),
                "ip_address": context.ip_address,
                "description": description,
                "timestamp": datetime.utcnow().isoformat()
            }))

        return audit_id

    async def log_data_export(
        self,
        context: AuditContext,
        export_type: str,
        date_range_start: datetime,
        date_range_end: datetime,
        filters: Optional[Dict[str, Any]] = None,
        record_count: int = 0,
        file_hash: Optional[str] = None
    ) -> UUID:
        """
        Log data export operations for compliance tracking.

        Args:
            context: Audit context with user and request information
            export_type: Type of export (CSV, PDF, JSON)
            date_range_start: Start date of exported data
            date_range_end: End date of exported data
            filters: Filters applied to the export
            record_count: Number of records exported
            file_hash: SHA-256 hash of exported file

        Returns:
            UUID of the created audit log entry
        """
        # Create audit log for the export action
        export_metadata = {
            "export_type": export_type,
            "date_range_start": date_range_start.isoformat(),
            "date_range_end": date_range_end.isoformat(),
            "filters": filters or {},
            "record_count": record_count,
            "file_hash": file_hash,
            "data_export": True
        }

        audit_id = await self._create_audit_log(
            context=context,
            action_type=ActionType.EXPORT_DATA,
            resource_type=ResourceType.AUDIT_LOG,
            metadata=export_metadata,
            success=True
        )

        # Also create entry in audit_log_exports table
        from app.models.audit import AuditLogExport

        export_record = AuditLogExport(
            user_id=context.user_id,
            organization_id=context.organization_id,
            export_type=export_type,
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            filters=filters or {},
            record_count=record_count,
            file_hash=file_hash
        )

        self.db.add(export_record)
        await self.db.commit()

        return audit_id

    async def get_audit_logs(
        self,
        organization_id: UUID,
        filters: Optional[Dict[str, Any]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieve audit logs with filtering and pagination.

        Args:
            organization_id: Organization ID to filter by
            filters: Additional filters (user_id, action_type, resource_type, etc.)
            start_date: Start date for filtering
            end_date: End date for filtering
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            Dictionary containing audit logs and metadata
        """
        from app.models.audit import AuditLog

        # Build query
        query = select(AuditLog).where(AuditLog.organization_id == organization_id)

        # Apply date filters
        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
        if end_date:
            query = query.where(AuditLog.created_at <= end_date)

        # Apply additional filters
        if filters:
            if "user_id" in filters:
                query = query.where(AuditLog.user_id == filters["user_id"])
            if "action_type" in filters:
                query = query.where(AuditLog.action_type == filters["action_type"])
            if "resource_type" in filters:
                query = query.where(AuditLog.resource_type == filters["resource_type"])
            if "patient_id" in filters:
                query = query.where(AuditLog.patient_id == filters["patient_id"])
            if "success" in filters:
                query = query.where(AuditLog.success == filters["success"])

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_count = await self.db.execute(count_query)
        total = total_count.scalar()

        # Apply pagination and ordering
        query = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)

        # Execute query
        result = await self.db.execute(query)
        audit_logs = result.scalars().all()

        return {
            "audit_logs": [self._serialize_audit_log(log) for log in audit_logs],
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(audit_logs) < total
        }

    async def _create_audit_log(
        self,
        context: AuditContext,
        action_type: ActionType,
        resource_type: ResourceType,
        resource_id: Optional[UUID] = None,
        patient_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> UUID:
        """Create an audit log entry in the database."""
        from app.models.audit import AuditLog

        # Validate IP address
        try:
            ip_address(context.ip_address)
        except ValueError:
            context.ip_address = "127.0.0.1"  # Fallback for invalid IPs

        audit_log = AuditLog(
            user_id=context.user_id,
            organization_id=context.organization_id,
            action_type=action_type.value,
            resource_type=resource_type.value,
            resource_id=resource_id,
            patient_id=patient_id,
            ip_address=context.ip_address,
            user_agent=context.user_agent,
            session_id=context.session_id,
            request_id=context.request_id,
            metadata=metadata or {},
            success=success,
            error_message=error_message
        )

        self.db.add(audit_log)
        await self.db.commit()
        await self.db.refresh(audit_log)

        return audit_log.id

    def _serialize_audit_log(self, audit_log) -> Dict[str, Any]:
        """Serialize audit log for API response."""
        return {
            "id": str(audit_log.id),
            "user_id": str(audit_log.user_id),
            "organization_id": str(audit_log.organization_id),
            "action_type": audit_log.action_type,
            "resource_type": audit_log.resource_type,
            "resource_id": str(audit_log.resource_id) if audit_log.resource_id else None,
            "patient_id": str(audit_log.patient_id) if audit_log.patient_id else None,
            "ip_address": str(audit_log.ip_address),
            "user_agent": audit_log.user_agent,
            "session_id": audit_log.session_id,
            "request_id": audit_log.request_id,
            "metadata": audit_log.metadata,
            "success": audit_log.success,
            "error_message": audit_log.error_message,
            "created_at": audit_log.created_at.isoformat()
        }


# Utility functions for easy access
def get_audit_service(db: Session) -> ComprehensiveAuditService:
    """Get an instance of the audit service."""
    return ComprehensiveAuditService(db)


def create_audit_context(
    current_user: TokenData,
    request: Request
) -> AuditContext:
    """Create audit context from current user and request."""
    return AuditContext(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent"),
        session_id=request.headers.get("x-session-id"),
        request_id=request.headers.get("x-request-id")
    )