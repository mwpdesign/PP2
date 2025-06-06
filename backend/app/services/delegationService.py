"""
Delegation Service for Healthcare IVR Platform

Provides comprehensive delegation permission management allowing office
administrators to submit IVRs on doctor's behalf, medical staff proxy
submission capabilities, approval workflow for delegated submissions,
and complete audit trail.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.models.rbac import DelegationPermission
from app.models.user import User
from app.core.config import get_settings
from app.services.audit_service import get_audit_service, AuditContext


class DelegationService:
    """Service for managing delegation permissions and proxy submissions."""

    def __init__(self, db: AsyncSession, current_user: Dict[str, Any]):
        """Initialize the delegation service."""
        self.db = db
        self.current_user = current_user
        self.settings = get_settings()
        self.audit_service = get_audit_service()

    async def create_delegation(
        self,
        delegator_id: UUID,
        delegate_id: UUID,
        permissions: List[str],
        organization_id: UUID,
        expires_at: Optional[datetime] = None,
        requires_approval: bool = False,
        delegation_reason: Optional[str] = None,
        scope_restrictions: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
    ) -> DelegationPermission:
        """
        Create a new delegation permission.

        Args:
            delegator_id: User who is delegating permissions
            delegate_id: User receiving delegation
            permissions: List of permissions being delegated
            organization_id: Organization context
            expires_at: When delegation expires (optional)
            requires_approval: Whether delegated actions need approval
            delegation_reason: Reason for delegation
            scope_restrictions: Restrictions on delegation scope
            notes: Additional notes

        Returns:
            Created DelegationPermission instance
        """
        # Validate users exist and are in same organization
        delegator = await self._get_user_by_id(delegator_id)
        delegate = await self._get_user_by_id(delegate_id)

        if not delegator or not delegate:
            raise ValueError("Delegator or delegate user not found")

        if (delegator.organization_id != organization_id or
                delegate.organization_id != organization_id):
            raise ValueError("Users must be in the same organization")

        # Validate delegator has permissions to delegate
        if not await self._can_delegate_permissions(delegator, permissions):
            raise ValueError("Delegator does not have permissions to delegate")

        # Check for existing active delegation
        existing = await self._get_active_delegation(delegator_id, delegate_id)
        if existing:
            raise ValueError(
                "Active delegation already exists between these users")

        # Create delegation permission
        delegation = DelegationPermission(
            delegator_id=delegator_id,
            delegate_id=delegate_id,
            organization_id=organization_id,
            permissions=permissions,
            scope_restrictions=scope_restrictions or {},
            expires_at=expires_at,
            requires_approval=requires_approval,
            delegation_reason=delegation_reason,
            notes=notes,
            created_by_id=self.current_user["id"],
            is_active=True,
        )

        self.db.add(delegation)
        await self.db.commit()
        await self.db.refresh(delegation)

        # Audit log
        await self._log_delegation_action(
            "create_delegation",
            delegation.id,
            {
                "delegator_id": str(delegator_id),
                "delegate_id": str(delegate_id),
                "permissions": permissions,
                "expires_at": expires_at.isoformat() if expires_at else None,
                "requires_approval": requires_approval,
                "delegation_reason": delegation_reason,
            }
        )

        return delegation

    async def validate_delegation(
        self,
        delegate_id: UUID,
        permission: str,
        delegator_id: Optional[UUID] = None
    ) -> Optional[DelegationPermission]:
        """
        Validate if a user has delegation permission for a specific action.

        Args:
            delegate_id: User attempting to use delegation
            permission: Permission being checked
            delegator_id: Specific delegator (optional)

        Returns:
            Valid DelegationPermission if found, None otherwise
        """
        query = select(DelegationPermission).where(
            and_(
                DelegationPermission.delegate_id == delegate_id,
                DelegationPermission.is_active.is_(True),
                or_(
                    DelegationPermission.expires_at.is_(None),
                    DelegationPermission.expires_at > datetime.utcnow()
                )
            )
        )

        if delegator_id:
            query = query.where(DelegationPermission.delegator_id == delegator_id)

        result = await self.db.execute(query)
        delegations = result.scalars().all()

        # Check if any delegation includes the required permission
        for delegation in delegations:
            if delegation.has_permission(permission):
                # Additional validation
                if delegation.requires_approval and not delegation.approved_at:
                    continue

                return delegation

        return None

    async def submit_on_behalf(
        self,
        delegate_id: UUID,
        delegator_id: UUID,
        action: str,
        resource_data: Dict[str, Any],
        delegation_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Submit an action on behalf of another user.

        Args:
            delegate_id: User performing the action
            delegator_id: User on whose behalf action is performed
            action: Action being performed (e.g., 'ivr:submit')
            resource_data: Data for the action
            delegation_context: Context about the delegation

        Returns:
            Result of the delegated action
        """
        # Validate delegation
        delegation = await self.validate_delegation(
            delegate_id, action, delegator_id)
        if not delegation:
            raise ValueError("No valid delegation found for this action")

        # Check scope restrictions
        if not await self._check_scope_restrictions(delegation, resource_data):
            raise ValueError(
                "Action violates delegation scope restrictions")

        # Log the delegated action
        await self._log_delegation_action(
            "submit_on_behalf",
            delegation.id,
            {
                "action": action,
                "delegate_id": str(delegate_id),
                "delegator_id": str(delegator_id),
                "resource_data": resource_data,
                "delegation_context": delegation_context,
            }
        )

        # Return delegation info for the calling service to use
        return {
            "delegation_id": delegation.id,
            "delegator_id": delegator_id,
            "delegate_id": delegate_id,
            "on_behalf_of": True,
            "delegation_reason": delegation.delegation_reason,
            "requires_approval": delegation.requires_approval,
        }

    async def get_user_delegations(
        self,
        user_id: UUID,
        delegation_type: str = "all"
    ) -> List[DelegationPermission]:
        """
        Get delegations for a user.

        Args:
            user_id: User ID
            delegation_type: "given", "received", or "all"

        Returns:
            List of DelegationPermission instances
        """
        query = select(DelegationPermission).options(
            selectinload(DelegationPermission.delegator),
            selectinload(DelegationPermission.delegate),
        )

        if delegation_type == "given":
            query = query.where(DelegationPermission.delegator_id == user_id)
        elif delegation_type == "received":
            query = query.where(DelegationPermission.delegate_id == user_id)
        else:  # all
            query = query.where(
                or_(
                    DelegationPermission.delegator_id == user_id,
                    DelegationPermission.delegate_id == user_id
                )
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def revoke_delegation(self, delegation_id: UUID) -> bool:
        """
        Revoke a delegation permission.

        Args:
            delegation_id: ID of delegation to revoke

        Returns:
            True if revoked successfully
        """
        delegation = await self.db.get(DelegationPermission, delegation_id)
        if not delegation:
            raise ValueError("Delegation not found")

        # Check if current user can revoke this delegation
        if not await self._can_revoke_delegation(delegation):
            raise ValueError("Not authorized to revoke this delegation")

        delegation.is_active = False
        delegation.revoked_at = datetime.utcnow()
        delegation.revoked_by_id = self.current_user["id"]

        await self.db.commit()

        # Audit log
        await self._log_delegation_action(
            "revoke_delegation",
            delegation.id,
            {
                "revoked_by": str(self.current_user["id"]),
                "revoked_at": delegation.revoked_at.isoformat(),
            }
        )

        return True

    async def approve_delegation(self, delegation_id: UUID) -> bool:
        """
        Approve a delegation permission that requires approval.

        Args:
            delegation_id: ID of delegation to approve

        Returns:
            True if approved successfully
        """
        delegation = await self.db.get(DelegationPermission, delegation_id)
        if not delegation:
            raise ValueError("Delegation not found")

        if not delegation.requires_approval:
            raise ValueError("Delegation does not require approval")

        if delegation.approved_at:
            raise ValueError("Delegation already approved")

        # Check if current user can approve this delegation
        if not await self._can_approve_delegation(delegation):
            raise ValueError("Not authorized to approve this delegation")

        delegation.approved_at = datetime.utcnow()
        delegation.approved_by_id = self.current_user["id"]

        await self.db.commit()

        # Audit log
        await self._log_delegation_action(
            "approve_delegation",
            delegation.id,
            {
                "approved_by": str(self.current_user["id"]),
                "approved_at": delegation.approved_at.isoformat(),
            }
        )

        return True

    async def _get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        return await self.db.get(User, user_id)

    async def _can_delegate_permissions(
        self, user: User, permissions: List[str]
    ) -> bool:
        """Check if user can delegate the specified permissions."""
        # Get user's role permissions from config
        user_permissions = self.settings.ROLE_PERMISSIONS.get(user.role, [])

        # Check if user has all permissions they want to delegate
        for permission in permissions:
            if permission not in user_permissions:
                return False

        # Additional checks for delegation-specific permissions
        if "delegation:create" not in user_permissions:
            return False

        return True

    async def _get_active_delegation(
        self,
        delegator_id: UUID,
        delegate_id: UUID
    ) -> Optional[DelegationPermission]:
        """Get active delegation between two users."""
        query = select(DelegationPermission).where(
            and_(
                DelegationPermission.delegator_id == delegator_id,
                DelegationPermission.delegate_id == delegate_id,
                DelegationPermission.is_active.is_(True),
                or_(
                    DelegationPermission.expires_at.is_(None),
                    DelegationPermission.expires_at > datetime.utcnow()
                )
            )
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _check_scope_restrictions(
        self,
        delegation: DelegationPermission,
        resource_data: Dict[str, Any]
    ) -> bool:
        """Check if action violates delegation scope restrictions."""
        if not delegation.scope_restrictions:
            return True

        # Check patient restrictions
        if "patient_ids" in delegation.scope_restrictions:
            allowed_patients = delegation.scope_restrictions["patient_ids"]
            if resource_data.get("patient_id") not in allowed_patients:
                return False

        # Check time restrictions
        if "time_restrictions" in delegation.scope_restrictions:
            time_restrictions = delegation.scope_restrictions["time_restrictions"]
            current_time = datetime.utcnow().time()
            start_time = time_restrictions.get("start_time")
            end_time = time_restrictions.get("end_time")

            if start_time and end_time:
                if not (start_time <= current_time <= end_time):
                    return False

        # Check action type restrictions
        if "allowed_actions" in delegation.scope_restrictions:
            allowed_actions = delegation.scope_restrictions["allowed_actions"]
            if resource_data.get("action_type") not in allowed_actions:
                return False

        return True

    async def _can_revoke_delegation(
        self, delegation: DelegationPermission
    ) -> bool:
        """Check if current user can revoke the delegation."""
        current_user_id = self.current_user["id"]

        # Delegator can always revoke their own delegations
        if delegation.delegator_id == current_user_id:
            return True

        # Delegate can revoke delegations given to them
        if delegation.delegate_id == current_user_id:
            return True

        # Admin users can revoke any delegation in their organization
        if (self.current_user.get("role") == "admin" and
                delegation.organization_id ==
                self.current_user.get("organization_id")):
            return True

        return False

    async def _can_approve_delegation(
        self, delegation: DelegationPermission
    ) -> bool:
        """Check if current user can approve the delegation."""
        current_user_id = self.current_user["id"]

        # Delegator can approve their own delegations
        if delegation.delegator_id == current_user_id:
            return True

        # Admin users can approve any delegation in their organization
        if (self.current_user.get("role") == "admin" and
                delegation.organization_id == self.current_user.get("organization_id")):
            return True

        # Users with delegation:manage permission can approve
        user_permissions = self.settings.ROLE_PERMISSIONS.get(
            self.current_user.get("role"), []
        )
        if "delegation:manage" in user_permissions:
            return True

        return False

    async def _log_delegation_action(
        self,
        action: str,
        delegation_id: UUID,
        details: Dict[str, Any]
    ) -> None:
        """Log delegation action for audit trail."""
        audit_context = AuditContext(
            user_id=self.current_user["id"],
            organization_id=self.current_user.get("organization_id"),
            action=f"delegation.{action}",
            resource_type="delegation",
            resource_id=str(delegation_id),
            details=details,
            ip_address=self.current_user.get("ip_address"),
            user_agent=self.current_user.get("user_agent"),
        )

        await self.audit_service.log_action(audit_context)


# Factory function for dependency injection
def get_delegation_service(
    db: AsyncSession, current_user: Dict[str, Any]
) -> DelegationService:
    """Factory function to create DelegationService instance."""
    return DelegationService(db, current_user)