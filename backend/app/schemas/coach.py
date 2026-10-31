from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class CoachFeedbackRequest(BaseModel):
    user_focus_note: Optional[str] = Field(
        default=None,
        description="Optional candidate focus note or question for the AI coach."
    )


class CoachingFeedbackResponse(BaseModel):
    question_id: UUID
    session_id: UUID
    question_text: str
    question_type: str
    target_skill: Optional[str] = None
    strengths: List[str]
    weaknesses: List[str]
    actionable_improvements: List[str]
    exemplar_answer: str
    contextual_follow_up: str
    engine: str
    disclaimer: str

    model_config = {
        "from_attributes": True
    }

