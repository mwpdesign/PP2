"""Service for managing doctor profiles."""

from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.doctor_profile import DoctorProfile
from app.models.user import User
from app.schemas.doctor_profile import (
    DoctorProfileCreate,
    DoctorProfileUpdate
)


class DoctorProfileService:
    """Service for doctor profile operations."""

    @staticmethod
    async def create_doctor_profile(
        db: AsyncSession,
        profile_data: DoctorProfileCreate,
        created_by_id: UUID
    ) -> DoctorProfile:
        """Create a new doctor profile."""
        # Check if profile already exists for this user
        existing = await DoctorProfileService.get_by_user_id(
            db, profile_data.user_id
        )
        if existing:
            raise ValueError("Doctor profile already exists for this user")

        # Create new profile
        profile = DoctorProfile(
            **profile_data.dict(),
            created_by_id=created_by_id
        )

        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def get_doctor_profile(
        db: AsyncSession,
        profile_id: UUID
    ) -> Optional[DoctorProfile]:
        """Get doctor profile by ID."""
        result = await db.execute(
            select(DoctorProfile)
            .options(selectinload(DoctorProfile.user))
            .where(DoctorProfile.id == profile_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_user_id(
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[DoctorProfile]:
        """Get doctor profile by user ID."""
        result = await db.execute(
            select(DoctorProfile)
            .options(selectinload(DoctorProfile.user))
            .where(DoctorProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_doctor_profile(
        db: AsyncSession,
        profile_id: UUID,
        profile_data: DoctorProfileUpdate,
        updated_by_id: UUID
    ) -> Optional[DoctorProfile]:
        """Update doctor profile."""
        profile = await DoctorProfileService.get_doctor_profile(
            db, profile_id
        )
        if not profile:
            return None

        # Update fields
        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        profile.updated_by_id = updated_by_id

        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def delete_doctor_profile(
        db: AsyncSession,
        profile_id: UUID
    ) -> bool:
        """Delete doctor profile."""
        profile = await DoctorProfileService.get_doctor_profile(
            db, profile_id
        )
        if not profile:
            return False

        await db.delete(profile)
        await db.commit()
        return True

    @staticmethod
    async def list_doctor_profiles(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        specialty: Optional[str] = None,
        state: Optional[str] = None,
        accepts_medicare: Optional[bool] = None,
        wound_care_only: bool = False
    ) -> List[DoctorProfile]:
        """List doctor profiles with optional filters."""
        query = select(DoctorProfile).options(
            selectinload(DoctorProfile.user)
        )

        # Apply filters
        filters = []

        if specialty:
            filters.append(
                DoctorProfile.specialty.ilike(f"%{specialty}%")
            )

        if state:
            filters.append(
                DoctorProfile.facility_state == state.upper()
            )

        if accepts_medicare is not None:
            filters.append(
                DoctorProfile.accepts_medicare == accepts_medicare
            )

        if wound_care_only:
            filters.append(
                DoctorProfile.wound_care_percentage >= 50
            )

        if filters:
            query = query.where(and_(*filters))

        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def search_doctors_by_npi(
        db: AsyncSession,
        npi_number: str
    ) -> Optional[DoctorProfile]:
        """Search doctor by NPI number."""
        result = await db.execute(
            select(DoctorProfile)
            .options(selectinload(DoctorProfile.user))
            .where(DoctorProfile.npi_number == npi_number)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_doctors_by_hierarchy(
        db: AsyncSession,
        parent_user_id: UUID,
        hierarchy_type: str = "sales"  # sales, distributor, master_distributor
    ) -> List[DoctorProfile]:
        """Get doctors under a specific user in the hierarchy."""
        # Map hierarchy type to column
        hierarchy_columns = {
            "sales": User.parent_sales_id,
            "distributor": User.parent_distributor_id,
            "master_distributor": User.parent_master_distributor_id
        }

        if hierarchy_type not in hierarchy_columns:
            raise ValueError(f"Invalid hierarchy type: {hierarchy_type}")

        column = hierarchy_columns[hierarchy_type]

        # Get users under this parent
        user_query = select(User).where(column == parent_user_id)
        user_result = await db.execute(user_query)
        users = user_result.scalars().all()

        if not users:
            return []

        # Get doctor profiles for these users
        user_ids = [user.id for user in users]
        profile_query = select(DoctorProfile).options(
            selectinload(DoctorProfile.user)
        ).where(DoctorProfile.user_id.in_(user_ids))

        result = await db.execute(profile_query)
        return result.scalars().all()

    @staticmethod
    async def get_wound_care_specialists(
        db: AsyncSession,
        min_percentage: int = 50
    ) -> List[DoctorProfile]:
        """Get doctors who specialize in wound care."""
        result = await db.execute(
            select(DoctorProfile)
            .options(selectinload(DoctorProfile.user))
            .where(DoctorProfile.wound_care_percentage >= min_percentage)
        )
        return result.scalars().all()

    @staticmethod
    async def get_profile_statistics(
        db: AsyncSession
    ) -> dict:
        """Get statistics about doctor profiles."""
        from sqlalchemy import func, case

        result = await db.execute(
            select(
                func.count(DoctorProfile.id).label("total_profiles"),
                func.count(
                    case(
                        (DoctorProfile.wound_care_percentage >= 50, 1),
                        else_=None
                    )
                ).label("wound_care_specialists"),
                func.count(
                    case(
                        (DoctorProfile.accepts_medicare == True, 1),  # noqa: E712
                        else_=None
                    )
                ).label("medicare_providers"),
                func.count(
                    case(
                        (DoctorProfile.accepts_medicaid == True, 1),  # noqa: E712
                        else_=None
                    )
                ).label("medicaid_providers"),
                func.avg(DoctorProfile.years_in_practice).label("avg_years_practice"),
                func.avg(DoctorProfile.patient_volume_per_month).label("avg_patient_volume")
            )
        )

        stats = result.first()
        return {
            "total_profiles": stats.total_profiles or 0,
            "wound_care_specialists": stats.wound_care_specialists or 0,
            "medicare_providers": stats.medicare_providers or 0,
            "medicaid_providers": stats.medicaid_providers or 0,
            "avg_years_practice": float(stats.avg_years_practice or 0),
            "avg_patient_volume": float(stats.avg_patient_volume or 0)
        }