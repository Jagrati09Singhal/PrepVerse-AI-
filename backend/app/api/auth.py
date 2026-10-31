import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Precomputed valid bcrypt hash used to normalize response time against timing attacks when user is not found
_DUMMY_BCRYPT_HASH = "$2b$12$K1n0zX8.tF8uL9vXwYZpauYwWc1D2e3F4g5H6i7J8k9L0m1N2o3P."


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new candidate account",
    responses={
        status.HTTP_409_CONFLICT: {
            "description": "Email address already registered",
        },
        422: {
            "description": "Validation error (invalid email format or password constraints)",
        },
    },
)
def register(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Register a new user account with validated credentials.
    Normalizes email, hashes password securely via bcrypt, and returns an access token.
    """
    normalized_email = payload.email.strip().lower()

    # Check for existing user with this email
    existing_user = db.scalar(select(User).where(User.email == normalized_email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists",
        )

    # Hash the password with bcrypt (never stored or logged in plain text)
    hashed_password = hash_password(payload.password)

    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue access token immediately for a seamless onboarding experience
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        subject=user.id,
        email=user.email,
        expires_delta=datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with email and password",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Invalid email or password",
        },
    },
)
def login(
    payload: UserLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate a user with email and password.
    Employs generic error messaging and constant-time comparison to prevent account enumeration.
    """
    normalized_email = payload.email.strip().lower()

    user = db.scalar(select(User).where(User.email == normalized_email))

    if not user:
        # Perform dummy bcrypt check to equalize response time and prevent timing side-channel attacks
        verify_password(payload.password, _DUMMY_BCRYPT_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        subject=user.id,
        email=user.email,
        expires_delta=datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Missing, expired, or invalid authorization token",
        },
    },
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Returns the authenticated user's profile.
    Derives identity exclusively from the verified JWT access token, enforcing strict user isolation.
    """
    return UserResponse.model_validate(current_user)
