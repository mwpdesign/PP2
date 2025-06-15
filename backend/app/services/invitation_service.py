"""
Invitation Service for Healthcare IVR Platform
Task ID: mbvu8p4nc9bidurxtvc
Phase 2: Service Layer Implementation

This service handles all invitation business logic including:
- Creating invitations for all user types
- Sending invitation emails
- Managing invitation lifecycle
- Handling invitation acceptance
- Hierarchical invitation management
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID as PyUUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, desc, asc, select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.models.user_invitation import UserInvitation
from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.core.exceptions import (
    NotFoundException,
    ValidationError,
    AuthorizationError,
    ConflictError
)

logger = logging.getLogger(__name__)


class InvitationService:
    """Service for managing user invitations across all user types."""

    def __init__(self, db: AsyncSession):
        """Initialize the invitation service."""
        self.db = db

    # ==================== INVITATION CREATION ====================

    async def create_invitation(
        self,
        email: str,
        invitation_type: str,
        role_name: str,
        invited_by_id: PyUUID,
        organization_id: Optional[PyUUID] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        invitation_message: Optional[str] = None,
        expires_in_days: int = 7,
        **hierarchy_kwargs
    ) -> UserInvitation:
        """
        Create a new invitation.

        Args:
            email: Invitee's email address
            invitation_type: Type of invitation (doctor, sales, etc.)
            role_name: Role to assign to the user
            invited_by_id: ID of the user creating the invitation
            organization_id: Organization to associate with
            first_name: Invitee's first name
            last_name: Invitee's last name
            invitation_message: Custom message for the invitation
            expires_in_days: Days until invitation expires
            **hierarchy_kwargs: Additional hierarchy relationships

        Returns:
            Created UserInvitation object

        Raises:
            ValidationError: If validation fails
            ConflictError: If invitation already exists
            AuthorizationError: If user lacks permission
        """
        try:
            # Validate invitation type
            await self._validate_invitation_type(invitation_type)

            # Validate role exists
            await self._validate_role(role_name)

            # Check if user already exists
            stmt = select(User).where(User.email == email.lower())
            result = await self.db.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                raise ConflictError(f"User with email {email} already exists")

            # Check if pending invitation already exists
            stmt = select(UserInvitation).where(
                and_(
                    UserInvitation.email == email.lower(),
                    UserInvitation.status.in_(["pending", "sent"])
                )
            )
            result = await self.db.execute(stmt)
            existing_invitation = result.scalar_one_or_none()

            if existing_invitation:
                raise ConflictError(
                    f"Pending invitation for {email} already exists"
                )

            # Validate inviter permissions
            await self._validate_inviter_permissions(
                invited_by_id, invitation_type, organization_id
            )

            # Validate organization if provided
            if organization_id:
                await self._validate_organization(organization_id)

            # Create the invitation
            invitation = UserInvitation.create_invitation(
                email=email.lower(),
                invitation_type=invitation_type,
                role_name=role_name,
                invited_by_id=invited_by_id,
                organization_id=organization_id,
                first_name=first_name,
                last_name=last_name,
                invitation_message=invitation_message,
                expires_in_days=expires_in_days,
                **hierarchy_kwargs
            )

            # Save to database
            self.db.add(invitation)
            await self.db.commit()
            await self.db.refresh(invitation)

            logger.info(
                f"Created invitation {invitation.id} for {email} "
                f"as {invitation_type} by user {invited_by_id}"
            )

            return invitation

        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Database integrity error creating invitation: {e}")
            raise ConflictError("Invitation creation failed due to data conflict")
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating invitation: {e}")
            raise

    async def create_doctor_invitation(
        self,
        email: str,
        invited_by_id: PyUUID,
        organization_id: PyUUID,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        invitation_message: Optional[str] = None
    ) -> UserInvitation:
        """Create a doctor invitation with default settings."""
        return await self.create_invitation(
            email=email,
            invitation_type="doctor",
            role_name="doctor",
            invited_by_id=invited_by_id,
            organization_id=organization_id,
            first_name=first_name,
            last_name=last_name,
            invitation_message=invitation_message
        )

    async def create_sales_invitation(
        self,
        email: str,
        invited_by_id: PyUUID,
        organization_id: PyUUID,
        parent_distributor_id: Optional[PyUUID] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        invitation_message: Optional[str] = None
    ) -> UserInvitation:
        """Create a sales representative invitation."""
        return await self.create_invitation(
            email=email,
            invitation_type="sales",
            role_name="sales",
            invited_by_id=invited_by_id,
            organization_id=organization_id,
            first_name=first_name,
            last_name=last_name,
            invitation_message=invitation_message,
            parent_distributor_id=parent_distributor_id
        )

    async def create_practice_staff_invitation(
        self,
        email: str,
        invited_by_id: PyUUID,  # Doctor ID
        organization_id: PyUUID,
        staff_role: str,  # 'office_admin' or 'medical_staff'
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        invitation_message: Optional[str] = None
    ) -> UserInvitation:
        """Create a practice staff invitation (office admin or medical staff)."""
        if staff_role not in ["office_admin", "medical_staff"]:
            raise ValidationError(
                "Staff role must be 'office_admin' or 'medical_staff'"
            )

        return await self.create_invitation(
            email=email,
            invitation_type=staff_role,
            role_name=staff_role,
            invited_by_id=invited_by_id,
            organization_id=organization_id,
            first_name=first_name,
            last_name=last_name,
            invitation_message=invitation_message,
            parent_doctor_id=invited_by_id
        )

    # ==================== INVITATION RETRIEVAL ====================

    async def get_invitation_by_id(self, invitation_id: PyUUID) -> UserInvitation:
        """Get invitation by ID."""
        stmt = select(UserInvitation).where(UserInvitation.id == invitation_id)
        result = await self.db.execute(stmt)
        invitation = result.scalar_one_or_none()

        if not invitation:
            raise NotFoundException(f"Invitation {invitation_id} not found")

        return invitation

    async def get_invitation_by_token(self, token: str) -> UserInvitation:
        """Get invitation by token."""
        stmt = select(UserInvitation).where(UserInvitation.invitation_token == token)
        result = await self.db.execute(stmt)
        invitation = result.scalar_one_or_none()

        if not invitation:
            raise NotFoundException("Invalid invitation token")

        return invitation

    async def list_invitations(
        self,
        user_id: Optional[PyUUID] = None,
        organization_id: Optional[PyUUID] = None,
        invitation_type: Optional[str] = None,
        status: Optional[str] = None,
        invited_by_id: Optional[PyUUID] = None,
        limit: int = 50,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[UserInvitation], int]:
        """
        List invitations with filtering and pagination.

        Returns:
            Tuple of (invitations, total_count)
        """
        stmt = select(UserInvitation)

        # Apply filters
        if organization_id:
            stmt = stmt.where(UserInvitation.organization_id == organization_id)

        if invitation_type:
            stmt = stmt.where(UserInvitation.invitation_type == invitation_type)

        if status:
            stmt = stmt.where(UserInvitation.status == status)

        if invited_by_id:
            stmt = stmt.where(UserInvitation.invited_by_id == invited_by_id)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total_count = count_result.scalar()

        # Apply sorting
        sort_column = getattr(UserInvitation, sort_by, UserInvitation.created_at)
        if sort_order.lower() == "desc":
            stmt = stmt.order_by(desc(sort_column))
        else:
            stmt = stmt.order_by(asc(sort_column))

        # Apply pagination
        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        invitations = result.scalars().all()

        return list(invitations), total_count

    async def get_pending_invitations(
        self,
        organization_id: Optional[PyUUID] = None,
        limit: int = 50
    ) -> List[UserInvitation]:
        """Get all pending invitations."""
        stmt = select(UserInvitation).where(
            UserInvitation.status.in_(["pending", "sent"])
        )

        if organization_id:
            stmt = stmt.where(UserInvitation.organization_id == organization_id)

        stmt = stmt.order_by(desc(UserInvitation.created_at)).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_expired_invitations(
        self,
        organization_id: Optional[PyUUID] = None
    ) -> List[UserInvitation]:
        """Get all expired invitations."""
        now = datetime.utcnow()
        stmt = select(UserInvitation).where(
            and_(
                UserInvitation.expires_at < now,
                UserInvitation.status.in_(["pending", "sent"])
            )
        )

        if organization_id:
            stmt = stmt.where(UserInvitation.organization_id == organization_id)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ==================== INVITATION LIFECYCLE ====================

    async def send_invitation(self, invitation_id: PyUUID) -> UserInvitation:
        """
        Mark invitation as sent and update email tracking.

        Note: Actual email sending should be handled by EmailService
        """
        invitation = await self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot send invitation with status {invitation.status}"
            )

        if invitation.is_expired:
            raise ValidationError("Cannot send expired invitation")

        invitation.mark_as_sent()
        await self.db.commit()

        logger.info(f"Marked invitation {invitation_id} as sent")
        return invitation

    async def resend_invitation(self, invitation_id: PyUUID) -> UserInvitation:
        """Resend an invitation (increment attempts)."""
        invitation = await self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot resend invitation with status {invitation.status}"
            )

        if invitation.is_expired:
            # Extend expiry for resend
            invitation.extend_expiry(7)

        invitation.increment_email_attempts()
        await self.db.commit()

        logger.info(f"Resent invitation {invitation_id}")
        return invitation

    async def accept_invitation(
        self,
        token: str,
        user_data: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[UserInvitation, User]:
        """
        Accept an invitation and create the user account.

        Args:
            token: Invitation token
            user_data: User account data (password, etc.)
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Tuple of (invitation, created_user)
        """
        invitation = await self.get_invitation_by_token(token)

        # Validate invitation can be accepted
        if invitation.status != "sent":
            raise ValidationError(
                f"Invitation cannot be accepted (status: {invitation.status})"
            )

        if invitation.is_expired:
            raise ValidationError("Invitation has expired")

        # Check if user already exists
        stmt = select(User).where(User.email == invitation.email)
        result = await self.db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise ConflictError("User account already exists")

        try:
            # Create user account
            user = User(
                email=invitation.email,
                first_name=invitation.first_name or user_data.get("first_name"),
                last_name=invitation.last_name or user_data.get("last_name"),
                organization_id=invitation.organization_id,
                role=invitation.role_name,
                invitation_status="active",
                invitation_accepted_at=datetime.utcnow(),
                original_invitation_id=invitation.id,
                **user_data
            )

            # Set hierarchy relationships if applicable
            if invitation.parent_sales_id:
                user.parent_sales_id = invitation.parent_sales_id
            if invitation.parent_distributor_id:
                user.parent_distributor_id = invitation.parent_distributor_id
            if invitation.parent_master_distributor_id:
                user.parent_master_distributor_id = invitation.parent_master_distributor_id
            if invitation.parent_doctor_id:
                user.parent_doctor_id = invitation.parent_doctor_id

            self.db.add(user)

            # Mark invitation as accepted
            invitation.mark_as_accepted()
            invitation.ip_address = ip_address
            invitation.user_agent = user_agent

            await self.db.commit()
            await self.db.refresh(user)

            logger.info(
                f"Accepted invitation {invitation.id} and created user {user.id}"
            )

            return invitation, user

        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Error accepting invitation: {e}")
            raise ConflictError("User creation failed due to data conflict")
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error accepting invitation: {e}")
            raise

    async def cancel_invitation(
        self,
        invitation_id: PyUUID,
        cancelled_by_id: PyUUID
    ) -> UserInvitation:
        """Cancel an invitation."""
        invitation = await self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot cancel invitation with status {invitation.status}"
            )

        # Validate permissions (only inviter or admin can cancel)
        await self._validate_cancel_permissions(invitation, cancelled_by_id)

        invitation.mark_as_cancelled()
        await self.db.commit()

        logger.info(f"Cancelled invitation {invitation_id} by user {cancelled_by_id}")
        return invitation

    async def expire_invitation(self, invitation_id: PyUUID) -> UserInvitation:
        """Mark an invitation as expired."""
        invitation = await self.get_invitation_by_id(invitation_id)

        invitation.mark_as_expired()
        await self.db.commit()

        logger.info(f"Expired invitation {invitation_id}")
        return invitation

    async def extend_invitation_expiry(
        self,
        invitation_id: PyUUID,
        days: int = 7
    ) -> UserInvitation:
        """Extend invitation expiry."""
        invitation = await self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot extend invitation with status {invitation.status}"
            )

        invitation.extend_expiry(days)
        await self.db.commit()

        logger.info(f"Extended invitation {invitation_id} expiry by {days} days")
        return invitation

    # ==================== BULK OPERATIONS ====================

    async def expire_old_invitations(self) -> int:
        """
        Expire all invitations that have passed their expiry date.

        Returns:
            Number of invitations expired
        """
        now = datetime.utcnow()
        stmt = select(UserInvitation).where(
            and_(
                UserInvitation.expires_at < now,
                UserInvitation.status.in_(["pending", "sent"])
            )
        )

        result = await self.db.execute(stmt)
        expired_invitations = result.scalars().all()

        count = 0
        for invitation in expired_invitations:
            invitation.mark_as_expired()
            count += 1

        if count > 0:
            await self.db.commit()
            logger.info(f"Expired {count} old invitations")

        return count

    async def cleanup_old_invitations(self, days_old: int = 90) -> int:
        """
        Delete old completed/failed invitations.

        Args:
            days_old: Delete invitations older than this many days

        Returns:
            Number of invitations deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        stmt = select(UserInvitation).where(
            and_(
                UserInvitation.created_at < cutoff_date,
                UserInvitation.status.in_(["accepted", "expired", "cancelled"])
            )
        )

        result = await self.db.execute(stmt)
        old_invitations = result.scalars().all()

        count = len(old_invitations)
        for invitation in old_invitations:
            await self.db.delete(invitation)

        if count > 0:
            await self.db.commit()
            logger.info(f"Cleaned up {count} old invitations")

        return count

    async def get_invitation_statistics(
        self,
        organization_id: Optional[PyUUID] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get invitation statistics for the specified time period.

        Args:
            organization_id: Filter by organization
            days: Number of days to include in statistics

        Returns:
            Dictionary with invitation statistics
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        base_stmt = select(UserInvitation).where(
            UserInvitation.created_at >= start_date
        )

        if organization_id:
            base_stmt = base_stmt.where(UserInvitation.organization_id == organization_id)

        # Total invitations
        total_result = await self.db.execute(base_stmt)
        total_invitations = len(total_result.scalars().all())

        # Status breakdown
        status_stats = {}
        for status in ["pending", "sent", "accepted", "expired", "cancelled"]:
            stmt = base_stmt.where(UserInvitation.status == status)
            result = await self.db.execute(stmt)
            status_stats[status] = len(result.scalars().all())

        # Type breakdown
        type_stats = {}
        for inv_type in ["doctor", "sales", "distributor", "master_distributor",
                        "office_admin", "medical_staff", "ivr_company",
                        "shipping_logistics", "admin", "chp_admin"]:
            stmt = base_stmt.where(UserInvitation.invitation_type == inv_type)
            result = await self.db.execute(stmt)
            type_stats[inv_type] = len(result.scalars().all())

        # Acceptance rate
        accepted = status_stats.get("accepted", 0)
        sent = status_stats.get("sent", 0) + accepted
        acceptance_rate = (accepted / sent * 100) if sent > 0 else 0

        return {
            "total_invitations": total_invitations,
            "status_breakdown": status_stats,
            "type_breakdown": type_stats,
            "acceptance_rate": round(acceptance_rate, 2),
            "period_days": days,
            "organization_id": str(organization_id) if organization_id else None
        }

    # ==================== VALIDATION METHODS ====================

    async def _validate_invitation_type(self, invitation_type: str) -> None:
        """Validate invitation type."""
        valid_types = [
            "doctor", "sales", "distributor", "master_distributor",
            "office_admin", "medical_staff", "ivr_company",
            "shipping_logistics", "admin", "chp_admin"
        ]
        if invitation_type not in valid_types:
            raise ValidationError(f"Invalid invitation type: {invitation_type}")

    async def _validate_role(self, role_name: str) -> None:
        """Validate that the role exists."""
        stmt = select(Role).where(Role.name == role_name)
        result = await self.db.execute(stmt)
        role = result.scalar_one_or_none()
        if not role:
            raise ValidationError(f"Role '{role_name}' does not exist")

    async def _validate_organization(self, organization_id: PyUUID) -> None:
        """Validate that the organization exists."""
        stmt = select(Organization).where(Organization.id == organization_id)
        result = await self.db.execute(stmt)
        organization = result.scalar_one_or_none()
        if not organization:
            raise ValidationError(f"Organization {organization_id} does not exist")

    async def _validate_inviter_permissions(
        self,
        invited_by_id: PyUUID,
        invitation_type: str,
        organization_id: Optional[PyUUID]
    ) -> None:
        """
        Validate that the inviter has permission to create this type of invitation.

        This is a simplified validation - in production, you'd implement
        more complex role-based permission checking.
        """
        # Use eager loading to join the Role table to avoid lazy loading issues
        stmt = select(User).options(selectinload(User.role)).where(User.id == invited_by_id)
        result = await self.db.execute(stmt)
        inviter = result.scalar_one_or_none()

        if not inviter:
            raise AuthorizationError("Inviter not found")

        # Get role name safely
        role_name = inviter.role.name if inviter.role else None

        if not role_name:
            raise AuthorizationError("Inviter role not found")

        # Basic permission checks
        if role_name == "doctor" and invitation_type not in ["office_admin", "medical_staff"]:
            raise AuthorizationError("Doctors can only invite practice staff")

        if role_name == "sales" and invitation_type != "doctor":
            raise AuthorizationError("Sales representatives can only invite doctors")

        # Add more role-based validation as needed

    async def _validate_cancel_permissions(
        self,
        invitation: UserInvitation,
        cancelled_by_id: PyUUID
    ) -> None:
        """Validate that the user can cancel this invitation."""
        stmt = select(User).where(User.id == cancelled_by_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise AuthorizationError("User not found")

        # Only inviter or admin can cancel
        if (invitation.invited_by_id != cancelled_by_id and
            user.role not in ["admin", "chp_admin"]):
            raise AuthorizationError("Insufficient permissions to cancel invitation")