from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserResponse


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Candidate full name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=8, max_length=72, description="Password (8-72 characters)")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name cannot be empty or purely whitespace")
        return stripped

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=1, description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

