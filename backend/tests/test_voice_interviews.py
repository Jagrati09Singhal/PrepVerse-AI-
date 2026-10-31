import io
import pytest
from uuid import uuid4
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resume import Resume
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.schemas.interview import (
    InterviewCreate,
    AnswerSubmit,
)
from app.api.interviews import (
    create_interview_session,
    submit_answer,
    transcribe_interview_audio,
)
from app.services.speech_transcriber import validate_audio_upload


@pytest.fixture
def user_one(db_session: Session) -> User:
    u = User(name="User One", email="user1@example.com", password_hash="hash1")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def user_two(db_session: Session) -> User:
    u = User(name="User Two", email="user2@example.com", password_hash="hash2")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def resume_one(db_session: Session, user_one: User) -> Resume:
    r = Resume(
        user_id=user_one.id,
        filename="resume1.pdf",
        raw_text="Backend engineer with Python, PostgreSQL, and AWS experience.",
        parsed_skills=["Python", "PostgreSQL", "AWS"],
    )
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)
    return r


def test_create_voice_interview_session(
    db_session: Session, user_one: User, resume_one: Resume
):
    """Verifies creating an interview in voice mode with adaptive difficulty active."""
    payload = InterviewCreate(
        resume_id=resume_one.id,
        job_description="Senior Python engineer role requiring distributed system expertise.",
        question_count=3,
        interview_mode="voice",
        is_adaptive=True,
    )
    session_detail = create_interview_session(payload, current_user=user_one, db=db_session)
    assert session_detail.interview_mode == "voice"
    assert session_detail.is_adaptive is True
    assert len(session_detail.questions) == 3


def test_submit_voice_answer_with_duration_records_wpm(
    db_session: Session, user_one: User, resume_one: Resume
):
    """Verifies that submitting an answer with audio_duration_seconds computes speaking pace."""
    payload = InterviewCreate(
        resume_id=resume_one.id,
        job_description="Backend developer role requiring asynchronous task handling.",
        question_count=2,
        interview_mode="voice",
    )
    session_detail = create_interview_session(payload, current_user=user_one, db=db_session)
    q1 = session_detail.questions[0]

    # Detailed 80-word answer spoken over 30 seconds (~160 WPM)
    answer_text = (
        "In our production system we implemented Celery workers with a Redis message broker. "
        "The asynchronous tasks handled heavy video transcoding jobs outside of the request-response cycle. "
        "We configured dead-letter queues to catch failed tasks and added retries with exponential backoff. "
        "As a result, API response times improved from 1200ms to 45ms, and task throughput scaled reliably."
    )

    ans_payload = AnswerSubmit(
        question_id=q1.id,
        answer_text=answer_text,
        audio_duration_seconds=30.0,
        pause_data={"pause_count": 3, "total_pause_duration_seconds": 3.5},
    )

    eval_out = submit_answer(session_detail.id, ans_payload, current_user=user_one, db=db_session)
    assert eval_out.evaluation_status == "completed"
    assert eval_out.audio_duration_seconds == 30.0
    assert eval_out.speech_analytics is not None

    sa = eval_out.speech_analytics
    assert sa["speaking_pace"]["status"] == "available"
    assert sa["speaking_pace"]["value"] > 90.0
    assert sa["pauses"]["status"] == "available"
    assert sa["pauses"]["value"]["pause_count"] == 3


def test_adaptive_difficulty_updates_next_question_in_session(
    db_session: Session, user_one: User, resume_one: Resume
):
    """Verifies that completing question 0 with a strong score increases question 1's difficulty to HARD."""
    payload = InterviewCreate(
        resume_id=resume_one.id,
        job_description="Distributed systems engineering role.",
        question_count=2,
        difficulty=QuestionDifficulty.MEDIUM,
        is_adaptive=True,
    )
    session_detail = create_interview_session(payload, current_user=user_one, db=db_session)
    q0 = session_detail.questions[0]
    q1 = session_detail.questions[1]
    assert q0.difficulty == QuestionDifficulty.MEDIUM
    assert q1.difficulty == QuestionDifficulty.MEDIUM

    # Submit strong answer for q0 with clear production context, trade-offs, and metrics
    strong_answer = (
        "For example, in production during my time leading backend operations in 2024, our primary database "
        "suffered extreme read spikes. My task was to design and deploy an automated caching and replication layer. "
        "I investigated bottlenecks, configured Redis with write-around caching, and partitioned tables by user tenant "
        "to address the trade-off between consistency and latency. "
        "This resulted in a 75% latency drop, improved throughput, and 99.99% service availability during peak traffic."
    )
    submit_answer(
        session_detail.id,
        AnswerSubmit(question_id=q0.id, answer_text=strong_answer),
        current_user=user_one,
        db=db_session,
    )

    # Refresh question 1 from DB
    db_session.expire_all()
    updated_q1 = db_session.get(Question, q1.id)
    assert updated_q1.difficulty == QuestionDifficulty.HARD
    assert "Difficulty increased to hard" in updated_q1.adaptation_reason


def test_validate_audio_upload_helper():
    """Tests file validation rules for audio uploads."""
    # 1. Empty file
    valid, err = validate_audio_upload(b"", "test.wav", "audio/wav")
    assert valid is False
    assert "empty" in err.lower()

    # 2. Oversized file (>10MB)
    huge_bytes = b"0" * (11 * 1024 * 1024)
    valid, err = validate_audio_upload(huge_bytes, "test.wav", "audio/wav")
    assert valid is False
    assert "exceeds" in err.lower()

    # 3. Disallowed extension & mime
    valid, err = validate_audio_upload(b"somecontent", "malicious.exe", "application/x-dosexec")
    assert valid is False
    assert "unsupported" in err.lower()

    # 4. Valid WebM header
    webm_header = b"\x1a\x45\xdf\xa3" + (b"\x00" * 100)
    valid, err = validate_audio_upload(webm_header, "speech.webm", "audio/webm")
    assert valid is True
    assert err is None


def test_transcribe_audio_cross_user_isolation(
    db_session: Session, user_one: User, user_two: User, resume_one: Resume
):
    """Verifies user two cannot upload audio to user one's interview session."""
    payload = InterviewCreate(
        resume_id=resume_one.id,
        job_description="Audio test session with more than twenty characters.",
        question_count=1,
    )
    s = create_interview_session(payload, current_user=user_one, db=db_session)

    dummy_file = UploadFile(
        filename="sample.webm",
        file=io.BytesIO(b"\x1a\x45\xdf\xa3" + (b"\x00" * 100)),
        headers={"content-type": "audio/webm"},
    )

    with pytest.raises(HTTPException) as exc_info:
        transcribe_interview_audio(s.id, file=dummy_file, current_user=user_two, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
