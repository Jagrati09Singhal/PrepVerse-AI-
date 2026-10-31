import datetime
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    """
    Public profile representation of a User.
    Explicitly excludes sensitive fields such as password_hash.
    """
    id: uuid.UUID
    name: str
    email: EmailStr
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

