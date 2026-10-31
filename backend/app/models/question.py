import uuid
from sqlalchemy import Column, ForeignKey, Text, String, Integer, Uuid, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import QuestionType, QuestionDifficulty


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        UniqueConstraint("session_id", "order_index", name="uq_session_question_order"),
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(
        Uuid,
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_text = Column(Text, nullable=False)
    type = Column(
        SAEnum(QuestionType, native_enum=False, length=50),
        nullable=False,
    )
    difficulty = Column(
        SAEnum(QuestionDifficulty, native_enum=False, length=50),
        nullable=False,
    )
    order_index = Column(Integer, nullable=False, default=0)
    rubric_criteria = Column(Text, nullable=True)
    target_skill = Column(String(100), nullable=True)
    adaptation_reason = Column(Text, nullable=True)

    # Relationships
    session = relationship("Session", back_populates="questions")
    answers = relationship(
        "Answer",
        back_populates="question",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Question id={self.id} session_id={self.session_id} type={self.type}>"

