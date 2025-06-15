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
from uuid import UUID as PyUUID, uuid4

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
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

    def __init__(self, db: Session):
        """Initialize the invitation service."""
        self.db = db

    # ==================== INVITATION CREATION ====================

    def create_invitation(
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
            self._validate_invitation_type(invitation_type)

            # Validate role exists
            self._validate_role(role_name)

            # Check if user already exists
            existing_user = self.db.query(User).filter(
                User.email == email.lower()
            ).first()

            if existing_user:
                raise ConflictError(f"User with email {email} already exists")

            # Check if pending invitation already exists
            existing_invitation = self.db.query(UserInvitation).filter(
                and_(
                    UserInvitation.email == email.lower(),
                    UserInvitation.status.in_(["pending", "sent"])
                )
            ).first()

            if existing_invitation:
                raise ConflictError(
                    f"Pending invitation for {email} already exists"
                )

            # Validate inviter permissions
            self._validate_inviter_permissions(
                invited_by_id, invitation_type, organization_id
            )

            # Validate organization if provided
            if organization_id:
                self._validate_organization(organization_id)

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
            self.db.commit()
            self.db.refresh(invitation)

            logger.info(
                f"Created invitation {invitation.id} for {email} "
                f"as {invitation_type} by user {invited_by_id}"
            )

            return invitation

        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Database integrity error creating invitation: {e}")
            raise ConflictError("Invitation creation failed due to data conflict")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating invitation: {e}")
            raise

    def create_doctor_invitation(
        self,
        email: str,
        invited_by_id: PyUUID,
        organization_id: PyUUID,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        invitation_message: Optional[str] = None
    ) -> UserInvitation:
        """Create a doctor invitation with default settings."""
        return self.create_invitation(
            email=email,
            invitation_type="doctor",
            role_name="doctor",
            invited_by_id=invited_by_id,
            organization_id=organization_id,
            first_name=first_name,
            last_name=last_name,
            invitation_message=invitation_message
        )

    def create_sales_invitation(
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
        return self.create_invitation(
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

    def create_practice_staff_invitation(
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

        return self.create_invitation(
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

    def get_invitation_by_id(self, invitation_id: PyUUID) -> UserInvitation:
        """Get invitation by ID."""
        invitation = self.db.query(UserInvitation).filter(
            UserInvitation.id == invitation_id
        ).first()

        if not invitation:
            raise NotFoundException(f"Invitation {invitation_id} not found")

        return invitation

    def get_invitation_by_token(self, token: str) -> UserInvitation:
        """Get invitation by token."""
        invitation = self.db.query(UserInvitation).filter(
            UserInvitation.invitation_token == token
        ).first()

        if not invitation:
            raise NotFoundException("Invalid invitation token")

        return invitation

    def list_invitations(
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
        query = self.db.query(UserInvitation)

        # Apply filters
        if organization_id:
            query = query.filter(UserInvitation.organization_id == organization_id)

        if invitation_type:
            query = query.filter(UserInvitation.invitation_type == invitation_type)

        if status:
            query = query.filter(UserInvitation.status == status)

        if invited_by_id:
            query = query.filter(UserInvitation.invited_by_id == invited_by_id)

        # Get total count
        total_count = query.count()

        # Apply sorting
        sort_column = getattr(UserInvitation, sort_by, UserInvitation.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        invitations = query.offset(offset).limit(limit).all()

        return invitations, total_count

    def get_pending_invitations(
        self,
        organization_id: Optional[PyUUID] = None,
        limit: int = 50
    ) -> List[UserInvitation]:
        """Get all pending invitations."""
        query = self.db.query(UserInvitation).filter(
            UserInvitation.status.in_(["pending", "sent"])
        )

        if organization_id:
            query = query.filter(UserInvitation.organization_id == organization_id)

        return query.order_by(desc(UserInvitation.created_at)).limit(limit).all()

    def get_expired_invitations(
        self,
        organization_id: Optional[PyUUID] = None
    ) -> List[UserInvitation]:
        """Get all expired invitations."""
        now = datetime.utcnow()
        query = self.db.query(UserInvitation).filter(
            and_(
                UserInvitation.expires_at < now,
                UserInvitation.status.in_(["pending", "sent"])
            )
        )

        if organization_id:
            query = query.filter(UserInvitation.organization_id == organization_id)

        return query.all()

    # ==================== INVITATION LIFECYCLE ====================

    def send_invitation(self, invitation_id: PyUUID) -> UserInvitation:
        """
        Mark invitation as sent and update email tracking.

        Note: Actual email sending should be handled by EmailService
        """
        invitation = self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot send invitation with status {invitation.status}"
            )

        if invitation.is_expired:
            raise ValidationError("Cannot send expired invitation")

        invitation.mark_as_sent()
        self.db.commit()

        logger.info(f"Marked invitation {invitation_id} as sent")
        return invitation

    def resend_invitation(self, invitation_id: PyUUID) -> UserInvitation:
        """Resend an invitation (increment attempts)."""
        invitation = self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot resend invitation with status {invitation.status}"
            )

        if invitation.is_expired:
            # Extend expiry for resend
            invitation.extend_expiry(7)

        invitation.increment_email_attempts()
        self.db.commit()

        logger.info(f"Resent invitation {invitation_id}")
        return invitation

    def accept_invitation(
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
        invitation = self.get_invitation_by_token(token)

        # Validate invitation can be accepted
        if invitation.status != "sent":
            raise ValidationError(
                f"Invitation cannot be accepted (status: {invitation.status})"
            )

        if invitation.is_expired:
            raise ValidationError("Invitation has expired")

        # Check if user already exists
        existing_user = self.db.query(User).filter(
            User.email == invitation.email
        ).first()

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

            self.db.commit()
            self.db.refresh(user)

            logger.info(
                f"Accepted invitation {invitation.id} and created user {user.id}"
            )

            return invitation, user

        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error accepting invitation: {e}")
            raise ConflictError("User creation failed due to data conflict")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error accepting invitation: {e}")
            raise

    def cancel_invitation(
        self,
        invitation_id: PyUUID,
        cancelled_by_id: PyUUID
    ) -> UserInvitation:
        """Cancel an invitation."""
        invitation = self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot cancel invitation with status {invitation.status}"
            )

        # Validate permissions (only inviter or admin can cancel)
        self._validate_cancel_permissions(invitation, cancelled_by_id)

        invitation.mark_as_cancelled()
        self.db.commit()

        logger.info(f"Cancelled invitation {invitation_id} by user {cancelled_by_id}")
        return invitation

    def expire_invitation(self, invitation_id: PyUUID) -> UserInvitation:
        """Mark an invitation as expired."""
        invitation = self.get_invitation_by_id(invitation_id)

        invitation.mark_as_expired()
        self.db.commit()

        logger.info(f"Expired invitation {invitation_id}")
        return invitation

    def extend_invitation_expiry(
        self,
        invitation_id: PyUUID,
        days: int = 7
    ) -> UserInvitation:
        """Extend invitation expiry."""
        invitation = self.get_invitation_by_id(invitation_id)

        if invitation.status not in ["pending", "sent"]:
            raise ValidationError(
                f"Cannot extend invitation with status {invitation.status}"
            )

        invitation.extend_expiry(days)
        self.db.commit()

        logger.info(f"Extended invitation {invitation_id} expiry by {days} days")
        return invitation

    # ==================== BULK OPERATIONS ====================

    def expire_old_invitations(self) -> int:
        """Expire all invitations that have passed their expiry date."""
        now = datetime.utcnow()
        expired_invitations = self.db.query(UserInvitation).filter(
            and_(
                UserInvitation.expires_at < now,
                UserInvitation.status.in_(["pending", "sent"])
            )
        ).all()

        count = 0
        for invitation in expired_invitations:
            invitation.mark_as_expired()
            count += 1

        if count > 0:
            self.db.commit()
            logger.info(f"Expired {count} old invitations")

        return count

    def cleanup_old_invitations(self, days_old: int = 90) -> int:
        """Delete old completed/failed invitations."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        old_invitations = self.db.query(UserInvitation).filter(
            and_(
                UserInvitation.created_at < cutoff_date,
                UserInvitation.status.in_(["accepted", "failed", "cancelled", "expired"])
            )
        )

        count = old_invitations.count()
        old_invitations.delete()

        if count > 0:
            self.db.commit()
            logger.info(f"Cleaned up {count} old invitations")

        return count

    # ==================== STATISTICS ====================

    def get_invitation_statistics(
        self,
        organization_id: Optional[PyUUID] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get invitation statistics for the specified period."""
        start_date = datetime.utcnow() - timedelta(days=days)

        query = self.db.query(UserInvitation).filter(
            UserInvitation.created_at >= start_date
        )

        if organization_id:
            query = query.filter(UserInvitation.organization_id == organization_id)

        invitations = query.all()

        stats = {
            "total_invitations": len(invitations),
            "by_status": {},
            "by_type": {},
            "acceptance_rate": 0.0,
            "average_acceptance_time_hours": 0.0,
            "pending_count": 0,
            "expired_count": 0
        }

        # Count by status
        for invitation in invitations:
            status = invitation.status
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1

            inv_type = invitation.invitation_type
            stats["by_type"][inv_type] = stats["by_type"].get(inv_type, 0) + 1

        # Calculate acceptance rate
        accepted = stats["by_status"].get("accepted", 0)
        total_sent = sum(stats["by_status"].get(s, 0) for s in ["accepted", "expired", "failed"])
        if total_sent > 0:
            stats["acceptance_rate"] = (accepted / total_sent) * 100

        # Calculate average acceptance time
        accepted_invitations = [i for i in invitations if i.status == "accepted" and i.accepted_at]
        if accepted_invitations:
            total_hours = sum(
                (i.accepted_at - i.invited_at).total_seconds() / 3600
                for i in accepted_invitations
            )
            stats["average_acceptance_time_hours"] = total_hours / len(accepted_invitations)

        # Current pending and expired counts
        stats["pending_count"] = len([i for i in invitations if i.is_pending])
        stats["expired_count"] = len([i for i in invitations if i.is_expired])

        return stats

    # ==================== VALIDATION HELPERS ====================

    def _validate_invitation_type(self, invitation_type: str) -> None:
        """Validate invitation type."""
        valid_types = [
            "doctor", "sales", "distributor", "master_distributor",
            "office_admin", "medical_staff", "ivr_company", "shipping_logistics",
            "admin", "chp_admin"
        ]

        if invitation_type not in valid_types:
            raise ValidationError(f"Invalid invitation type: {invitation_type}")

    def _validate_role(self, role_name: str) -> None:
        """Validate role exists."""
        role = self.db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise ValidationError(f"Role {role_name} does not exist")

    def _validate_organization(self, organization_id: PyUUID) -> None:
        """Validate organization exists."""
        org = self.db.query(Organization).filter(
            Organization.id == organization_id
        ).first()
        if not org:
            raise ValidationError(f"Organization {organization_id} does not exist")

    def _validate_inviter_permissions(
        self,
        invited_by_id: PyUUID,
        invitation_type: str,
        organization_id: Optional[PyUUID]
    ) -> None:
        """Validate inviter has permission to create this type of invitation."""
        inviter = self.db.query(User).filter(User.id == invited_by_id).first()
        if not inviter:
            raise AuthorizationError("Inviter not found")

        # Admin and CHP Admin can invite anyone
        if inviter.role in ["admin", "chp_admin"]:
            return

        # Master Distributors can invite distributors and sales
        if inviter.role == "master_distributor" and invitation_type in ["distributor", "sales"]:
            return

        # Distributors can invite sales
        if inviter.role == "distributor" and invitation_type == "sales":
            return

        # Doctors can invite practice staff
        if inviter.role == "doctor" and invitation_type in ["office_admin", "medical_staff"]:
            return

        # Sales can invite doctors (with proper organization)
        if inviter.role == "sales" and invitation_type == "doctor" and organization_id:
            return

        raise AuthorizationError(
            f"User with role {inviter.role} cannot invite {invitation_type}"
        )

    def _validate_cancel_permissions(
        self,
        invitation: UserInvitation,
        cancelled_by_id: PyUUID
    ) -> None:
        """Validate user can cancel this invitation."""
        user = self.db.query(User).filter(User.id == cancelled_by_id).first()
        if not user:
            raise AuthorizationError("User not found")

        # Admin and CHP Admin can cancel any invitation
        if user.role in ["admin", "chp_admin"]:
            return

        # Original inviter can cancel
        if invitation.invited_by_id == cancelled_by_id:
            return

        raise AuthorizationError("Insufficient permissions to cancel invitation")