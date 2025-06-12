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
    Create a new doctor user account with profile.
    Designed for sales representatives adding doctors to their network.
    """
    try:
        # Basic permission check for sales hierarchy
        user_role = current_user.role.lower() if current_user.role else ""
        allowed_roles = [
            "sales", "distributor", "master_distributor", "admin", "chp_admin"
        ]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create doctors"
            )

        # Validate required fields
        required_fields = ["email", "first_name", "last_name", "npi_number"]
        missing_fields = [
            field for field in required_fields if not doctor_data.get(field)
        ]
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )

        # Check if user already exists
        existing_user_query = select(User).where(
            or_(
                User.email == doctor_data["email"],
                User.username == doctor_data["email"]  # Use email as username
            )
        )
        existing_result = await db.execute(existing_user_query)
        existing_user = existing_result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )

        # Get or create Doctor role
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

        # Generate temporary password
        first_name_part = doctor_data['first_name'][:2]
        last_name_part = doctor_data['last_name'][:2]
        email_hash = str(hash(doctor_data['email']))[-4:]
        temp_password = f"TempPass{first_name_part}{last_name_part}{email_hash}!"

        # Create user account
        new_user = User(
            username=doctor_data["email"],  # Use email as username
            email=doctor_data["email"],
            encrypted_password=get_password_hash(temp_password),
            first_name=doctor_data["first_name"],
            last_name=doctor_data["last_name"],
            role_id=doctor_role.id,
            organization_id=current_user.organization_id,
            is_active=True,
            is_superuser=False,
            added_by_id=current_user.id,
            force_password_change=True,
            # Sales hierarchy fields
            parent_sales_id=(
                current_user.id if user_role == "sales" else None
            ),
            parent_distributor_id=(
                current_user.id if user_role == "distributor" else None
            ),
            parent_master_distributor_id=(
                current_user.id if user_role == "master_distributor" else None
            )
        )

        db.add(new_user)
        await db.flush()  # Get the user ID

        # Create doctor profile
        doctor_profile = DoctorProfile(
            user_id=new_user.id,
            # Professional Information
            professional_title="Dr.",
            specialty=doctor_data.get("specialty", ""),
            medical_license_number=doctor_data.get("medical_license_number", ""),
            medical_license_state=doctor_data.get("practice_state", ""),  # Use practice state for license
            npi_number=doctor_data["npi_number"],
            dea_number=doctor_data.get("dea_number"),
            tax_id=doctor_data.get("tax_id"),
            board_certifications=doctor_data.get("board_certifications", []),
            wound_care_percentage=doctor_data.get("wound_care_percentage"),

            # Practice Information
            primary_facility_name=doctor_data.get("practice_name", ""),
            facility_address_line1=doctor_data.get("practice_address_line1", ""),
            facility_address_line2=doctor_data.get("practice_address_line2"),
            facility_city=doctor_data.get("practice_city", ""),
            facility_state=doctor_data.get("practice_state", ""),
            facility_zip_code=doctor_data.get("practice_zip", ""),
            facility_phone=doctor_data.get("practice_phone"),
            facility_fax=doctor_data.get("practice_fax"),

            # Contact Information (phone goes here, not in User model)
            office_contact_phone=doctor_data.get("phone"),  # Primary phone
            office_contact_name=doctor_data.get("emergency_contact_name"),

            # Shipping Information
            shipping_address_line1=doctor_data.get("shipping_address_line1", ""),
            shipping_address_line2=doctor_data.get("shipping_address_line2"),
            shipping_city=doctor_data.get("shipping_city", ""),
            shipping_state=doctor_data.get("shipping_state", ""),
            shipping_zip_code=doctor_data.get("shipping_zip", ""),

            # Default values for required fields
            accepts_medicare=True,
            accepts_medicaid=True,
            years_in_practice=doctor_data.get("years_of_experience", 0)
        )

        db.add(doctor_profile)
        await db.commit()
        await db.refresh(new_user)
        await db.refresh(doctor_profile)

        # Log the successful creation
        logger.info(
            f"Doctor created by {current_user.role} {current_user.email}: "
            f"{new_user.email}"
        )

        # Return success response with temporary password
        return {
            "id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "is_active": new_user.is_active,
            "temporary_password": temp_password,
            "force_password_change": True,
            "added_by": f"{current_user.role}: {current_user.email}",
            "message": (
                f"Doctor {new_user.first_name} {new_user.last_name} has been "
                f"successfully added to your network!"
            )
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