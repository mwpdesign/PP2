"""
Practice Service
Phase 2: Foundation Systems - Practice-Level Delegation

Service for managing practice-level delegation and data filtering.
Ensures staff can only access their doctor's practice data.
"""

import logging
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, Query, selectinload
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.rbac import Role
from app.schemas.token import TokenData
from app.core.password import get_password_hash

logger = logging.getLogger(__name__)


class PracticeService:
    """Service for practice-level delegation operations."""

    @staticmethod
    def get_practice_scope(user: User) -> Optional[UUID]:
        """
        Get the practice scope for a user.

        Returns:
        - For doctors: their own user_id
        - For staff: their parent_doctor_id
        - For others: None
        """
        if not user:
            return None

        # If user is a doctor, they see their own practice
        if user.role and user.role.name.lower() == 'doctor':
            return user.id

        # If user is staff, they see their doctor's practice
        if (user.parent_doctor_id and
            user.practice_role in ['office_admin', 'medical_staff']):
            return user.parent_doctor_id

        return None

    @staticmethod
    def filter_by_practice(query, user: User, model_class):
        """
        Filter a query to only show data within the user's practice scope.

        Args:
            query: SQLAlchemy query object
            user: Current user
            model_class: The model being queried (Patient, Order, etc.)

        Returns:
            Filtered query
        """
        practice_scope = PracticeService.get_practice_scope(user)

        if not practice_scope:
            # User has no practice scope, return empty result
            return query.where(model_class.id == None)  # noqa: E711

        # Filter by created_by_id matching practice scope
        # This assumes models have created_by_id field
        if hasattr(model_class, 'created_by_id'):
            return query.where(
                or_(
                    model_class.created_by_id == practice_scope,
                    model_class.created_by_id.in_(
                        select(User.id).where(
                            User.parent_doctor_id == practice_scope
                        )
                    )
                )
            )

        return query

    @staticmethod
    async def create_staff_invitation(
        db: AsyncSession,
        doctor: User,
        email: str,
        practice_role: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create an invitation for a staff member.

        Args:
            db: Database session
            doctor: Doctor user creating the invitation
            email: Email of the person to invite
            practice_role: 'office_admin' or 'medical_staff'
            first_name: Optional first name
            last_name: Optional last name

        Returns:
            Dictionary with invitation details
        """
        # Validate doctor role
        if not doctor.role or doctor.role.name.lower() != 'doctor':
            raise ValueError("Only doctors can invite staff members")

        # Validate practice role
        if practice_role not in ['office_admin', 'medical_staff']:
            raise ValueError(
                "Practice role must be 'office_admin' or 'medical_staff'"
            )

        # Check if user already exists
        existing_user = await db.execute(
            select(User).where(User.email == email)
        )
        if existing_user.scalar_one_or_none():
            raise ValueError("User with this email already exists")

        # Get the appropriate role
        role_result = await db.execute(
            select(Role).where(Role.name == practice_role)
        )
        role = role_result.scalar_one_or_none()
        if not role:
            raise ValueError(f"Role '{practice_role}' not found")

        # Generate invitation token
        invitation_token = secrets.token_urlsafe(32)

        # Create user with invitation
        new_user = User(
            email=email,
            username=email,  # Use email as username initially
            first_name=first_name,
            last_name=last_name,
            encrypted_password="",  # Will be set when invitation is accepted
            is_active=False,  # Inactive until invitation accepted
            role_id=role.id,
            organization_id=doctor.organization_id,
            parent_doctor_id=doctor.id,
            practice_role=practice_role,
            invitation_token=invitation_token,
            invited_at=datetime.utcnow(),
            added_by_id=doctor.id,
            added_at=datetime.utcnow()
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return {
            "user_id": new_user.id,
            "email": email,
            "practice_role": practice_role,
            "invitation_token": invitation_token,
            "invited_at": new_user.invited_at,
            "expires_at": new_user.invited_at + timedelta(days=7)
        }

    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        invitation_token: str,
        password: str,
        username: Optional[str] = None
    ) -> User:
        """
        Accept a staff invitation and complete registration.

        Args:
            db: Database session
            invitation_token: The invitation token
            password: New password for the user
            username: Optional username (defaults to email)

        Returns:
            The activated user
        """
        # Find user by invitation token
        result = await db.execute(
            select(User).where(
                and_(
                    User.invitation_token == invitation_token,
                    User.is_active == False  # noqa: E712
                )
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError("Invalid or expired invitation token")

        # Check if invitation has expired (7 days)
        if (user.invited_at and
            user.invited_at < datetime.utcnow() - timedelta(days=7)):
            raise ValueError("Invitation has expired")

        # Activate user and set password
        user.encrypted_password = get_password_hash(password)
        user.is_active = True
        user.invitation_token = None  # Clear the token
        user.password_changed_at = datetime.utcnow()

        if username and username != user.username:
            # Check if username is available
            existing = await db.execute(
                select(User).where(
                    and_(
                        User.username == username,
                        User.id != user.id
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise ValueError("Username already taken")
            user.username = username

        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def get_practice_staff(
        db: AsyncSession,
        doctor: User
    ) -> List[User]:
        """
        Get all staff members for a doctor's practice.

        Args:
            db: Database session
            doctor: Doctor user

        Returns:
            List of staff users
        """
        if not doctor.role or doctor.role.name.lower() != 'doctor':
            raise ValueError("Only doctors can view practice staff")

        result = await db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.parent_doctor_id == doctor.id)
            .order_by(User.created_at)
        )

        return result.scalars().all()

    @staticmethod
    async def deactivate_staff_member(
        db: AsyncSession,
        doctor: User,
        staff_user_id: UUID
    ) -> bool:
        """
        Deactivate a staff member.

        Args:
            db: Database session
            doctor: Doctor user
            staff_user_id: ID of staff member to deactivate

        Returns:
            True if successful
        """
        if not doctor.role or doctor.role.name.lower() != 'doctor':
            raise ValueError("Only doctors can deactivate staff members")

        # Find staff member
        result = await db.execute(
            select(User).where(
                and_(
                    User.id == staff_user_id,
                    User.parent_doctor_id == doctor.id
                )
            )
        )
        staff_user = result.scalar_one_or_none()

        if not staff_user:
            raise ValueError(
                "Staff member not found or not in your practice"
            )

        # Deactivate user
        staff_user.is_active = False
        staff_user.updated_at = datetime.utcnow()

        await db.commit()
        return True

    @staticmethod
    def can_manage_staff(user: User) -> bool:
        """
        Check if a user can manage staff members.

        Args:
            user: User to check

        Returns:
            True if user can manage staff
        """
        return user.role and user.role.name.lower() == 'doctor'

    @staticmethod
    def is_staff_member(user: User) -> bool:
        """
        Check if a user is a staff member.

        Args:
            user: User to check

        Returns:
            True if user is staff
        """
        return (
            user.parent_doctor_id is not None and
            user.practice_role in ['office_admin', 'medical_staff']
        )

    @staticmethod
    async def get_practice_statistics(
        db: AsyncSession,
        doctor: User
    ) -> Dict[str, Any]:
        """
        Get statistics for a doctor's practice.

        Args:
            db: Database session
            doctor: Doctor user

        Returns:
            Dictionary with practice statistics
        """
        if not doctor.role or doctor.role.name.lower() != 'doctor':
            raise ValueError("Only doctors can view practice statistics")

        # Count staff members
        staff_result = await db.execute(
            select(User).where(User.parent_doctor_id == doctor.id)
        )
        staff_members = staff_result.scalars().all()

        active_staff = len([s for s in staff_members if s.is_active])
        office_admins = len([
            s for s in staff_members if s.practice_role == 'office_admin'
        ])
        medical_staff = len([
            s for s in staff_members if s.practice_role == 'medical_staff'
        ])
        pending_invitations = len([
            s for s in staff_members
            if not s.is_active and s.invitation_token
        ])

        return {
            "total_staff": len(staff_members),
            "active_staff": active_staff,
            "office_admins": office_admins,
            "medical_staff": medical_staff,
            "pending_invitations": pending_invitations
        }


# Utility functions
def get_practice_service(db: Session) -> PracticeService:
    """Get an instance of the practice service."""
    return PracticeService(db)