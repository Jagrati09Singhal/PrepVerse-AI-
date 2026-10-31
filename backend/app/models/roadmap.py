import uuid
from sqlalchemy import Column, String, Integer, Text, Date, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class PreparationPlan(Base):
    __tablename__ = "preparation_plans"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    target_role = Column(String(255), nullable=True)
    target_interview_date = Column(Date, nullable=True)
    daily_prep_minutes = Column(Integer, default=30, nullable=False)
    academic_year = Column(String(50), nullable=True, default="3rd_year")
    branch = Column(String(100), nullable=True)
    ongoing_subjects = Column(Text, nullable=True)
    core_interests = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="preparation_plan")
    tasks = relationship(
        "RoadmapTask",
        back_populates="plan",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="RoadmapTask.order_index",
    )

    def __repr__(self) -> str:
        return f"<PreparationPlan id={self.id} user_id={self.user_id} role={self.target_role}>"


class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Uuid, ForeignKey("preparation_plans.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False, default="technical")
    priority = Column(String(20), nullable=False, default="medium")
    status = Column(String(20), nullable=False, default="not_started")
    source = Column(String(50), nullable=False, default="recommended")
    reason = Column(Text, nullable=True)
    estimated_minutes = Column(Integer, default=30, nullable=False)
    recommended_mode = Column(String(50), nullable=True)
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="roadmap_tasks")
    plan = relationship("PreparationPlan", back_populates="tasks")

    def __repr__(self) -> str:
        return f"<RoadmapTask id={self.id} title={self.title} status={self.status}>"

