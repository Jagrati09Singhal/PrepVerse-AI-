import uuid
from datetime import date, timedelta, datetime, timezone
import pytest
from pydantic import ValidationError
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resume import Resume
from app.models.roadmap import PreparationPlan, RoadmapTask
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.job_analysis import JobAnalysis
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.schemas.roadmap import (
    PreparationPlanUpdate,
    RoadmapTaskCreate,
    RoadmapTaskUpdate,
)
from app.api.roadmap import (
    get_user_roadmap,
    refresh_roadmap_recommendations,
    update_preparation_plan,
    create_custom_preparation_task,
    update_roadmap_task,
    delete_roadmap_task,
)


@pytest.fixture
def plan_user_a(db_session: Session) -> User:
    u = User(name="Roadmap User Alpha", email="alpha_roadmap@example.com", password_hash="hash_alpha")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def plan_user_b(db_session: Session) -> User:
    u = User(name="Roadmap User Beta", email="beta_roadmap@example.com", password_hash="hash_beta")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def test_get_roadmap_overview_creates_defaults(db_session: Session, plan_user_a: User):
    """Test getting roadmap overview for new user creates default plan and foundational tasks."""
    res = get_user_roadmap(current_user=plan_user_a, db=db_session)

    assert res.plan is not None
    assert res.plan.user_id == plan_user_a.id
    assert res.plan.daily_prep_minutes == 30
    assert len(res.tasks) >= 3
    assert res.metrics.total_tasks == len(res.tasks)
    assert res.metrics.completed_tasks == 0
    assert res.metrics.progress_percentage == 0.0


def test_update_plan_valid_and_future_date(db_session: Session, plan_user_a: User):
    """Test updating preparation plan with a valid future date and prep goal."""
    target_date = date.today() + timedelta(days=14)
    payload = PreparationPlanUpdate(
        target_role="Principal Distributed Systems Architect",
        target_interview_date=target_date,
        daily_prep_minutes=45,
    )

    updated = update_preparation_plan(payload=payload, current_user=plan_user_a, db=db_session)
    assert updated.target_role == "Principal Distributed Systems Architect"
    assert updated.target_interview_date == target_date
    assert updated.daily_prep_minutes == 45


def test_update_plan_rejects_past_date():
    """Test that setting a target interview date in the past raises validation error."""
    past_date = date.today() - timedelta(days=2)
    with pytest.raises(ValidationError) as exc_info:
        PreparationPlanUpdate(target_interview_date=past_date)
    assert "cannot be in the past" in str(exc_info.value)


def test_update_plan_rejects_invalid_daily_minutes():
    """Test that negative or excessive daily prep minutes are rejected."""
    with pytest.raises(ValidationError):
        PreparationPlanUpdate(daily_prep_minutes=0)

    with pytest.raises(ValidationError):
        PreparationPlanUpdate(daily_prep_minutes=500)


