from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class PreparationPlanBase(BaseModel):
    target_role: Optional[str] = Field(None, max_length=255, description="Target career role or job title")
    target_interview_date: Optional[date] = Field(None, description="Upcoming target interview date")
    daily_prep_minutes: int = Field(30, ge=5, le=480, description="Daily preparation target in minutes")
    academic_year: Optional[str] = Field(None, max_length=50, description="College academic year (e.g. 1st_year, 2nd_year, 3rd_year, 4th_year, graduate)")
    branch: Optional[str] = Field(None, max_length=100, description="College branch / discipline (e.g. CSE, IT, AI/DS)")
    ongoing_subjects: Optional[str] = Field(None, description="Comma-separated or JSON list of subjects currently studying this semester")
    core_interests: Optional[str] = Field(None, description="Comma-separated or JSON list of primary tech interests / target specializations")


class PreparationPlanUpdate(BaseModel):
    target_role: Optional[str] = Field(None, max_length=255)
    target_interview_date: Optional[date] = None
    daily_prep_minutes: Optional[int] = Field(None, ge=5, le=480)
    academic_year: Optional[str] = Field(None, max_length=50)
    branch: Optional[str] = Field(None, max_length=100)
    ongoing_subjects: Optional[str] = None
    core_interests: Optional[str] = None

    @field_validator("target_interview_date")
    @classmethod
    def validate_future_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("Target interview date cannot be in the past.")
        return v


class PreparationPlanOut(PreparationPlanBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class RoadmapTaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Actionable title of preparation task")
    description: Optional[str] = Field(None, description="Detailed instructions or study objectives")
    topic: Optional[str] = Field(None, max_length=100, description="Skill or competency topic")
    category: str = Field("technical", description="technical, behavioral, situational, foundational, review")
    priority: str = Field("medium", description="high, medium, low")
    source: str = Field("recommended", description="skill_gap, weak_area, developing_skill, custom, recommended")
    reason: Optional[str] = Field(None, description="Evidence-backed rationale for this recommendation")
    estimated_minutes: int = Field(30, ge=5, le=480, description="Estimated effort in minutes")
    recommended_mode: Optional[str] = Field("mock_interview", description="Suggested practice simulation mode")
    due_date: Optional[date] = None


class RoadmapTaskCreate(RoadmapTaskBase):
    pass


class RoadmapTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    topic: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = Field(None, description="not_started, in_progress, completed")
    reason: Optional[str] = None
    estimated_minutes: Optional[int] = Field(None, ge=5, le=480)
    recommended_mode: Optional[str] = None
    due_date: Optional[date] = None
    order_index: Optional[int] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("not_started", "in_progress", "completed"):
            raise ValueError("Status must be one of: not_started, in_progress, completed")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("high", "medium", "low"):
            raise ValueError("Priority must be one of: high, medium, low")
        return v


class RoadmapTaskOut(RoadmapTaskBase):
    id: UUID
    user_id: UUID
    plan_id: Optional[UUID] = None
    status: str
    completed_at: Optional[datetime] = None
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class RoadmapMetricsOut(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    not_started_tasks: int
    progress_percentage: float = Field(0.0, description="Percentage of tasks completed")
    total_estimated_minutes: int
    completed_minutes: int
    days_remaining: Optional[int] = Field(None, description="Days until target interview date")
    is_overdue: bool = Field(False, description="Whether target interview date or any open task is past due")
    estimated_days_to_complete: Optional[int] = Field(None, description="Days required at daily prep goal pace")


class EvidenceSummaryOut(BaseModel):
    target_role: Optional[str] = None
    confirmed_strengths: List[str] = []
    developing_skills: List[str] = []
    priority_weak_areas: List[str] = []
    missing_gap_skills: List[str] = []
    total_evaluations: int = 0
    has_evidence: bool = False


class RoadmapOverviewOut(BaseModel):
    plan: Optional[PreparationPlanOut] = None
    tasks: List[RoadmapTaskOut] = []
    metrics: RoadmapMetricsOut
    evidence_summary: EvidenceSummaryOut

