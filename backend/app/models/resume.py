import uuid
from sqlalchemy import Column, ForeignKey, Text, String, Integer, DateTime, func, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base_types import JSON_TYPE


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    parsing_status = Column(String(50), default="completed", nullable=False)
    error_message = Column(Text, nullable=True)
    parsed_skills = Column(JSON_TYPE, nullable=True)
    structured_data = Column(JSON_TYPE, nullable=True)
    raw_text = Column(Text, nullable=False)
    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="resumes")
    sessions = relationship("Session", back_populates="resume")
    job_analyses = relationship(
        "JobAnalysis",
        back_populates="resume",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Resume id={self.id} user_id={self.user_id} filename={self.filename}>"
