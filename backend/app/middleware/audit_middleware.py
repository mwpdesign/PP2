"""
HIPAA-Compliant Audit Middleware
Phase 2: Foundation Systems - Task ID: mbrgdnzkoihwtfftils

Automatically logs all patient data access, API endpoint usage,
and authentication events for HIPAA compliance.
"""

import json
import time
import logging
from typing import Callable, Optional
from uuid import uuid4

from fastapi import Request, Response
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.security import get_current_user_from_token
from app.services.comprehensive_audit_service import (
    ComprehensiveAuditService,
    ActionType,
    ResourceType,
    AuditContext,
    get_audit_service
)

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    HIPAA-compliant audit middleware.

    Automatically logs:
    - All API endpoint access
    - Patient data access
    - Authentication events
    - Security violations
    """

    def __init__(self, app, skip_paths: Optional[list] = None):
        """
        Initialize audit middleware.

        Args:
            app: FastAPI application instance
            skip_paths: List of paths to skip auditing (e.g., health checks)
        """
        super().__init__(app)
        self.skip_paths = skip_paths or [
            "/health",
            "/docs",
            "/openapi.json",
            "/favicon.ico"
        ]
        self.security = HTTPBearer(auto_error=False)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and response with audit logging."""

        # Skip auditing for certain paths
        if any(request.url.path.startswith(path) for path in self.skip_paths):
            return await call_next(request)

        # Generate request ID for tracking
        request_id = str(uuid4())
        request.state.request_id = request_id

        # Start timing
        start_time = time.time()

        # Extract user information if available
        current_user = None
        audit_context = None

        try:
            # Try to get current user from token
            authorization = request.headers.get("authorization")
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                current_user = await get_current_user_from_token(token)

                if current_user:
                    audit_context = AuditContext(
                        user_id=current_user.id,
                        organization_id=current_user.organization_id,
                        ip_address=request.client.host if request.client else "127.0.0.1",
                        user_agent=request.headers.get("user-agent"),
                        session_id=request.headers.get("x-session-id"),
                        request_id=request_id
                    )
        except Exception as e:
            logger.warning(f"Failed to extract user from token: {str(e)}")

        # Process request
        response = None
        error_occurred = False
        error_message = None

        try:
            response = await call_next(request)
        except Exception as e:
            error_occurred = True
            error_message = str(e)
            logger.error(f"Request failed: {error_message}")
            raise
        finally:
            # Calculate processing time
            process_time = time.time() - start_time

            # Log the request if we have audit context
            if audit_context:
                await self._log_api_access(
                    audit_context=audit_context,
                    request=request,
                    response=response,
                    process_time=process_time,
                    error_occurred=error_occurred,
                    error_message=error_message
                )

            # Log authentication failures
            elif request.url.path.startswith("/api/") and not current_user:
                await self._log_unauthenticated_access(
                    request=request,
                    response=response,
                    request_id=request_id
                )

        return response

    async def _log_api_access(
        self,
        audit_context: AuditContext,
        request: Request,
        response: Optional[Response],
        process_time: float,
        error_occurred: bool,
        error_message: Optional[str]
    ) -> None:
        """Log API access for audit trail."""

        try:
            # Determine action type based on HTTP method and path
            action_type = self._determine_action_type(request)
            resource_type = self._determine_resource_type(request)

            # Extract patient ID if this is a patient-related request
            patient_id = self._extract_patient_id(request)

            # Prepare metadata
            metadata = {
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "process_time": process_time,
                "status_code": response.status_code if response else None,
                "request_size": request.headers.get("content-length"),
                "response_size": response.headers.get("content-length") if response else None
            }

            # Add PHI access information if applicable
            if patient_id:
                metadata["phi_access"] = True
                metadata["patient_id"] = str(patient_id)
                metadata["accessed_fields"] = self._extract_accessed_fields(request)

            # Get audit service and log the access
            from app.core.database import get_db
            db = next(get_db())
            audit_service = get_audit_service(db)

            if patient_id:
                # Log as PHI access
                await audit_service.log_phi_access(
                    context=audit_context,
                    patient_id=patient_id,
                    action=action_type,
                    resource_type=resource_type,
                    accessed_fields=metadata.get("accessed_fields"),
                    reason=f"API access: {request.method} {request.url.path}",
                    metadata=metadata
                )
            else:
                # Log as general user action
                await audit_service.log_user_action(
                    context=audit_context,
                    action=action_type,
                    resource_type=resource_type,
                    metadata=metadata,
                    success=not error_occurred,
                    error_message=error_message
                )

        except Exception as e:
            logger.error(f"Failed to log API access: {str(e)}")

    async def _log_unauthenticated_access(
        self,
        request: Request,
        response: Optional[Response],
        request_id: str
    ) -> None:
        """Log unauthenticated access attempts."""

        try:
            # Create a basic audit context for unauthenticated requests
            audit_context = AuditContext(
                user_id=None,  # No user for unauthenticated requests
                organization_id=None,
                ip_address=request.client.host if request.client else "127.0.0.1",
                user_agent=request.headers.get("user-agent"),
                request_id=request_id
            )

            metadata = {
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code if response else None,
                "unauthenticated_access": True
            }

            # Log as security event if this looks suspicious
            if response and response.status_code == 401:
                from app.core.database import get_db
                db = next(get_db())
                audit_service = get_audit_service(db)

                await audit_service.log_security_event(
                    context=audit_context,
                    event_type=ActionType.UNAUTHORIZED_ACCESS,
                    severity="medium",
                    description=f"Unauthorized access attempt to {request.url.path}",
                    metadata=metadata
                )

        except Exception as e:
            logger.error(f"Failed to log unauthenticated access: {str(e)}")

    def _determine_action_type(self, request: Request) -> ActionType:
        """Determine the action type based on request method and path."""

        method = request.method.upper()
        path = request.url.path.lower()

        # Authentication endpoints
        if "/auth/" in path or "/login" in path:
            return ActionType.LOGIN_SUCCESS if method == "POST" else ActionType.LOGOUT

        # Patient-related endpoints
        if "/patients/" in path:
            if method == "GET":
                return ActionType.PHI_ACCESS
            elif method in ["POST", "PUT", "PATCH"]:
                return ActionType.PHI_EDIT
            elif method == "DELETE":
                return ActionType.PHI_DELETE

        # IVR-related endpoints
        if "/ivr/" in path:
            if "status" in path:
                return ActionType.IVR_STATUS_CHANGE
            elif method == "POST":
                return ActionType.IVR_CREATED
            elif "approve" in path:
                return ActionType.IVR_APPROVED
            elif "reject" in path:
                return ActionType.IVR_REJECTED

        # Order-related endpoints
        if "/orders/" in path:
            if method == "POST":
                return ActionType.ORDER_CREATED
            elif "status" in path:
                return ActionType.ORDER_STATUS_CHANGE

        # Default to PHI access for GET requests, PHI edit for modifications
        if method == "GET":
            return ActionType.PHI_ACCESS
        elif method in ["POST", "PUT", "PATCH"]:
            return ActionType.PHI_EDIT
        elif method == "DELETE":
            return ActionType.PHI_DELETE

        return ActionType.PHI_ACCESS

    def _determine_resource_type(self, request: Request) -> ResourceType:
        """Determine the resource type based on request path."""

        path = request.url.path.lower()

        if "/patients/" in path:
            return ResourceType.PATIENT
        elif "/ivr/" in path:
            return ResourceType.IVR
        elif "/orders/" in path:
            return ResourceType.ORDER
        elif "/users/" in path:
            return ResourceType.USER
        elif "/documents/" in path:
            return ResourceType.DOCUMENT
        elif "/reports/" in path:
            return ResourceType.REPORT

        return ResourceType.SYSTEM

    def _extract_patient_id(self, request: Request) -> Optional[str]:
        """Extract patient ID from request path or body."""

        path = request.url.path

        # Look for patient ID in path parameters
        if "/patients/" in path:
            parts = path.split("/")
            try:
                patient_index = parts.index("patients")
                if patient_index + 1 < len(parts):
                    return parts[patient_index + 1]
            except (ValueError, IndexError):
                pass

        # Look for patient_id in query parameters
        if "patient_id" in request.query_params:
            return request.query_params["patient_id"]

        return None

    def _extract_accessed_fields(self, request: Request) -> list:
        """Extract which PHI fields might be accessed based on request."""

        # This is a simplified implementation
        # In a real system, you'd analyze the request body and query parameters
        # to determine exactly which fields are being accessed

        if request.method == "GET":
            # For GET requests, assume all fields might be accessed
            return ["first_name", "last_name", "dob", "ssn", "phone", "email", "address"]

        # For other methods, you'd need to parse the request body
        # to determine which specific fields are being modified
        return []