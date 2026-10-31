import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.services.pdf_generator import generate_pdf_report
from app.api.interviews import download_interview_report_pdf


@pytest.fixture
def user_a(db_session: Session) -> User:
    u = User(name="User Alpha", email="alpha_pdf@example.com", password_hash="hash_a")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def user_b(db_session: Session) -> User:
    u = User(name="User Beta", email="beta_pdf@example.com", password_hash="hash_b")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def test_generate_pdf_report_bytes():
    """Test PDF generation returns genuine, readable PDF bytes starting with %PDF-."""
    report_data = {
        "session_id": str(uuid.uuid4()),
        "role_title": "Backend Architect",
        "status": "completed",
        "interview_mode": "voice",
        "is_adaptive": True,
        "overall_score": 88.5,
        "average_content_score": 90.0,
        "average_communication_score": 84.0,
        "total_questions": 2,
        "evaluated_count": 2,
        "speech_analytics_summary": {
            "average_pace_wpm": 138.0,
            "pace_assessment": "Optimal Conversational Pace",
            "average_filler_rate_percentage": 2.1,
            "total_filler_count": 3,
            "voice_answers_analyzed": 2,
        },
        "star_breakdown": {
            "situation": 85.0,
            "task": 80.0,
            "action": 90.0,
            "result": 85.0,
        },
        "questions_feedback": [
            {
                "question_text": "Describe your approach to distributed cache invalidation.",
                "type": "technical",
                "difficulty": "hard",
                "target_skill": "Distributed Caching",
                "answer_text": "We implemented a dual-invalidation pattern using Redis Pub/Sub.",
                "content_score": 92.0,
                "communication_score": 85.0,
                "feedback_text": "Excellent depth on consensus and cache consistency trade-offs.",
                "adaptation_reason": "Difficulty upgraded to hard based on strong preceding performance.",
            }
        ],
        "actionable_recommendations": ["Deepen knowledge of Raft consensus protocols."],
        "scoring_methodology": "Content 75% + Comm 25%",
        "disclaimer": "PrepVerse AI is an educational practice tool.",
    }

    pdf_bytes = generate_pdf_report(report_data)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")


def test_download_interview_report_pdf_endpoint(db_session: Session, user_a: User):
    """Test download_interview_report_pdf downloads a valid PDF."""
    session = InterviewSession(
        user_id=user_a.id,
        role_title="Senior Python Engineer",
        job_description="Python FastAPI Postgres backend developer.",
        status=SessionStatus.COMPLETED,
        question_count=1,
        overall_score=92.0,
    )
    db_session.add(session)
    db_session.flush()

    question = Question(
        session_id=session.id,
        question_text="How do you handle connection pooling in PostgreSQL?",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
        target_skill="PostgreSQL",
        rubric_criteria="PRIVATE RUBRIC: Look for PgBouncer, SQLAlchemy pool size, max_overflow.",
    )
    db_session.add(question)
    db_session.flush()

    answer = Answer(
        question_id=question.id,
        answer_text="We configure PgBouncer in transaction mode alongside SQLAlchemy pool sizing.",
        content_score=92.0,
        communication_score=90.0,
        evaluation_status="completed",
        feedback_text="Strong explanation of connection management.",
    )
    db_session.add(answer)
    db_session.commit()

    res = download_interview_report_pdf(session_id=session.id, current_user=user_a, db=db_session)
    assert res.status_code == 200
    assert res.media_type == "application/pdf"
    assert "attachment" in res.headers["Content-Disposition"]
    assert f"prepverse_report_seniorpythonengineer_{str(session.id)[:8]}.pdf" in res.headers["Content-Disposition"]

    pdf_content = res.body
    assert pdf_content.startswith(b"%PDF-")
    # Verify private evaluation rubric is NOT exposed in the binary/text stream
    assert b"PRIVATE RUBRIC" not in pdf_content


def test_download_interview_report_pdf_cross_user_isolation(
    db_session: Session, user_a: User, user_b: User
):
    """Test that candidate B cannot download candidate A's PDF report."""
    session = InterviewSession(
        user_id=user_a.id,
        role_title="Private Session",
        job_description="Confidential job description.",
        status=SessionStatus.COMPLETED,
        question_count=1,
    )
    db_session.add(session)
    db_session.commit()

    # User B requests User A's session PDF -> must raise 404 HTTPException
    with pytest.raises(HTTPException) as exc:
        download_interview_report_pdf(session_id=session.id, current_user=user_b, db=db_session)
    assert exc.value.status_code == 404
    assert exc.value.detail == "Interview session not found"


def test_download_interview_report_pdf_nonexistent_session(db_session: Session, user_a: User):
    """Test requesting a non-existent session ID raises 404."""
    random_id = uuid.uuid4()
    with pytest.raises(HTTPException) as exc:
        download_interview_report_pdf(session_id=random_id, current_user=user_a, db=db_session)
    assert exc.value.status_code == 404
