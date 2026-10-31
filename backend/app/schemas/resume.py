import datetime
import uuid
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class ResumeListItem(BaseModel):
    """Compact summary of a resume for dashboard lists."""
    id: uuid.UUID
    filename: Optional[str] = "Untitled Resume.pdf"
    file_size_bytes: Optional[int] = 0
    parsing_status: str
    error_message: Optional[str] = None
    total_skills: int = 0
    uploaded_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeResponse(BaseModel):
    """Full detail of a candidate's resume, including structured extraction."""
    id: uuid.UUID
    user_id: uuid.UUID
    filename: Optional[str] = "Untitled Resume.pdf"
    file_size_bytes: Optional[int] = 0
    parsing_status: str
    error_message: Optional[str] = None
    parsed_skills: Optional[Dict[str, Any]] = None
    structured_data: Optional[Dict[str, Any]] = None
    raw_text: str
    uploaded_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

