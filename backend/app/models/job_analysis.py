import uuid
from sqlalchemy import Column, ForeignKey, Text, String, DateTime, func, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base_types import JSON_TYPE


class JobAnalysis(Base):
    __tablename__ = "job_analyses"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_id = Column(
        Uuid,
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_title = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    experience_level = Column(String(50), nullable=True)
    job_description_raw = Column(Text, nullable=False)
    extracted_requirements = Column(JSON_TYPE, nullable=False)
    match_results = Column(JSON_TYPE, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="job_analyses")
    resume = relationship("Resume", back_populates="job_analyses")
    sessions = relationship("Session", back_populates="job_analysis")

    def __repr__(self) -> str:
        return f"<JobAnalysis id={self.id} user_id={self.user_id} role={self.role_title}>"

