"""User management API endpoints."""
from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.password import get_password_hash
from app.core.security import (
    get_current_user,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    UserLogin,
    TokenResponse
)
from app.core.audit import AuditLogger
from app.core.config import settings


router = APIRouter()
audit_logger = AuditLogger()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    try:
        # Check if user already exists
        existing_user = await db.get(User, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user
        db_user = User(
            email=user_data.email,
            encrypted_password=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Authenticate user and return access token.
    
    Args:
        login_data: User login credentials
        db: Database session
        
    Returns:
        Token response with access and refresh tokens
        
    Raises:
        HTTPException: If authentication fails
    """
    # Get user by username
    user = await db.get(User, login_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check if account is locked
    if user.is_locked():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Account locked until {user.locked_until}"
        )

    # Verify password
    if not verify_password(login_data.password, user.encrypted_password):
        user.increment_failed_login()
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check MFA if enabled
    if user.mfa_enabled:
        if not login_data.mfa_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="MFA token required"
            )
        # Verify MFA token (implement MFA verification logic)
        # ...

    # Update user login status
    user.record_login()
    await db.commit()

    # Generate tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(str(user.id))

    # Log successful login
    audit_logger.log_action(
        action="user_login",
        user_id=user.id,
        resource_id=user.id,
        resource_type="user",
        organization_id=user.organization_id,
        details={"login_type": "password"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_token": refresh_token,
        "user_id": user.id
    }


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Update user profile.
    
    Args:
        user_id: ID of user to update
        user_update: Update data
        db: Database session
        current_user: Currently authenticated user
        
    Returns:
        Updated user object
        
    Raises:
        HTTPException: If update is not allowed or validation fails
    """
    # Check permissions
    if (
        current_user.id != user_id and
        not current_user.role.permissions.get("update_users")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )

    # Get user to update
    db_user = await db.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        # Update organization if specified and allowed
        if user_update.organization_id:
            if not current_user.role.permissions.get("change_organization"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to change organization"
                )
            org = await db.get(
                Organization,
                user_update.organization_id
            )
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Organization not found"
                )
            db_user.organization_id = user_update.organization_id

        # Update role if specified and allowed
        if user_update.role_id:
            if not current_user.role.permissions.get("change_role"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to change role"
                )
            role = await db.get(
                Role,
                user_update.role_id,
                Organization.id == db_user.organization_id
            )
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "Role not found or not allowed for this organization"
                    )
                )
            db_user.role_id = user_update.role_id

        # Update other fields
        for field, value in user_update.dict(exclude_unset=True).items():
            if hasattr(db_user, field):
                setattr(db_user, field, value)

        await db.commit()
        await db.refresh(db_user)

        # Log user update
        audit_logger.log_action(
            action="user_updated",
            user_id=current_user.id,
            resource_id=db_user.id,
            resource_type="user",
            organization_id=db_user.organization_id,
            details={
                "updated_fields": list(
                    user_update.dict(exclude_unset=True).keys()
                )
            }
        )

        return db_user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user),
):
    """Get current user."""
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get user by ID.
    
    Args:
        user_id: ID of user to retrieve
        db: Database session
        current_user: Currently authenticated user
        
    Returns:
        User object
        
    Raises:
        HTTPException: If user is not found or access is not allowed
    """
    # Check permissions
    if (
        current_user.id != user_id and
        not current_user.role.permissions.get("view_users")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user 