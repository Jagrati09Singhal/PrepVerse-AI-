import datetime
from typing import Optional, Union, Any, Dict
from uuid import UUID
import bcrypt
import jwt
from app.core.config import settings

# Bcrypt has an architectural maximum input length of 72 bytes
MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 8


def hash_password(plain_password: str) -> str:
    """
    Hashes a plain text password using bcrypt with configured salt rounds.
    Never logs or persists the plain password.
    """
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Password exceeds maximum length of {MAX_PASSWORD_BYTES} bytes")
    if len(plain_password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")

    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored bcrypt hash.
    Returns False safely without throwing exceptions on malformed hashes.
    """
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(
    subject: Union[str, UUID],
    email: str,
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """
    Creates a signed cryptographically secure JWT access token with an expiration timestamp.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT access token.
    Raises jwt.ExpiredSignatureError if expired, or jwt.InvalidTokenError if malformed/tampered.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["exp", "sub", "iat"]},
    )

