"""
Doctors API Endpoints
Provides endpoints for managing and retrieving doctor information.
"""

import logging
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.doctor_profile import DoctorProfile
from app.models.rbac import Role
from app.models.organization import Organization
from app.schemas.token import TokenData
from app.core.password import get_password_hash

logger = logging.getLogger(__name__)

router = APIRouter()


class DoctorListResponse:
    """Response model for doctor list."""

    def __init__(self, doctors: List[dict], total: int, page: int, pages: int):
        self.doctors = doctors
        self.total = total
        self.page = page
        self.pages = pages


@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify the router is working."""
    return {"message": "Doctors router is working"}


@router.post("/")
async def create_doctor_simple(
    doctor_data: dict,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new doctor user account.
    """
    try:
        # Basic permission check
        user_role = current_user.role.lower() if current_user.role else ""
        if user_role not in ["sales", "distributor", "master_distributor", "admin", "chp_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create doctors"
            )

        # Check if user already exists
        existing_user_query = select(User).where(
            or_(
                User.email == doctor_data["email"],
                User.username == doctor_data["username"]
            )
        )
        existing_result = await db.execute(existing_user_query)
        existing_user = existing_result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )

        # Get a default role (we'll create a Doctor role or use existing)
        role_query = select(Role).where(
            Role.name == "Doctor",
            Role.organization_id == current_user.organization_id
        )
        role_result = await db.execute(role_query)
        doctor_role = role_result.scalar_one_or_none()

        if not doctor_role:
            # Create Doctor role if it doesn't exist
            doctor_role = Role(
                name="Doctor",
                description="Doctor role for healthcare providers",
                organization_id=current_user.organization_id,
                permissions={}
            )
            db.add(doctor_role)
            await db.flush()

        # Create user with minimal required fields
        new_user = User(
            username=doctor_data["username"],
            email=doctor_data["email"],
            encrypted_password=get_password_hash(doctor_data["password"]),
            first_name=doctor_data.get("first_name", ""),
            last_name=doctor_data.get("last_name", ""),
            role_id=doctor_role.id,
            organization_id=current_user.organization_id,
            is_active=doctor_data.get("is_active", True),
            is_superuser=False,
            added_by_id=current_user.id,
            force_password_change=doctor_data.get("force_password_change", True)
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Return user data
        return {
            "id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "is_active": new_user.is_active,
            "message": "Doctor user created successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating doctor: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create doctor: {str(e)}"
        )


@router.get("/simple")
async def get_doctors_simple(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Simple doctors list endpoint for testing."""
    try:
        # Just return a simple response for now
        return {
            "doctors": [],
            "total": 0,
            "page": 1,
            "pages": 0,
            "message": "Simple endpoint working"
        }
    except Exception as e:
        logger.error(f"Error in simple endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.get("/")
async def get_doctors(
    search: Optional[str] = Query(
        None, description="Search by name, email, or specialty"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get doctors list with hierarchy filtering.

    - Sales reps see only doctors they added
    - Distributors see all their sales reps' doctors
    - Master distributors see entire chain
    - Admins see all doctors
    """
    try:
        # Calculate offset
        offset = (page - 1) * limit

        # Base query for doctors (users with Doctor role)
        base_query = select(User).options(
            selectinload(User.doctor_profile),
            selectinload(User.role),
            selectinload(User.added_by)
        ).join(Role, User.role_id == Role.id).where(Role.name == "Doctor")

        # Apply hierarchy filtering based on user role
        user_role = current_user.role.lower() if current_user.role else ""

        if user_role == "sales":
            # Sales reps see only doctors they added
            base_query = base_query.where(User.added_by_id == current_user.id)

        elif user_role == "distributor":
            # Distributors see all their sales reps' doctors
            # Get all sales reps under this distributor
            sales_reps_query = select(User.id).where(
                User.parent_distributor_id == current_user.id
            )
            sales_rep_ids = await db.execute(sales_reps_query)
            sales_rep_id_list = [row[0] for row in sales_rep_ids.fetchall()]

            # Include doctors added by this distributor or their sales reps
            base_query = base_query.where(
                or_(
                    User.added_by_id == current_user.id,
                    User.added_by_id.in_(sales_rep_id_list)
                )
            )

        elif user_role == "master_distributor":
            # Master distributors see entire chain
            # Get all distributors under this master distributor
            distributors_query = select(User.id).where(
                User.parent_master_distributor_id == current_user.id
            )
            distributor_ids = await db.execute(distributors_query)
            distributor_id_list = [row[0] for row in distributor_ids.fetchall()]

            # Get all sales reps under these distributors
            sales_reps_query = select(User.id).where(
                or_(
                    User.parent_distributor_id.in_(distributor_id_list),
                    User.parent_master_distributor_id == current_user.id
                )
            )
            sales_rep_ids = await db.execute(sales_reps_query)
            sales_rep_id_list = [row[0] for row in sales_rep_ids.fetchall()]

            # Include doctors added by master distributor, distributors, or sales reps
            all_allowed_ids = (
                [current_user.id] + distributor_id_list + sales_rep_id_list
            )
            base_query = base_query.where(
                User.added_by_id.in_(all_allowed_ids)
            )

        elif user_role in ["admin", "chp_admin"]:
            # Admins see all doctors - no additional filtering needed
            pass
        else:
            # Other roles cannot access doctors list
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view doctors"
            )

        # Apply search filter if provided
        if search:
            search_term = f"%{search.lower()}%"
            base_query = base_query.where(
                or_(
                    func.lower(
                        User.first_name + ' ' + User.last_name
                    ).like(search_term),
                    func.lower(User.email).like(search_term),
                    func.lower(DoctorProfile.specialty).like(search_term),
                    func.lower(
                        DoctorProfile.primary_facility_name
                    ).like(search_term)
                )
            )

        # Get total count for pagination
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination and ordering
        doctors_query = base_query.order_by(
            User.created_at.desc()
        ).offset(offset).limit(limit)

        # Execute query
        result = await db.execute(doctors_query)
        doctors = result.scalars().all()

        # Format response
        doctors_list = []
        for doctor in doctors:
            profile = doctor.doctor_profile
            added_by_name = "System"
            if doctor.added_by:
                added_by_name = (f"{doctor.added_by.first_name} "
                               f"{doctor.added_by.last_name}").strip()
                if not added_by_name:
                    added_by_name = doctor.added_by.username

            doctors_list.append({
                "id": str(doctor.id),
                "first_name": doctor.first_name or "",
                "last_name": doctor.last_name or "",
                "email": doctor.email,
                "specialty": profile.specialty if profile else "Not specified",
                "facility": (profile.primary_facility_name if profile
                           else "Not specified"),
                "status": "active" if doctor.is_active else "inactive",
                "added_by_name": added_by_name,
                "created_at": (doctor.created_at.isoformat()
                             if doctor.created_at else None)
            })

        # Calculate pagination info
        pages = (total + limit - 1) // limit  # Ceiling division

        return {
            "doctors": doctors_list,
            "total": total,
            "page": page,
            "pages": pages
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch doctors"
        )


@router.get("/{doctor_id}")
async def get_doctor_detail(
    doctor_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific doctor.
    """
    try:
        # Get doctor with profile
        query = select(User).options(
            selectinload(User.doctor_profile),
            selectinload(User.role),
            selectinload(User.added_by)
        ).where(
            and_(
                User.id == doctor_id,
                User.doctor_profile.has()  # Ensure user has doctor profile
            )
        )

        result = await db.execute(query)
        doctor = result.scalar_one_or_none()

        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )

        # Check if current user can access this doctor
        user_role = current_user.role.lower() if current_user.role else ""
        can_access = False

        if user_role in ["admin", "chp_admin"]:
            can_access = True
        elif user_role == "sales" and doctor.added_by_id == current_user.id:
            can_access = True
        elif user_role in ["distributor", "master_distributor"]:
            # More complex hierarchy check would go here
            # For now, allow access
            can_access = True

        if not can_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view this doctor"
            )

        # Format detailed response
        profile = doctor.doctor_profile
        added_by_name = "System"
        if doctor.added_by:
            added_by_name = (f"{doctor.added_by.first_name} "
                           f"{doctor.added_by.last_name}").strip()
            if not added_by_name:
                added_by_name = doctor.added_by.username

        return {
            "id": str(doctor.id),
            "first_name": doctor.first_name or "",
            "last_name": doctor.last_name or "",
            "email": doctor.email,
            "username": doctor.username,
            "is_active": doctor.is_active,
            "created_at": (doctor.created_at.isoformat()
                         if doctor.created_at else None),
            "added_by_name": added_by_name,
            "profile": {
                "professional_title": (profile.professional_title
                                      if profile else None),
                "specialty": profile.specialty if profile else None,
                "medical_license_number": (profile.medical_license_number
                                         if profile else None),
                "npi_number": profile.npi_number if profile else None,
                "primary_facility_name": (profile.primary_facility_name
                                        if profile else None),
                "facility_address_line1": (profile.facility_address_line1
                                         if profile else None),
                "facility_city": profile.facility_city if profile else None,
                "facility_state": profile.facility_state if profile else None,
                "facility_zip_code": (profile.facility_zip_code
                                    if profile else None),
                "facility_phone": profile.facility_phone if profile else None,
                "office_contact_name": (profile.office_contact_name
                                      if profile else None),
                "office_contact_phone": (profile.office_contact_phone
                                       if profile else None),
                "years_in_practice": (profile.years_in_practice
                                    if profile else None),
                "wound_care_percentage": (profile.wound_care_percentage
                                        if profile else None),
                "accepts_medicare": (profile.accepts_medicare
                                   if profile else None),
                "accepts_medicaid": (profile.accepts_medicaid
                                   if profile else None)
            } if profile else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctor detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch doctor details"
        )