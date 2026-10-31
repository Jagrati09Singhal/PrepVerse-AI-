import datetime
import uuid
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class JobAnalysisCreateRequest(BaseModel):
    """Payload to initiate a job description matching analysis against an owned resume."""
    resume_id: uuid.UUID = Field(..., description="ID of the candidate's uploaded resume to analyze against")
    job_description_raw: Optional[str] = Field(
        default=None,
        max_length=50000,
        description="Full text or keywords of the target job description",
    )
    job_description: Optional[str] = Field(
        default=None,
        max_length=50000,
        description="Flexible alias for job_description_raw",
    )
    role_title: Optional[str] = Field(None, max_length=150, description="Optional target job title")
    company_name: Optional[str] = Field(None, max_length=150, description="Optional hiring company name")
    experience_level: Optional[str] = Field(None, max_length=50, description="Optional experience tier (e.g. Senior)")


class JobAnalysisListItem(BaseModel):
    """Compact summary of a past analysis for historical listing."""
    id: uuid.UUID
    resume_id: uuid.UUID
    role_title: Optional[str] = None
    company_name: Optional[str] = None
    overall_coverage_pct: float
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class JobAnalysisResponse(BaseModel):
    """Full detail of a job description analysis, requirements, and skill-gap matching."""
    id: uuid.UUID
    user_id: uuid.UUID
    resume_id: uuid.UUID
    role_title: Optional[str] = None
    company_name: Optional[str] = None
    experience_level: Optional[str] = None
    job_description_raw: str
    extracted_requirements: Dict[str, Any]
    match_results: Dict[str, Any]
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

