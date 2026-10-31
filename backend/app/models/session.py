import uuid
from sqlalchemy import Column, ForeignKey, Text, String, Integer, Float, Boolean, DateTime, func, Uuid, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import SessionStatus, QuestionDifficulty
from app.models.base_types import JSON_TYPE


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_id = Column(
        Uuid,
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    job_analysis_id = Column(
        Uuid,
        ForeignKey("job_analyses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    role_title = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=False)
    status = Column(
        SAEnum(SessionStatus, native_enum=False, length=50),
        default=SessionStatus.CREATED,
        nullable=False,
        index=True,
    )
    question_count = Column(Integer, default=5, nullable=False)
    difficulty = Column(
        SAEnum(QuestionDifficulty, native_enum=False, length=50),
        nullable=True,
    )
    question_types = Column(JSON_TYPE, nullable=True)
    interview_mode = Column(String(50), default="text", nullable=False)
    is_adaptive = Column(Boolean, default=True, nullable=False)
    practice_mode = Column(String(50), default="mock_interview", nullable=False)
    target_focus = Column(String(100), nullable=True)
    overall_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    resume = relationship("Resume", back_populates="sessions")
    job_analysis = relationship("JobAnalysis", back_populates="sessions")
    questions = relationship(
        "Question",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Question.order_index",
    )

    def __repr__(self) -> str:
        return f"<Session id={self.id} user_id={self.user_id} status={self.status}>"

