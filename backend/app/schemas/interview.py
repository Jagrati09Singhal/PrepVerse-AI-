from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty


class InterviewCreate(BaseModel):
    resume_id: UUID
    job_analysis_id: Optional[UUID] = None
    job_description: Optional[str] = None
    job_description_raw: Optional[str] = None
    role_title: Optional[str] = None
    question_count: int = Field(default=5, ge=1, le=50, description="Flexible question count without arbitrary fixed caps")
    question_types: Optional[List[QuestionType]] = None
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
    interview_mode: str = "text"  # "text" or "voice"
    is_adaptive: bool = True
    practice_mode: str = "mock_interview"  # "mock_interview", "quick_practice", "weak_area", "focused_technical", "skill_assessment"
    target_focus: Optional[str] = None
    student_level: Optional[str] = None  # "1st_2nd_year", "3rd_4th_year", "fresh_grad"


class QuestionOut(BaseModel):
    id: UUID
    session_id: UUID
    question_text: str
    type: QuestionType
    difficulty: QuestionDifficulty
    order_index: int
    target_skill: Optional[str] = None
    adaptation_reason: Optional[str] = None
    format: Optional[str] = "open_ended"
    options: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


class AnswerSubmit(BaseModel):
    question_id: UUID
    answer_text: str = Field(..., min_length=1, max_length=5000)
    audio_duration_seconds: Optional[float] = None
    pause_data: Optional[Dict[str, Any]] = None


class AnswerEvaluationOut(BaseModel):
    id: UUID
    question_id: UUID
    answer_text: str
    evaluation_status: str = "completed"
    content_score: Optional[float] = None
    communication_score: Optional[float] = None
    feedback_text: Optional[str] = None
    star_component_scores: Optional[Dict[str, Any]] = None
    evaluation_details: Optional[Dict[str, Any]] = None
    audio_duration_seconds: Optional[float] = None
    speech_analytics: Optional[Dict[str, Any]] = None
    created_at: datetime
    evaluated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AudioTranscribeResponse(BaseModel):
    status: str
    transcript: str
    provider: str
    duration_seconds: Optional[float] = None
    message: Optional[str] = None


class InterviewSessionListItem(BaseModel):
    id: UUID
    resume_id: Optional[UUID] = None
    job_analysis_id: Optional[UUID] = None
    role_title: Optional[str] = None
    status: SessionStatus
    question_count: int
    answered_count: int
    overall_score: Optional[float] = None
    communication_score: Optional[float] = None
    interview_mode: str = "text"
    is_adaptive: bool = True
    practice_mode: str = "mock_interview"
    target_focus: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InterviewSessionDetail(BaseModel):
    id: UUID
    user_id: UUID
    resume_id: Optional[UUID] = None
    job_analysis_id: Optional[UUID] = None
    role_title: Optional[str] = None
    job_description: str
    status: SessionStatus
    question_count: int
    difficulty: Optional[QuestionDifficulty] = None
    question_types: Optional[List[str]] = None
    interview_mode: str = "text"
    is_adaptive: bool = True
    practice_mode: str = "mock_interview"
    target_focus: Optional[str] = None
    overall_score: Optional[float] = None
    communication_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    questions: List[QuestionOut] = []
    answers: List[AnswerEvaluationOut] = []
    current_question_index: int = 0
    is_complete: bool = False

    model_config = ConfigDict(from_attributes=True)


class InterviewReport(BaseModel):
    session_id: UUID
    role_title: Optional[str] = None
    status: SessionStatus
    interview_mode: str = "text"
    is_adaptive: bool = True
    practice_mode: str = "mock_interview"
    target_focus: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    total_questions: int
    completed_questions: int
    evaluated_count: int
    pending_count: int
    failed_count: int
    average_content_score: Optional[float] = None
    average_communication_score: Optional[float] = None
    overall_score: Optional[float] = None
    star_breakdown: Optional[Dict[str, float]] = None
    speech_analytics_summary: Optional[Dict[str, Any]] = None
    difficulty_progression: List[Dict[str, Any]] = []
    strongest_areas: List[str] = []
    improvement_areas: List[str] = []
    verified_skills: List[str] = []
    weak_skills_detected: List[str] = []
    student_tier: Optional[str] = None
    actionable_recommendations: List[str] = []
    questions_feedback: List[Dict[str, Any]] = []
    scoring_methodology: str
    disclaimer: str

    model_config = ConfigDict(from_attributes=True)
