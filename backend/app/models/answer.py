import uuid
from sqlalchemy import Column, ForeignKey, Text, String, Float, Integer, DateTime, func, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base_types import JSON_TYPE


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    question_id = Column(
        Uuid,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    answer_text = Column(Text, nullable=False)
    audio_url = Column(String(1024), nullable=True)
    content_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    feedback_text = Column(Text, nullable=True)
    filler_word_count = Column(Integer, nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)
    speech_analytics = Column(JSON_TYPE, nullable=True)
    star_component_scores = Column(JSON_TYPE, nullable=True)
    evaluation_status = Column(String(50), default="completed", nullable=False)
    evaluation_details = Column(JSON_TYPE, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    question = relationship("Question", back_populates="answers")

    def __repr__(self) -> str:
        return f"<Answer id={self.id} question_id={self.question_id} status={self.evaluation_status}>"