def test_roadmap_generation_from_evidence(db_session: Session, plan_user_a: User):
    """
    Test roadmap generation correctly prioritizes:
    - Recurring weak areas (< 60%, >= 2 questions) -> high priority
    - Developing skills (60-79.9%, >= 2 questions) -> medium priority
    - Confirmed strengths (>= 80%, >= 2 questions) -> low priority
    - Missing skills from JobAnalysis -> high priority
    """
    # 1. Create completed session with evaluated answers
    sess = InterviewSession(
        user_id=plan_user_a.id,
        role_title="Senior Python Backend Developer",
        job_description="Senior Python developer job description requiring Kubernetes and distributed systems.",
        status=SessionStatus.COMPLETED,
        question_count=6,
        overall_score=68.0,
    )
    db_session.add(sess)
    db_session.commit()
    db_session.refresh(sess)

    # Weak skill: PostgreSQL (2 questions, scores 50, 52)
    for i, s_score in enumerate([50.0, 52.0]):
        q = Question(session_id=sess.id, question_text=f"Postgres Q{i}", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, target_skill="PostgreSQL", order_index=i)
        db_session.add(q)
        db_session.commit()
        db_session.refresh(q)
        ans = Answer(question_id=q.id, answer_text=f"Postgres answer {i}", content_score=s_score, evaluation_status="completed")
        db_session.add(ans)

    # Developing skill: Docker (2 questions, scores 65, 70)
    for i, s_score in enumerate([65.0, 70.0]):
        q = Question(session_id=sess.id, question_text=f"Docker Q{i}", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, target_skill="Docker", order_index=2 + i)
        db_session.add(q)
        db_session.commit()
        db_session.refresh(q)
        ans = Answer(question_id=q.id, answer_text=f"Docker answer {i}", content_score=s_score, evaluation_status="completed")
        db_session.add(ans)

    # Strong skill: Python (2 questions, scores 88, 92)
    for i, s_score in enumerate([88.0, 92.0]):
        q = Question(session_id=sess.id, question_text=f"Python Q{i}", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, target_skill="Python", order_index=4 + i)
        db_session.add(q)
        db_session.commit()
        db_session.refresh(q)
        ans = Answer(question_id=q.id, answer_text=f"Python answer {i}", content_score=s_score, evaluation_status="completed")
        db_session.add(ans)

    # 2. Add Resume and JobAnalysis with missing skill gap
    resume = Resume(
        user_id=plan_user_a.id,
        filename="resume.pdf",
        raw_text="Experienced developer with Python",
        parsed_skills=["Python"],
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    ja = JobAnalysis(
        user_id=plan_user_a.id,
        resume_id=resume.id,
        role_title="Senior Python Backend Developer",
        job_description_raw="Must have Kubernetes and Python expertise.",
        extracted_requirements={"required_skills": ["Kubernetes", "Python"], "preferred_skills": []},
        match_results={"missing_skills": ["Kubernetes"], "matching_skills": ["Python"]},
    )
    db_session.add(ja)
    db_session.commit()

    # Generate roadmap
    overview = refresh_roadmap_recommendations(current_user=plan_user_a, db=db_session)

    # Check evidence summary
    assert "PostgreSQL" in overview.evidence_summary.priority_weak_areas
    assert "Docker" in overview.evidence_summary.developing_skills
    assert "Python" in overview.evidence_summary.confirmed_strengths
    assert "Kubernetes" in overview.evidence_summary.missing_gap_skills

    # Check that high priority tasks exist for PostgreSQL and Kubernetes
    titles_and_priorities = [(t.topic, t.priority, t.source) for t in overview.tasks]
    assert any(t[0] == "PostgreSQL" and t[1] == "high" for t in titles_and_priorities)
    assert any(t[0] == "Kubernetes" and t[1] == "high" for t in titles_and_priorities)
    assert any(t[0] == "Docker" and t[1] == "medium" for t in titles_and_priorities)


def test_roadmap_refresh_preserves_completed_and_custom_tasks(db_session: Session, plan_user_a: User):
    """
    CRITICAL USER EXPERIENCE REQUIREMENT:
    Refreshing the roadmap must NEVER delete completed tasks or custom user tasks.
    """
    # 1. Create a custom task
    custom_task_payload = RoadmapTaskCreate(
        title="LeetCode Top 50 Graph Problems",
        topic="Algorithms",
        category="technical",
        priority="high",
        estimated_minutes=60,
    )
    custom_task = create_custom_preparation_task(payload=custom_task_payload, current_user=plan_user_a, db=db_session)

    # 2. Complete one existing task
    overview = get_user_roadmap(current_user=plan_user_a, db=db_session)
    first_task = overview.tasks[0]
    update_roadmap_task(
        task_id=first_task.id,
        payload=RoadmapTaskUpdate(status="completed"),
        current_user=plan_user_a,
        db=db_session,
    )

    # 3. Trigger refresh
    refreshed_overview = refresh_roadmap_recommendations(current_user=plan_user_a, db=db_session)

    # Verify custom task is preserved
    preserved_ids = {t.id for t in refreshed_overview.tasks}
    assert custom_task.id in preserved_ids
    assert first_task.id in preserved_ids

    completed_task = next(t for t in refreshed_overview.tasks if t.id == first_task.id)
    assert completed_task.status == "completed"
    assert completed_task.completed_at is not None


def test_task_status_toggle_and_completed_at(db_session: Session, plan_user_a: User):
    """Test marking task as completed sets completed_at, reopening clears it."""
    overview = get_user_roadmap(current_user=plan_user_a, db=db_session)
    task_id = overview.tasks[0].id

    # Mark completed
    t1 = update_roadmap_task(
        task_id=task_id,
        payload=RoadmapTaskUpdate(status="completed"),
        current_user=plan_user_a,
        db=db_session,
    )
    assert t1.status == "completed"
    assert t1.completed_at is not None

    # Reopen to in_progress
    t2 = update_roadmap_task(
        task_id=task_id,
        payload=RoadmapTaskUpdate(status="in_progress"),
        current_user=plan_user_a,
        db=db_session,
    )
    assert t2.status == "in_progress"
    assert t2.completed_at is None


def test_metrics_calculation_math(db_session: Session, plan_user_a: User):
    """Test that progress percentage and estimated days are mathematically exact."""
    overview = get_user_roadmap(current_user=plan_user_a, db=db_session)
    total_count = len(overview.tasks)
    assert total_count >= 2

    # Complete exactly 1 task
    update_roadmap_task(
        task_id=overview.tasks[0].id,
        payload=RoadmapTaskUpdate(status="completed"),
        current_user=plan_user_a,
        db=db_session,
    )

    new_overview = get_user_roadmap(current_user=plan_user_a, db=db_session)
    expected_pct = round((1 / total_count) * 100.0, 1)
    assert new_overview.metrics.completed_tasks == 1
    assert new_overview.metrics.progress_percentage == expected_pct
    assert new_overview.metrics.completed_minutes == overview.tasks[0].estimated_minutes


def test_custom_task_crud_and_isolation(db_session: Session, plan_user_a: User, plan_user_b: User):
    """Test creating, updating, deleting custom tasks, and multi-user isolation."""
    # User A creates a task
    created = create_custom_preparation_task(
        payload=RoadmapTaskCreate(
            title="User A Unique Prep Task",
            category="review",
            priority="high",
            estimated_minutes=25,
        ),
        current_user=plan_user_a,
        db=db_session,
    )
    assert created.title == "User A Unique Prep Task"
    assert created.user_id == plan_user_a.id

    # User B cannot update User A's task (404)
    with pytest.raises(HTTPException) as exc_update:
        update_roadmap_task(
            task_id=created.id,
            payload=RoadmapTaskUpdate(title="Hacked Task"),
            current_user=plan_user_b,
            db=db_session,
        )
    assert exc_update.value.status_code == 404

    # User B cannot delete User A's task (404)
    with pytest.raises(HTTPException) as exc_del:
        delete_roadmap_task(
            task_id=created.id,
            current_user=plan_user_b,
            db=db_session,
        )
    assert exc_del.value.status_code == 404

    # User A deletes their own task (204)
    delete_roadmap_task(task_id=created.id, current_user=plan_user_a, db=db_session)

    # Verify task is deleted
    check_task = db_session.get(RoadmapTask, created.id)
    assert check_task is None
