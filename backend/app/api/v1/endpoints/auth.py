from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserResponse, LogoutResponse
from app.services.cognito import CognitoService
from app.services.users import create_user

router = APIRouter()
cognito = CognitoService()

# Development only - create test user
@router.post("/test-user", response_model=UserResponse)
async def create_test_user(db: AsyncSession = Depends(get_db)):
    """Create a test user for development"""
    if not any(env in ["development", "local"] for env in ["local"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test users can only be created in development"
        )
    
    test_user = UserCreate(
        email="test@healthcare.dev",
        password="Test123!",
        first_name="Test",
        last_name="User"
    )
    
    try:
        # Create test user in database
        db_user = await create_user(db, test_user, "test_user_id")
        return db_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user"""
    try:
        # Register user in Cognito
        cognito_user = await cognito.sign_up(
            email=user_data.email,
            password=user_data.password,
            user_attributes={
                "given_name": user_data.first_name,
                "family_name": user_data.last_name,
            },
        )

        # Create user in database
        db_user = await create_user(db, user_data, cognito_user["UserSub"])
        return db_user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2 compatible token login"""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_user: User = Depends(get_current_user),
) -> LogoutResponse:
    """Logout current user"""
    try:
        await cognito.sign_out(current_user.cognito_id)
        return LogoutResponse(message="Successfully logged out")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) 