import json
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PrepVerse AI"
    TAGLINE: str = "Prepare Smarter. Practice Deeper. Become Interview-Ready."
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Database Configuration
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/interviewai_dev"

    # Security & JWT Configuration
    JWT_SECRET_KEY: str = "interviewai-dev-secret-key-must-be-changed-in-production-random-64-bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    BCRYPT_ROUNDS: int = 12
    ADMIN_PASSCODE: str = "PrepVerseAdmin2026!"

    # File Upload Configuration (Phase 2)
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 Megabytes default
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]

    # AI Provider Configuration (Phase 2 & Phase 3)
    # Options: "deterministic" (default, local, zero external network dependency), "mock", "gemini"
    AI_PROVIDER: str = "deterministic"
    GEMINI_API_KEY: Optional[str] = None

    # Interview Simulation Configuration (Flexible practice without arbitrary artificial caps)
    DEFAULT_QUESTION_COUNT: int = 5
    MIN_QUESTION_COUNT: int = 1
    MAX_QUESTION_COUNT: int = 50
    MIN_ANSWER_LENGTH: int = 10
    MAX_ANSWER_LENGTH: int = 5000

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
