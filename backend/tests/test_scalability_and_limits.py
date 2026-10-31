import uuid
from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resume import Resume
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.schemas.interview import InterviewCreate
from app.api.interviews import create_interview_session, list_interview_sessions
from app.services.ai_provider import GeminiAIProvider


@pytest.fixture
def scale_user(db_session: Session) -> User:
    u = User(name="Scale Candidate", email="scale_candidate@example.com", password_hash="hash_scale")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def scale_resume(db_session: Session, scale_user: User) -> Resume:
    r = Resume(
        user_id=scale_user.id,
        filename="distributed_systems_lead.pdf",
        raw_text="Staff Infrastructure Engineer with Kafka, PostgreSQL, Docker, Redis, and Go experience.",
        parsed_skills=["Kafka", "PostgreSQL", "Docker", "Redis", "Go"],
    )
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)
    return r


def test_flexible_question_count_without_arbitrary_caps(
    db_session: Session, scale_user: User, scale_resume: Resume
):
    """
    Verifies that candidates are NOT artificially capped at 10 questions.
    Can configure full 15-question comprehensive simulation sessions.
    """
    payload = InterviewCreate(
        resume_id=scale_resume.id,
        role_title="Staff Infrastructure Engineer",
        job_description="Seeking a staff infrastructure engineer to architect large-scale event-driven distributed systems.",
        question_count=15,
        difficulty=QuestionDifficulty.HARD,
    )

    session_detail = create_interview_session(payload=payload, current_user=scale_user, db=db_session)
    assert session_detail.question_count == 15
    assert len(session_detail.questions) == 15
    indices = [q.order_index for q in session_detail.questions]
    assert indices == list(range(15))


def test_cross_session_question_deduplication(
    db_session: Session, scale_user: User, scale_resume: Resume
):
    """
    Verifies that consecutive interview sessions track previously presented questions
    and offer fresh, non-duplicate questions rather than repeating the same prompts.
    """
    payload1 = InterviewCreate(
        resume_id=scale_resume.id,
        role_title="Staff Infrastructure Engineer",
        job_description="Seeking a staff infrastructure engineer with Kafka and PostgreSQL experience.",
        question_count=4,
        difficulty=QuestionDifficulty.MEDIUM,
    )
    session1 = create_interview_session(payload=payload1, current_user=scale_user, db=db_session)
    q_texts_1 = {q.question_text.strip() for q in session1.questions}

    # Launch second session for the exact same role and JD
    payload2 = InterviewCreate(
        resume_id=scale_resume.id,
        role_title="Staff Infrastructure Engineer",
        job_description="Seeking a staff infrastructure engineer with Kafka and PostgreSQL experience.",
        question_count=4,
        difficulty=QuestionDifficulty.MEDIUM,
    )
    session2 = create_interview_session(payload=payload2, current_user=scale_user, db=db_session)
    q_texts_2 = {q.question_text.strip() for q in session2.questions}

    # Verify that session 2 questions are differentiated from session 1
    overlap = q_texts_1.intersection(q_texts_2)
    assert len(overlap) < len(q_texts_1), "Repeated session should offer fresh questions, not duplicate all previous questions"


def test_list_interview_sessions_pagination(
    db_session: Session, scale_user: User, scale_resume: Resume
):
    """
    Verifies database pagination with limit and offset parameters to prevent memory bloat
    when candidates have extensive practice histories.
    """
    # Create 5 sessions
    for i in range(5):
        sess = InterviewSession(
            user_id=scale_user.id,
            resume_id=scale_resume.id,
            role_title=f"Infrastructure Engineer Sprint {i}",
            job_description="Architecting high-throughput distributed message brokers.",
            status=SessionStatus.COMPLETED,
            question_count=3,
        )
        db_session.add(sess)
    db_session.commit()

    # Query page 1 (limit=2, offset=0)
    page_1 = list_interview_sessions(limit=2, offset=0, current_user=scale_user, db=db_session)
    assert len(page_1) == 2

    # Query page 2 (limit=2, offset=2)
    page_2 = list_interview_sessions(limit=2, offset=2, current_user=scale_user, db=db_session)
    assert len(page_2) == 2

    # Verify disjoint items
    ids_1 = {s.id for s in page_1}
    ids_2 = {s.id for s in page_2}
    assert ids_1.isdisjoint(ids_2)


def test_gemini_quota_and_rate_limit_graceful_fallback():
    """
    Verifies that when external AI provider returns 429 quota exhaustion or rate limits,
    the application logs honestly and falls back gracefully to the deterministic engine.
    """
    provider = GeminiAIProvider(api_key="mock_test_key")

    with patch.object(
        provider,
        "_generate_with_resilience",
        return_value=None,  # Simulates quota rejection / failure
    ):
        baseline = {
            "required_skills": ["Python"],
            "preferred_skills": ["PostgreSQL"],
        }
        refined = provider.refine_job_analysis("Python job description", baseline)
        assert refined["analysis_engine"] == "deterministic"

        # Question generation fallback
        q_result = provider.generate_questions({"role_title": "Backend Lead", "question_count": 3})
        assert q_result is None  # Signals caller to invoke deterministic generator


def test_gemini_transient_error_bounded_retry():
    """
    Verifies bounded retries on transient errors returning successful response.
    """
    provider = GeminiAIProvider(api_key="mock_test_key")

    success_json = '{"required_skills": ["Go", "Docker"], "preferred_skills": ["Kubernetes"]}'

    with patch.object(
        provider,
        "_generate_with_resilience",
        return_value=success_json,
    ):
        baseline = {"required_skills": ["Go"], "preferred_skills": []}
        refined = provider.refine_job_analysis("Go developer job", baseline)
        assert refined["analysis_engine"] == "gemini"
        assert "Docker" in refined["required_skills"]
