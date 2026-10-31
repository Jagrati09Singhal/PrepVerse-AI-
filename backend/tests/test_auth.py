import datetime
import uuid
import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.api.auth import register, login, get_current_user_profile
from app.api.deps import get_current_user
from app.schemas.auth import UserRegisterRequest, UserLoginRequest
from app.core.security import create_access_token


def test_successful_registration(db_session: Session):
    """Verify new user registration with name, email, and password."""
    payload = UserRegisterRequest(
        name="Candidate Jane",
        email="jane.doe@example.com",
        password="SecurePassword123!",
    )
    response = register(payload, db=db_session)

    assert response.token_type == "bearer"
    assert response.access_token is not None
    assert response.expires_in > 0
    assert response.user.name == "Candidate Jane"
    assert response.user.email == "jane.doe@example.com"
    assert isinstance(response.user.id, uuid.UUID)

    # Ensure password_hash is never present in the response model
    assert not hasattr(response.user, "password_hash")


def test_email_normalization_on_registration(db_session: Session):
    """Verify email is stripped and lowercased upon registration."""
    payload = UserRegisterRequest(
        name="Candidate John",
        email="  JOHN.DOE@EXAMPLE.COM  ",
        password="SecurePassword123!",
    )
    response = register(payload, db=db_session)
    assert response.user.email == "john.doe@example.com"


def test_duplicate_email_registration_conflict(db_session: Session):
    """Verify duplicate email registration yields HTTP 409 Conflict."""
    payload1 = UserRegisterRequest(
        name="First User",
        email="unique@example.com",
        password="Password123!",
    )
    register(payload1, db=db_session)

    # Attempt registration with identical email (different case)
    payload2 = UserRegisterRequest(
        name="Second User",
        email="UNIQUE@EXAMPLE.COM",
        password="DifferentPassword456!",
    )
    with pytest.raises(HTTPException) as exc_info:
        register(payload2, db=db_session)

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in exc_info.value.detail


def test_registration_schema_validation():
    """Verify Pydantic input validation for short password, blank name, and invalid email."""
    # Blank name
    with pytest.raises(ValidationError):
        UserRegisterRequest(name="   ", email="test@example.com", password="Password123!")

    # Password too short (< 8 chars)
    with pytest.raises(ValidationError):
        UserRegisterRequest(name="Valid Name", email="test@example.com", password="short")

    # Invalid email format
    with pytest.raises(ValidationError):
        UserRegisterRequest(name="Valid Name", email="invalid-email-address", password="Password123!")


def test_successful_login(db_session: Session):
    """Verify login with correct credentials returns valid JWT token and user profile."""
    # Register candidate
    reg_payload = UserRegisterRequest(
        name="Login Candidate",
        email="login.test@example.com",
        password="MySecretPassword1!",
    )
    register(reg_payload, db=db_session)

    # Login with case-insensitive email
    login_payload = UserLoginRequest(
        email="LOGIN.TEST@EXAMPLE.COM",
        password="MySecretPassword1!",
    )
    login_response = login(login_payload, db=db_session)

    assert login_response.token_type == "bearer"
    assert login_response.access_token is not None
    assert login_response.user.email == "login.test@example.com"
    assert not hasattr(login_response.user, "password_hash")


def test_login_invalid_password_generic_error(db_session: Session):
    """Verify incorrect password returns HTTP 401 with generic error to prevent enumeration."""
    reg_payload = UserRegisterRequest(
        name="Enum Protected",
        email="protected@example.com",
        password="RealPassword123!",
    )
    register(reg_payload, db=db_session)

    login_payload = UserLoginRequest(
        email="protected@example.com",
        password="WrongPassword999!",
    )
    with pytest.raises(HTTPException) as exc_info:
        login(login_payload, db=db_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Invalid email or password"


def test_login_nonexistent_user_generic_error(db_session: Session):
    """Verify non-existent user returns identical 401 message as incorrect password."""
    login_payload = UserLoginRequest(
        email="ghost@example.com",
        password="AnyPassword123!",
    )
    with pytest.raises(HTTPException) as exc_info:
        login(login_payload, db=db_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Invalid email or password"


def test_get_current_user_profile_me_success(db_session: Session):
    """Verify GET /auth/me returns the authenticated user profile."""
    reg = register(
        UserRegisterRequest(
            name="Me Test User",
            email="me.user@example.com",
            password="Password123!",
        ),
        db=db_session,
    )

    auth = HTTPAuthorizationCredentials(scheme="Bearer", credentials=reg.access_token)
    user = get_current_user(auth=auth, db=db_session)
    profile = get_current_user_profile(current_user=user)

    assert profile.id == reg.user.id
    assert profile.email == "me.user@example.com"
    assert profile.name == "Me Test User"
    assert not hasattr(profile, "password_hash")


def test_get_current_user_unauthenticated_missing_token(db_session: Session):
    """Verify unauthenticated request without token is rejected with 401."""
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(auth=None, db=db_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "credentials were not provided" in exc_info.value.detail


def test_get_current_user_invalid_token(db_session: Session):
    """Verify malformed or forged token is rejected with 401."""
    auth = HTTPAuthorizationCredentials(scheme="Bearer", credentials="completely.fake.token")
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(auth=auth, db=db_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in exc_info.value.detail


def test_get_current_user_expired_token(db_session: Session):
    """Verify expired token is rejected with 401."""
    expired_token = create_access_token(
        subject=uuid.uuid4(),
        email="expired@example.com",
        expires_delta=datetime.timedelta(seconds=-10),
    )
    auth = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(auth=auth, db=db_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Token has expired" in exc_info.value.detail


def test_multi_user_data_isolation(db_session: Session):
    """
    Verify strict user isolation:
    User A's token only accesses User A's profile.
    User B's token only accesses User B's profile.
    Neither user can cross-access the other's private identity.
    """
    user_a_reg = register(
        UserRegisterRequest(name="Candidate Alpha", email="alpha@example.com", password="Password123!"),
        db=db_session,
    )
    user_b_reg = register(
        UserRegisterRequest(name="Candidate Beta", email="beta@example.com", password="Password456!"),
        db=db_session,
    )

    auth_a = HTTPAuthorizationCredentials(scheme="Bearer", credentials=user_a_reg.access_token)
    user_a = get_current_user(auth=auth_a, db=db_session)
    profile_a = get_current_user_profile(current_user=user_a)

    auth_b = HTTPAuthorizationCredentials(scheme="Bearer", credentials=user_b_reg.access_token)
    user_b = get_current_user(auth=auth_b, db=db_session)
    profile_b = get_current_user_profile(current_user=user_b)

    # Assert identities are distinct and isolated
    assert profile_a.id == user_a_reg.user.id
    assert profile_a.email == "alpha@example.com"
    assert profile_a.name == "Candidate Alpha"

    assert profile_b.id == user_b_reg.user.id
    assert profile_b.email == "beta@example.com"
    assert profile_b.name == "Candidate Beta"

    # User A cannot be User B
    assert profile_a.id != profile_b.id
    assert profile_a.email != profile_b.email

