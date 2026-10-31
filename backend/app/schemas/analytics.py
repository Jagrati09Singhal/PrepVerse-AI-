from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class RecentSessionActivity(BaseModel):
    session_id: UUID
    role_title: Optional[str] = None
    status: str
    interview_mode: str
    practice_mode: str
    question_count: int
    answered_count: int
    overall_score: Optional[float] = None
    content_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AnalyticsSpeechSummary(BaseModel):
    voice_answers_count: int = 0
    average_pace_wpm: Optional[float] = None
    pace_assessment: str = "Unavailable"
    average_filler_rate_percentage: Optional[float] = None
    total_filler_count: int = 0
    eligible_duration_answers: int = 0
    disclaimer: str = "Pacing calculated strictly when verified audio duration is >= 5.0s."


class AnalyticsOverview(BaseModel):
    total_sessions: int
    completed_sessions: int
    in_progress_sessions: int
    abandoned_sessions: int
    total_evaluated_answers: int
    average_overall_score: Optional[float] = None
    average_content_score: Optional[float] = None
    average_communication_score: Optional[float] = None
    speech_summary: AnalyticsSpeechSummary
    recent_activity: List[RecentSessionActivity] = []
    has_history: bool = False
    empty_history_message: Optional[str] = None


class TrendPoint(BaseModel):
    session_id: UUID
    date: datetime
    role_title: Optional[str] = None
    overall_score: Optional[float] = None
    content_score: Optional[float] = None
    communication_score: Optional[float] = None
    interview_mode: str = "text"
    practice_mode: str = "mock_interview"


class RolePerformance(BaseModel):
    role_title: str
    session_count: int
    average_overall_score: Optional[float] = None
    average_content_score: Optional[float] = None


class CategoryPerformance(BaseModel):
    category: str
    evaluated_count: int
    average_content_score: Optional[float] = None
    average_communication_score: Optional[float] = None


class AnalyticsTrends(BaseModel):
    timeline: List[TrendPoint] = []
    performance_by_role: List[RolePerformance] = []
    performance_by_category: List[CategoryPerformance] = []
    trajectory: str = "insufficient_data"  # "insufficient_data", "improving", "steady", "declining"
    trajectory_message: str


class SkillPerformanceItem(BaseModel):
    skill: str
    evaluated_count: int
    average_score: float
    min_score: float
    max_score: float
    category: str  # "strong", "developing", "weak", "insufficient_evidence"
    last_practiced: Optional[datetime] = None


class AnalyticsSkills(BaseModel):
    strong_skills: List[SkillPerformanceItem] = []
    developing_skills: List[SkillPerformanceItem] = []
    weak_skills: List[SkillPerformanceItem] = []
    insufficient_evidence_skills: List[SkillPerformanceItem] = []
    technical_average_score: Optional[float] = None
    behavioral_average_score: Optional[float] = None
    situational_average_score: Optional[float] = None
    total_skills_evaluated: int = 0


class PracticeRecommendation(BaseModel):
    topic: str
    priority: str  # "high", "medium", "low"
    recommended_mode: str  # "weak_area", "focused_technical", "quick_practice", "mock_interview"
    suggested_difficulty: str  # "easy", "medium", "hard"
    reason: str
    source: str  # "historical_weakness", "job_gap", "resume_core", "readiness_test"


class AnalyticsRecommendations(BaseModel):
    recommendations: List[PracticeRecommendation] = []
    based_on_sessions_count: int = 0
    message: str

