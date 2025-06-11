"""
Permission Service
Phase 2: Foundation Systems - Role-Based Permissions

Service for managing role-based permissions and access control.
Integrates with ComprehensiveAuditService for HIPAA compliance.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Set
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.rbac import Role
from app.models.user import User
from app.schemas.token import TokenData
from app.services.comprehensive_audit_service import (
    ComprehensiveAuditService, ActionType, ResourceType, AuditContext
)

logger = logging.getLogger(__name__)


class PermissionService:
    """Service for managing role-based permissions and access control."""

    def __init__(self, db: Session):
        """Initialize the permission service."""
        self.db = db
        self.audit_service = ComprehensiveAuditService(db)

    async def check_permission(
        self,
        user: TokenData,
        permission_name: str,
        resource_id: Optional[UUID] = None,
        audit_context: Optional[AuditContext] = None
    ) -> bool:
        """
        Check if a user has a specific permission.

        Args:
            user: Current user token data
            permission_name: Name of the permission to check
            resource_id: Optional specific resource ID
            audit_context: Optional audit context for logging

        Returns:
            bool: True if user has permission, False otherwise
        """
        try:
            # Get user's permissions
            user_permissions = await self.get_user_permissions(user.id)

            # Check if user has the permission
            has_permission = permission_name in user_permissions

            # Log permission check if audit context provided
            if audit_context:
                await self.audit_service.log_user_action(
                    context=audit_context,
                    action=ActionType.PERMISSION_CHANGED,
                    resource_type=ResourceType.USER,
                    resource_id=resource_id,
                    metadata={
                        "permission_name": permission_name,
                        "permission_granted": has_permission,
                        "check_type": "permission_check"
                    },
                    success=True
                )

            return has_permission

        except Exception as e:
            logger.error(
                f"Error checking permission {permission_name} "
                f"for user {user.id}: {str(e)}"
            )

            # Log failed permission check
            if audit_context:
                await self.audit_service.log_user_action(
                    context=audit_context,
                    action=ActionType.PERMISSION_CHANGED,
                    resource_type=ResourceType.USER,
                    resource_id=resource_id,
                    metadata={
                        "permission_name": permission_name,
                        "error": str(e),
                        "check_type": "permission_check_failed"
                    },
                    success=False,
                    error_message=str(e)
                )

            return False

    async def get_user_permissions(self, user_id: UUID) -> Set[str]:
        """
        Get all permissions for a user from their roles.

        Args:
            user_id: User ID to get permissions for

        Returns:
            Set[str]: Set of permission names
        """
        permissions = set()

        # Get user with roles
        query = (
            select(User)
            .options(joinedload(User.roles))
            .where(User.id == user_id)
        )

        result = await self.db.execute(query)
        user = result.unique().scalar_one_or_none()

        if user:
            # Collect permissions from all roles
            for role in user.roles:
                if role.permissions:
                    # role.permissions is now a relationship to Permission objects
                    permission_names = [
                        perm.name for perm in role.permissions
                    ]
                    permissions.update(permission_names)

        return permissions

    async def get_user_roles(self, user_id: UUID) -> List[Dict]:
        """
        Get all active roles for a user.

        Args:
            user_id: User ID to get roles for

        Returns:
            List[Dict]: List of role dictionaries
        """
        query = (
            select(User)
            .options(joinedload(User.roles))
            .where(User.id == user_id)
        )

        result = await self.db.execute(query)
        user = result.unique().scalar_one_or_none()

        if not user:
            return []

        roles = []
        for role in user.roles:
            roles.append({
                "id": str(role.id),
                "name": role.name,
                "display_name": role.name.replace('_', ' ').title(),
                "description": role.description or "",
                "permissions": [perm.name for perm in role.permissions] if role.permissions else [],
                "created_at": role.created_at.isoformat(),
                "updated_at": role.updated_at.isoformat()
            })

        return roles

    async def get_all_roles(
        self, organization_id: Optional[UUID] = None
    ) -> List[Dict]:
        """
        Get all active roles, optionally filtered by organization.

        Args:
            organization_id: Optional organization ID to filter by

        Returns:
            List[Dict]: List of role dictionaries
        """
        query = select(Role)

        if organization_id:
            query = query.where(Role.organization_id == organization_id)

        result = await self.db.execute(query)
        roles = result.scalars().all()

        role_list = []
        for role in roles:
            role_list.append({
                "id": str(role.id),
                "name": role.name,
                "display_name": role.name.replace('_', ' ').title(),
                "description": role.description or "",
                "is_system_role": False,  # Add logic for system roles if needed
                "is_active": True,
                "organization_id": str(role.organization_id),
                "permissions": [perm.name for perm in role.permissions] if role.permissions else [],
                "created_at": role.created_at.isoformat(),
                "updated_at": role.updated_at.isoformat()
            })

        return role_list

    async def get_all_permissions(self) -> List[Dict]:
        """
        Get all available permissions.

        Returns:
            List[Dict]: List of permission dictionaries
        """
        # For now, return the standard permissions we defined in the migration
        # In a real system, these might come from a permissions table
        permissions = [
            # Patient permissions
            {
                "id": "patient.create",
                "name": "patient.create",
                "display_name": "Create Patients",
                "description": "Create new patient records",
                "resource": "patient",
                "action": "create",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "patient.read",
                "name": "patient.read",
                "display_name": "View Patients",
                "description": "View patient information",
                "resource": "patient",
                "action": "read",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "patient.update",
                "name": "patient.update",
                "display_name": "Update Patients",
                "description": "Update patient information",
                "resource": "patient",
                "action": "update",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "patient.delete",
                "name": "patient.delete",
                "display_name": "Delete Patients",
                "description": "Delete patient records",
                "resource": "patient",
                "action": "delete",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "patient.phi_access",
                "name": "patient.phi_access",
                "display_name": "Access PHI",
                "description": "Access protected health information",
                "resource": "patient",
                "action": "phi_access",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            # IVR permissions
            {
                "id": "ivr.create",
                "name": "ivr.create",
                "display_name": "Create IVR Requests",
                "description": "Create insurance verification requests",
                "resource": "ivr",
                "action": "create",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "ivr.read",
                "name": "ivr.read",
                "display_name": "View IVR Requests",
                "description": "View insurance verification requests",
                "resource": "ivr",
                "action": "read",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "ivr.approve",
                "name": "ivr.approve",
                "display_name": "Approve IVR Requests",
                "description": "Approve insurance verification requests",
                "resource": "ivr",
                "action": "approve",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            # Settings permissions
            {
                "id": "settings.read",
                "name": "settings.read",
                "display_name": "View Settings",
                "description": "View system settings",
                "resource": "settings",
                "action": "read",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "settings.permissions",
                "name": "settings.permissions",
                "display_name": "Manage Permissions",
                "description": "Manage user permissions and roles",
                "resource": "settings",
                "action": "permissions",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            # User management permissions
            {
                "id": "user.read",
                "name": "user.read",
                "display_name": "View Users",
                "description": "View user information",
                "resource": "user",
                "action": "read",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "user.create",
                "name": "user.create",
                "display_name": "Create Users",
                "description": "Create new user accounts",
                "resource": "user",
                "action": "create",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "user.assign_roles",
                "name": "user.assign_roles",
                "display_name": "Assign Roles",
                "description": "Assign roles to users",
                "resource": "user",
                "action": "assign_roles",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            # Audit permissions
            {
                "id": "audit.read",
                "name": "audit.read",
                "display_name": "View Audit Logs",
                "description": "View audit logs and compliance reports",
                "resource": "audit",
                "action": "read",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        ]

        return permissions


# Utility functions
def get_permission_service(db: Session) -> PermissionService:
    """Get an instance of the permission service."""
    return PermissionService(db)