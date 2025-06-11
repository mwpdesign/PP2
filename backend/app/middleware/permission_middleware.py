"""
Permission Middleware and Decorators
Phase 2: Foundation Systems - Role-Based Permissions

Middleware and decorators for enforcing role-based access control.
Integrates with PermissionService and ComprehensiveAuditService.
"""

import logging
from functools import wraps
from typing import List, Optional, Callable, Any
from uuid import UUID

from fastapi import HTTPException, status, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.services.permission_service import get_permission_service
from app.services.comprehensive_audit_service import (
    ComprehensiveAuditService, ActionType, ResourceType, AuditContext,
    create_audit_context
)

logger = logging.getLogger(__name__)


def requires_permission(
    permission_name: str,
    resource_id_param: Optional[str] = None,
    audit_action: Optional[ActionType] = None,
    audit_resource_type: Optional[ResourceType] = None
):
    """
    Decorator to require a specific permission for an endpoint.

    Args:
        permission_name: Name of the required permission
        resource_id_param: Optional parameter name containing resource ID
        audit_action: Optional audit action type for logging
        audit_resource_type: Optional audit resource type for logging

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies from kwargs
            current_user: TokenData = kwargs.get('current_user')
            db: Session = kwargs.get('db')
            request: Request = kwargs.get('request')

            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing required dependencies"
                )

            # Get permission service
            permission_service = get_permission_service(db)

            # Extract resource ID if specified
            resource_id = None
            if resource_id_param and resource_id_param in kwargs:
                resource_id_value = kwargs[resource_id_param]
                if isinstance(resource_id_value, str):
                    try:
                        resource_id = UUID(resource_id_value)
                    except ValueError:
                        resource_id = None
                elif isinstance(resource_id_value, UUID):
                    resource_id = resource_id_value

            # Create audit context if request is available
            audit_context = None
            if request:
                audit_context = create_audit_context(current_user, request)

            # Check permission
            has_permission = await permission_service.check_permission(
                user=current_user,
                permission_name=permission_name,
                resource_id=resource_id,
                audit_context=audit_context
            )

            if not has_permission:
                # Log unauthorized access attempt
                if audit_context and audit_action and audit_resource_type:
                    audit_service = ComprehensiveAuditService(db)
                    await audit_service.log_security_event(
                        context=audit_context,
                        event_type=ActionType.UNAUTHORIZED_ACCESS,
                        severity="high",
                        description=f"Unauthorized access attempt to {permission_name}",
                        metadata={
                            "permission_name": permission_name,
                            "endpoint": request.url.path if request else "unknown",
                            "method": request.method if request else "unknown",
                            "resource_id": str(resource_id) if resource_id else None
                        }
                    )

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions: {permission_name} required"
                )

            # Log successful access if audit parameters provided
            if (audit_context and audit_action and audit_resource_type):
                audit_service = ComprehensiveAuditService(db)
                await audit_service.log_user_action(
                    context=audit_context,
                    action=audit_action,
                    resource_type=audit_resource_type,
                    resource_id=resource_id,
                    metadata={
                        "permission_name": permission_name,
                        "endpoint": request.url.path if request else "unknown",
                        "method": request.method if request else "unknown"
                    },
                    success=True
                )

            # Call the original function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


def requires_any_permission(
    permission_names: List[str],
    resource_id_param: Optional[str] = None,
    audit_action: Optional[ActionType] = None,
    audit_resource_type: Optional[ResourceType] = None
):
    """
    Decorator to require any one of multiple permissions for an endpoint.

    Args:
        permission_names: List of permission names (user needs any one)
        resource_id_param: Optional parameter name containing resource ID
        audit_action: Optional audit action type for logging
        audit_resource_type: Optional audit resource type for logging

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies from kwargs
            current_user: TokenData = kwargs.get('current_user')
            db: Session = kwargs.get('db')
            request: Request = kwargs.get('request')

            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing required dependencies"
                )

            # Get permission service
            permission_service = get_permission_service(db)

            # Extract resource ID if specified
            resource_id = None
            if resource_id_param and resource_id_param in kwargs:
                resource_id_value = kwargs[resource_id_param]
                if isinstance(resource_id_value, str):
                    try:
                        resource_id = UUID(resource_id_value)
                    except ValueError:
                        resource_id = None
                elif isinstance(resource_id_value, UUID):
                    resource_id = resource_id_value

            # Create audit context if request is available
            audit_context = None
            if request:
                audit_context = create_audit_context(current_user, request)

            # Check if user has any of the required permissions
            has_any_permission = False
            granted_permission = None

            for permission_name in permission_names:
                has_permission = await permission_service.check_permission(
                    user=current_user,
                    permission_name=permission_name,
                    resource_id=resource_id,
                    audit_context=audit_context
                )
                if has_permission:
                    has_any_permission = True
                    granted_permission = permission_name
                    break

            if not has_any_permission:
                # Log unauthorized access attempt
                if audit_context and audit_action and audit_resource_type:
                    audit_service = ComprehensiveAuditService(db)
                    await audit_service.log_security_event(
                        context=audit_context,
                        event_type=ActionType.UNAUTHORIZED_ACCESS,
                        severity="high",
                        description=f"Unauthorized access attempt, requires any of: {', '.join(permission_names)}",
                        metadata={
                            "required_permissions": permission_names,
                            "endpoint": request.url.path if request else "unknown",
                            "method": request.method if request else "unknown",
                            "resource_id": str(resource_id) if resource_id else None
                        }
                    )

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions: one of {', '.join(permission_names)} required"
                )

            # Log successful access
            if (audit_context and audit_action and audit_resource_type):
                audit_service = ComprehensiveAuditService(db)
                await audit_service.log_user_action(
                    context=audit_context,
                    action=audit_action,
                    resource_type=audit_resource_type,
                    resource_id=resource_id,
                    metadata={
                        "granted_permission": granted_permission,
                        "required_permissions": permission_names,
                        "endpoint": request.url.path if request else "unknown",
                        "method": request.method if request else "unknown"
                    },
                    success=True
                )

            # Call the original function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


