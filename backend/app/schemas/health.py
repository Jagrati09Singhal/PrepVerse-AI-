from typing import Optional
from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str
    database: str
    version: str = "0.1.0"
    environment: str
    error: Optional[str] = None

