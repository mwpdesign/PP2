"""Authentication endpoints for the API."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.core.database import get_db
from app.core.security import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import (
    Token,
    UserCreate,
    UserResponse,
    LogoutResponse,
    RefreshToken
)
from app.services.users import UserService
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    try:
        # Create user service
        user_service = UserService(db)
        
        # Create user in database
        db_user = await user_service.create_user(
            user_data,
            created_by_id=None  # Registration is self-created
        )
        return db_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2 compatible token login."""
    user = await authenticate_user(
        db,
        form_data.username,
        form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create token payload
    token_data = {
        "sub": str(user["id"]),
        "role": user["role"],
        "organization_id": str(user["organization_id"]),
        "primary_territory_id": user["primary_territory_id"],
        "permissions": user.get("permissions", []),
        "is_superuser": user.get("is_superuser", False)
    }

    # Create access token
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(str(user["id"]))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshToken,
    db: AsyncSession = Depends(get_db),
):
    """Get new access token using refresh token."""
    try:
        user_id = verify_refresh_token(token_data.refresh_token)
        
        # Get user from database
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )

        # Create token payload
        token_data = {
            "sub": str(user.id),
            "role": user.role,
            "organization_id": str(user.organization_id),
            "primary_territory_id": (
                str(user.primary_territory_id)
                if user.primary_territory_id else None
            )
        }
        
        # Create new access token
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
        
        # Create new refresh token
        refresh_token = create_refresh_token(user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_user: User = Depends(get_current_user),
) -> LogoutResponse:
    """Logout current user."""
    # In a stateless JWT system, client should discard tokens
    return LogoutResponse(message="Successfully logged out") 