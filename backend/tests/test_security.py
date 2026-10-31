import datetime
import pytest
import jwt
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_hash_password_and_verification():
    """Verify password hashing creates unique bcrypt salts and verifies correctly."""
    plain = "CandidatePass123!"
    hashed1 = hash_password(plain)
    hashed2 = hash_password(plain)

    # Different salts must produce distinct hashes
    assert hashed1 != hashed2
    assert hashed1.startswith("$2b$")

    # Verification must succeed for correct password
    assert verify_password(plain, hashed1) is True
    assert verify_password(plain, hashed2) is True

    # Verification must fail for incorrect password
    assert verify_password("WrongPassword123!", hashed1) is False
    assert verify_password("", hashed1) is False


def test_hash_password_length_constraints():
    """Verify password length boundaries (min 8 chars, max 72 bytes)."""
    # Too short (< 8 chars)
    with pytest.raises(ValueError, match="at least 8 characters"):
        hash_password("short7")

    # Too long (> 72 bytes for bcrypt)
    with pytest.raises(ValueError, match="maximum length of 72 bytes"):
        hash_password("a" * 73)


def test_create_and_decode_access_token():
    """Verify JWT access token issuance, signing, and payload decoding."""
    subject = "11111111-2222-3333-4444-555555555555"
    email = "candidate@example.com"

    token = create_access_token(subject=subject, email=email)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload["sub"] == subject
    assert payload["email"] == email
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_expired_token_raises_exception():
    """Verify that expired tokens are strictly rejected by the decoder."""
    subject = "11111111-2222-3333-4444-555555555555"
    email = "candidate@example.com"

    expired_token = create_access_token(
        subject=subject,
        email=email,
        expires_delta=datetime.timedelta(seconds=-1),
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(expired_token)


def test_tampered_token_raises_exception():
    """Verify that altered or forged tokens are rejected."""
    token = create_access_token(
        subject="11111111-2222-3333-4444-555555555555",
        email="candidate@example.com",
    )
    tampered_token = token[:-4] + "fake"

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(tampered_token)