def requires_role(
    role_name: str,
    audit_action: Optional[ActionType] = None,
    audit_resource_type: Optional[ResourceType] = None
):
    """
    Decorator to require a specific role for an endpoint.

    Args:
        role_name: Name of the required role
        audit_action: Optional audit action type for logging
        audit_resource_type: Optional audit resource type for logging

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies from kwargs
            current_user: TokenData = kwargs.get('current_user')
            db: Session = kwargs.get('db')
            request: Request = kwargs.get('request')

            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing required dependencies"
                )

            # Get permission service
            permission_service = get_permission_service(db)

            # Create audit context if request is available
            audit_context = None
            if request:
                audit_context = create_audit_context(current_user, request)

            # Get user roles
            user_roles = await permission_service.get_user_roles(current_user.id)
            role_names = [role['name'] for role in user_roles]

            has_role = role_name in role_names

            if not has_role:
                # Log unauthorized access attempt
                if audit_context and audit_action and audit_resource_type:
                    audit_service = ComprehensiveAuditService(db)
                    await audit_service.log_security_event(
                        context=audit_context,
                        event_type=ActionType.UNAUTHORIZED_ACCESS,
                        severity="high",
                        description=f"Unauthorized access attempt, requires role: {role_name}",
                        metadata={
                            "required_role": role_name,
                            "user_roles": role_names,
                            "endpoint": request.url.path if request else "unknown",
                            "method": request.method if request else "unknown"
                        }
                    )

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions: {role_name} role required"
                )

            # Log successful access
            if (audit_context and audit_action and audit_resource_type):
                audit_service = ComprehensiveAuditService(db)
                await audit_service.log_user_action(
                    context=audit_context,
                    action=audit_action,
                    resource_type=audit_resource_type,
                    metadata={
                        "required_role": role_name,
                        "user_roles": role_names,
                        "endpoint": request.url.path if request else "unknown",
                        "method": request.method if request else "unknown"
                    },
                    success=True
                )

            # Call the original function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


# Dependency injection helpers
async def get_current_user_with_permissions(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TokenData:
    """
    Dependency that provides current user with permission checking capability.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        TokenData: Current user token data
    """
    # Add permission service to user context for easy access
    permission_service = get_permission_service(db)

    # Attach permission checking method to user object
    async def check_permission(permission_name: str, resource_id: Optional[UUID] = None) -> bool:
        return await permission_service.check_permission(
            user=current_user,
            permission_name=permission_name,
            resource_id=resource_id
        )

    # Attach method to user object (monkey patching for convenience)
    current_user.check_permission = check_permission

    return current_user


# Common permission combinations
class CommonPermissions:
    """Common permission combinations for easy reuse."""

    # Patient permissions
    PATIENT_READ = "patient.read"
    PATIENT_WRITE = ["patient.create", "patient.update"]
    PATIENT_FULL = ["patient.create", "patient.read", "patient.update", "patient.delete"]
    PATIENT_PHI = "patient.phi_access"

    # IVR permissions
    IVR_READ = "ivr.read"
    IVR_WRITE = ["ivr.create", "ivr.update"]
    IVR_APPROVE = ["ivr.approve", "ivr.reject"]
    IVR_FULL = ["ivr.create", "ivr.read", "ivr.update", "ivr.approve", "ivr.reject"]

    # Order permissions
    ORDER_READ = "order.read"
    ORDER_WRITE = ["order.create", "order.update"]
    ORDER_MANAGE = ["order.create", "order.read", "order.update", "order.cancel", "order.ship"]

    # User management permissions
    USER_READ = "user.read"
    USER_WRITE = ["user.create", "user.update"]
    USER_MANAGE = ["user.create", "user.read", "user.update", "user.deactivate", "user.assign_roles"]

    # Settings permissions
    SETTINGS_READ = "settings.read"
    SETTINGS_WRITE = ["settings.update"]
    SETTINGS_MANAGE = ["settings.read", "settings.update", "settings.permissions"]

    # Analytics permissions
    ANALYTICS_READ = "analytics.read"
    ANALYTICS_EXPORT = "analytics.export"

    # Audit permissions
    AUDIT_READ = "audit.read"
    AUDIT_EXPORT = "audit.export"


# Example usage decorators for common scenarios
def requires_patient_access(resource_id_param: str = "patient_id"):
    """Require patient read access with PHI permissions."""
    return requires_any_permission(
        [CommonPermissions.PATIENT_READ, CommonPermissions.PATIENT_PHI],
        resource_id_param=resource_id_param,
        audit_action=ActionType.PHI_ACCESS,
        audit_resource_type=ResourceType.PATIENT
    )


def requires_ivr_management():
    """Require IVR management permissions."""
    return requires_any_permission(
        CommonPermissions.IVR_FULL,
        audit_action=ActionType.IVR_STATUS_CHANGE,
        audit_resource_type=ResourceType.IVR
    )


def requires_admin_access():
    """Require administrative access."""
    return requires_role(
        "healthcare_provider",
        audit_action=ActionType.USER_UPDATED,
        audit_resource_type=ResourceType.USER
    )