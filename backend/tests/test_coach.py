import uuid
import pytest
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.schemas.coach import CoachFeedbackRequest
from app.services.coach_service import generate_coaching_feedback
from app.api.interviews import get_coaching_feedback


@pytest.fixture
def coach_user(db_session: Session) -> User:
    u = User(name="Coach Candidate", email="candidate_coach@example.com", password_hash="hash_coach")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def other_user(db_session: Session) -> User:
    u = User(name="Other Candidate", email="other_coach@example.com", password_hash="hash_other")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def test_coach_service_behavioral_exemplar_and_star():
    """Test coaching generation for behavioral question provides STAR exemplar and actionable advice."""
    res = generate_coaching_feedback(
        question_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        question_text="Tell me about a time you resolved a major conflict with a senior engineer on your team.",
        question_type="behavioral",
        difficulty="medium",
        target_skill="Conflict Resolution",
        rubric_criteria="STAR method with clear resolution",
        answer_text="Basically, we had an argument about using Postgres vs Mongo. I explained my points and we eventually chose Postgres.",
        content_score=55.0,
        communication_score=60.0,
        star_component_scores={"situation": 60, "task": 50, "action": 55, "result": 40},
    )

    assert res["engine"] == "deterministic_fallback"
    assert "No external LLM was used" in res["disclaimer"]
    assert len(res["strengths"]) >= 1
    assert len(res["weaknesses"]) >= 1
    assert any("quantifiable" in w.lower() or "metric" in w.lower() for w in res["weaknesses"])
    assert len(res["actionable_improvements"]) >= 2
    assert "STAR" in res["exemplar_answer"]
    assert "**Situation:**" in res["exemplar_answer"]
    assert "**Task:**" in res["exemplar_answer"]
    assert "**Action:**" in res["exemplar_answer"]
    assert "**Result:**" in res["exemplar_answer"]
    assert len(res["contextual_follow_up"]) > 10


def test_coach_service_technical_architecture():
    """Test coaching generation for technical questions provides architecture breakdown and trade-offs."""
    res = generate_coaching_feedback(
        question_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        question_text="How would you design a rate limiter for an API handling 100k requests per second?",
        question_type="technical",
        difficulty="hard",
        target_skill="System Design",
        rubric_criteria="Token bucket / leaky bucket, Redis distributed caching, race condition prevention",
        answer_text="I would use Redis with token bucket algorithm. When a user sends a request, decrement the token.",
        content_score=68.0,
        communication_score=70.0,
    )

    assert res["engine"] == "deterministic_fallback"
    assert len(res["strengths"]) >= 1
    assert any("trade-off" in w.lower() or "tradeoff" in w.lower() or "failure" in w.lower() for w in res["weaknesses"])
    assert "Architecture" in res["exemplar_answer"]
    assert "Trade-offs" in res["exemplar_answer"]
    assert len(res["contextual_follow_up"]) > 10


def test_coach_service_situational():
    """Test coaching generation for situational questions provides triage and communication steps."""
    res = generate_coaching_feedback(
        question_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        question_text="A critical payment API bug is discovered in production during Black Friday traffic. What do you do?",
        question_type="situational",
        difficulty="hard",
        target_skill="Incident Management",
        rubric_criteria="Triage, rollback, communication, post-mortem",
        answer_text="I would revert the commit immediately and notify the Slack channel.",
        content_score=65.0,
        communication_score=65.0,
    )

    assert "Triage" in res["exemplar_answer"]
    assert "Post-Mortem" in res["exemplar_answer"]


def test_coach_service_short_answer_feedback():
    """Test that brief answers receive actionable feedback highlighting brevity and lack of depth."""
    res = generate_coaching_feedback(
        question_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        question_text="Explain database indexing.",
        question_type="technical",
        difficulty="medium",
        target_skill="Databases",
        rubric_criteria="B-trees, lookup efficiency, write overhead",
        answer_text="Indexes make queries faster.",
        content_score=40.0,
        communication_score=45.0,
    )

    assert any("brief" in w.lower() or "depth" in w.lower() for w in res["weaknesses"])


def test_coach_non_mutation_of_answer_and_scores(db_session: Session, coach_user: User):
    """
    CRITICAL RELIABILITY REQUIREMENT:
    Calling the AI coach endpoint MUST NOT mutate answer text or historical scores.
    """
    session = InterviewSession(
        user_id=coach_user.id,
        role_title="Backend Engineer",
        job_description="Backend engineering role focusing on high-throughput microservices and relational databases.",
        status=SessionStatus.IN_PROGRESS,
        question_count=1,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    question = Question(
        session_id=session.id,
        question_text="Explain how database indexes work under the hood.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        target_skill="PostgreSQL",
        order_index=0,
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)

    orig_answer_text = "Indexes use B-trees to speed up SELECT queries by avoiding full table scans."
    orig_content_score = 75.0
    orig_comm_score = 80.0

    answer = Answer(
        question_id=question.id,
        answer_text=orig_answer_text,
        content_score=orig_content_score,
        communication_score=orig_comm_score,
        evaluation_status="completed",
        feedback_text="Good foundational answer with accurate explanation.",
    )
    db_session.add(answer)
    db_session.commit()
    db_session.refresh(answer)

    # Invoke coaching endpoint
    req = CoachFeedbackRequest(user_focus_note="How do I make my explanation more senior?")
    coaching = get_coaching_feedback(
        session_id=session.id,
        question_id=question.id,
        payload=req,
        current_user=coach_user,
        db=db_session,
    )

    assert coaching.question_id == question.id
    assert coaching.session_id == session.id
    assert len(coaching.exemplar_answer) > 50
    assert coaching.engine == "deterministic_fallback"

    # Reload answer from database and verify STRICT IMMUTABILITY
    reloaded_answer = db_session.get(Answer, answer.id)
    assert reloaded_answer.answer_text == orig_answer_text
    assert reloaded_answer.content_score == orig_content_score
    assert reloaded_answer.communication_score == orig_comm_score
    assert reloaded_answer.evaluation_status == "completed"


def test_coach_unanswered_question_rejected(db_session: Session, coach_user: User):
    """Test that requesting coaching for an unanswered question returns 400 Bad Request."""
    session = InterviewSession(
        user_id=coach_user.id,
        role_title="Backend Engineer",
        job_description="Backend engineering role focusing on high-throughput microservices and relational databases.",
        status=SessionStatus.IN_PROGRESS,
        question_count=1,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    question = Question(
        session_id=session.id,
        question_text="Unanswered question here.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)

    with pytest.raises(HTTPException) as exc_info:
        get_coaching_feedback(
            session_id=session.id,
            question_id=question.id,
            payload=None,
            current_user=coach_user,
            db=db_session,
        )
    assert exc_info.value.status_code == 400
    assert "not been answered" in exc_info.value.detail


def test_coach_cross_user_isolation(db_session: Session, coach_user: User, other_user: User):
    """Test that User B cannot access coaching for User A's session."""
    session = InterviewSession(
        user_id=coach_user.id,
        role_title="Backend Engineer",
        job_description="Backend engineering role focusing on high-throughput microservices and relational databases.",
        status=SessionStatus.IN_PROGRESS,
        question_count=1,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    question = Question(
        session_id=session.id,
        question_text="Private question?",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)

    answer = Answer(
        question_id=question.id,
        answer_text="Private answer.",
        content_score=80.0,
        evaluation_status="completed",
    )
    db_session.add(answer)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        get_coaching_feedback(
            session_id=session.id,
            question_id=question.id,
            payload=None,
            current_user=other_user,
            db=db_session,
        )
    assert exc_info.value.status_code == 404
