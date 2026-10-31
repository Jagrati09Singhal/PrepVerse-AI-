import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resume import Resume
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.schemas.interview import InterviewCreate
from app.api.interviews import create_interview_session, list_interview_sessions


@pytest.fixture
def user_a(db_session: Session) -> User:
    u = User(name="User Alpha", email="alpha_practice@example.com", password_hash="hash_a")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def test_quick_practice_mode_sets_short_session(db_session: Session, user_a: User):
    """Test Quick Practice creates a rapid session with 3 questions."""
    resume = Resume(
        user_id=user_a.id,
        filename="engineer.pdf",
        raw_text="Experienced engineer with Python, Django, PostgreSQL, Docker.",
        parsed_skills=["Python", "Django", "PostgreSQL", "Docker"],
    )
    db_session.add(resume)
    db_session.commit()

    payload = InterviewCreate(
        resume_id=resume.id,
        job_description="We are looking for a backend engineer with Python experience.",
        role_title="Backend Developer",
        practice_mode="quick_practice",
        question_count=5,  # Default 5 should be clamped to 3 for quick practice
    )

    session_detail = create_interview_session(payload=payload, current_user=user_a, db=db_session)
    assert session_detail.practice_mode == "quick_practice"
    assert session_detail.question_count == 3
    assert len(session_detail.questions) == 3


def test_focused_technical_practice_mode(db_session: Session, user_a: User):
    """Test Focused Technical practice restricts question types to technical and targets focus skill."""
    resume = Resume(
        user_id=user_a.id,
        filename="engineer.pdf",
        raw_text="Experienced engineer with Python, Django, PostgreSQL, Docker.",
        parsed_skills=["Python", "PostgreSQL", "Docker"],
    )
    db_session.add(resume)
    db_session.commit()

    payload = InterviewCreate(
        resume_id=resume.id,
        job_description="We are seeking a PostgreSQL database tuning expert.",
        role_title="Database Engineer",
        practice_mode="focused_technical",
        target_focus="PostgreSQL",
        question_count=3,
        question_types=[QuestionType.BEHAVIORAL],  # Even if requested behavioral, mode should enforce technical
    )

    session_detail = create_interview_session(payload=payload, current_user=user_a, db=db_session)
    assert session_detail.practice_mode == "focused_technical"
    assert session_detail.target_focus == "PostgreSQL"
    # All questions must be technical
    for q in session_detail.questions:
        assert q.type == QuestionType.TECHNICAL


def test_weak_area_practice_targets_historical_low_scores(db_session: Session, user_a: User):
    """Test Weak Area practice detects and prioritizes historical low-scoring skills."""
    resume = Resume(
        user_id=user_a.id,
        filename="engineer.pdf",
        raw_text="Experienced engineer with Python, Django, PostgreSQL, Kubernetes.",
        parsed_skills=["Python", "Django", "PostgreSQL", "Kubernetes"],
    )
    # Past session where candidate scored poorly on Kubernetes (42%)
    s_past = InterviewSession(
        user_id=user_a.id,
        role_title="DevOps Engineer",
        job_description="Kubernetes cluster operator.",
        status=SessionStatus.COMPLETED,
        question_count=1,
    )
    db_session.add_all([resume, s_past])
    db_session.flush()

    q_past = Question(
        session_id=s_past.id,
        question_text="How do you handle Kubernetes ingress routing?",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
        target_skill="Kubernetes",
    )
    test_db_q = q_past
    db_session.add(test_db_q)
    db_session.flush()

    a_past = Answer(
        question_id=test_db_q.id,
        answer_text="I am not very sure about ingress controllers.",
        content_score=42.0,
        evaluation_status="completed",
    )
    db_session.add(a_past)
    db_session.commit()

    # Launch Weak Area Practice session without explicit target focus
    payload = InterviewCreate(
        resume_id=resume.id,
        job_description="General software engineering role with container orchestration.",
        role_title="Software Engineer",
        practice_mode="weak_area",
        question_count=3,
    )

    session_detail = create_interview_session(payload=payload, current_user=user_a, db=db_session)
    assert session_detail.practice_mode == "weak_area"
    # Target focus should automatically resolve to the low-scoring skill "Kubernetes"
    assert session_detail.target_focus == "Kubernetes"


def test_practice_mode_and_target_focus_persisted_in_list(db_session: Session, user_a: User):
    """Test practice_mode and target_focus are correctly returned in list and detail endpoints."""
    resume = Resume(
        user_id=user_a.id,
        filename="engineer.pdf",
        raw_text="Experienced Python engineer.",
        parsed_skills=["Python"],
    )
    db_session.add(resume)
    db_session.commit()

    payload = InterviewCreate(
        resume_id=resume.id,
        job_description="We need a Python specialist.",
        role_title="Python Engineer",
        practice_mode="focused_technical",
        target_focus="Python Metaclasses",
        question_count=2,
    )

    created = create_interview_session(payload=payload, current_user=user_a, db=db_session)

    # Check list endpoint
    items = list_interview_sessions(current_user=user_a, db=db_session)
    matching = next((item for item in items if item.id == created.id), None)
    assert matching is not None
    assert matching.practice_mode == "focused_technical"
    assert matching.target_focus == "Python Metaclasses"
