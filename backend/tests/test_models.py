import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models import (
    User,
    Resume,
    Session as InterviewSession,
    Question,
    Answer,
    SessionStatus,
    QuestionType,
    QuestionDifficulty,
)


def test_user_creation_and_constraints(db_session: Session):
    """Test user creation and unique email constraint."""
    user1 = User(
        name="Candidate One",
        email="candidate1@example.com",
        password_hash="argon2id$placeholder$hash123",
    )
    db_session.add(user1)
    db_session.commit()

    assert user1.id is not None
    assert isinstance(user1.id, uuid.UUID)
    assert user1.created_at is not None
    assert user1.email == "candidate1@example.com"

    # Attempt duplicate email -> should raise IntegrityError
    user2 = User(
        name="Candidate Duplicate",
        email="candidate1@example.com",
        password_hash="argon2id$placeholder$diff456",
    )
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_resume_creation_and_json_field(db_session: Session):
    """Test resume creation with structured JSON parsed_skills."""
    user = User(
        name="Skill Test User",
        email="skills@example.com",
        password_hash="hash123",
    )
    db_session.add(user)
    db_session.commit()

    skills_data = {
        "technical": ["Python", "FastAPI", "React", "PostgreSQL"],
        "domains": ["Machine Learning", "System Design"],
        "years_experience": 5,
    }
    resume = Resume(
        user_id=user.id,
        raw_text="Experienced Software Engineer with background in Python and React.",
        parsed_skills=skills_data,
    )
    db_session.add(resume)
    db_session.commit()

    assert resume.id is not None
    assert isinstance(resume.id, uuid.UUID)
    assert resume.uploaded_at is not None
    assert resume.parsed_skills["technical"] == ["Python", "FastAPI", "React", "PostgreSQL"]
    assert resume.user.email == "skills@example.com"


def test_session_lifecycle_and_resume_relationship(db_session: Session):
    """Test session fields, status, null scores on creation, and resume reference."""
    user = User(
        name="Session Test User",
        email="session_user@example.com",
        password_hash="hash123",
    )
    resume = Resume(
        user=user,
        raw_text="Resume sample for testing session references.",
        parsed_skills=["SQL", "FastAPI"],
    )
    db_session.add_all([user, resume])
    db_session.commit()

    session = InterviewSession(
        user_id=user.id,
        resume_id=resume.id,
        job_description="Senior Backend Engineer requiring Python, SQL, and distributed systems.",
        status=SessionStatus.CREATED,
        overall_score=None,  # Null until evaluated
    )
    db_session.add(session)
    db_session.commit()

    assert session.id is not None
    assert session.status == SessionStatus.CREATED
    assert session.overall_score is None
    assert session.created_at is not None
    assert session.resume_id == resume.id
    assert session.resume.id == resume.id

    # Update status to in_progress then completed
    session.status = SessionStatus.IN_PROGRESS
    db_session.commit()
    assert session.status == SessionStatus.IN_PROGRESS

    session.status = SessionStatus.COMPLETED
    session.overall_score = 88.5
    db_session.commit()
    assert session.overall_score == 88.5


def test_questions_type_and_difficulty_validation(db_session: Session):
    """Test question creation, validated question types and difficulties."""
    user = User(
        name="Q User",
        email="q_user@example.com",
        password_hash="hash123",
    )
    session = InterviewSession(
        user=user,
        job_description="Full Stack Engineer role",
        status=SessionStatus.IN_PROGRESS,
    )
    db_session.add_all([user, session])
    db_session.commit()

    q1 = Question(
        session_id=session.id,
        question_text="Tell me about a time you resolved a major production incident.",
        type=QuestionType.BEHAVIORAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
    )
    q2 = Question(
        session_id=session.id,
        question_text="How would you design a rate limiter handling 100k requests per second?",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.HARD,
        order_index=1,
    )
    db_session.add_all([q1, q2])
    db_session.commit()

    assert q1.id is not None
    assert q2.id is not None
    assert q1.type == QuestionType.BEHAVIORAL
    assert q2.difficulty == QuestionDifficulty.HARD
    assert q1.order_index == 0
    assert q2.order_index == 1


def test_question_order_uniqueness_per_session(db_session: Session):
    """Test that two questions cannot have the same order_index within one session."""
    user = User(
        name="Unique Order User",
        email="unique_order@example.com",
        password_hash="hash123",
    )
    session = InterviewSession(
        user=user,
        job_description="DevOps role",
        status=SessionStatus.CREATED,
    )
    db_session.add_all([user, session])
    db_session.commit()

    q1 = Question(
        session_id=session.id,
        question_text="First question",
        type=QuestionType.BEHAVIORAL,
        difficulty=QuestionDifficulty.EASY,
        order_index=0,
    )
    db_session.add(q1)
    db_session.commit()

    q_dup = Question(
        session_id=session.id,
        question_text="Duplicate order index question",
        type=QuestionType.SITUATIONAL,
        difficulty=QuestionDifficulty.EASY,
        order_index=0,  # Duplicate!
    )
    db_session.add(q_dup)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_answer_lifecycle_and_star_scores(db_session: Session):
    """Test answer creation with null scores initially, followed by STAR score population."""
    user = User(
        name="Answer User",
        email="answer_user@example.com",
        password_hash="hash123",
    )
    session = InterviewSession(
        user=user,
        job_description="ML Engineer",
        status=SessionStatus.IN_PROGRESS,
    )
    db_session.add_all([user, session])
    db_session.commit()

    q = Question(
        session_id=session.id,
        question_text="Describe a complex model deployment.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.HARD,
        order_index=0,
    )
    db_session.add(q)
    db_session.commit()

    # Initial answer submission (unscored)
    answer = Answer(
        question_id=q.id,
        answer_text="We deployed a transformer pipeline with ONNX runtime...",
        audio_url=None,
        content_score=None,
        communication_score=None,
        filler_word_count=None,
        feedback_text=None,
        star_component_scores=None,
    )
    db_session.add(answer)
    db_session.commit()

    assert answer.id is not None
    assert answer.content_score is None
    assert answer.communication_score is None
    assert answer.star_component_scores is None

    # Populate AI evaluation scores later
    answer.content_score = 9.2
    answer.communication_score = 8.8
    answer.filler_word_count = 2
    answer.feedback_text = "Strong technical explanation."
    answer.star_component_scores = {
        "situation": 9.0,
        "task": 9.5,
        "action": 9.0,
        "result": 9.3,
    }
    db_session.commit()

    db_session.refresh(answer)
    assert answer.content_score == 9.2
    assert answer.star_component_scores["task"] == 9.5


def test_data_preservation_and_cascade_behaviors(db_session: Session):
    """
    Verify:
    1. Deleting a resume sets session.resume_id = NULL without deleting the session.
    2. Deleting a session cascades to its questions and answers.
    3. Deleting a user cascades to their sessions and resumes.
    """
    user = User(
        name="Isolation Candidate",
        email="isolation@example.com",
        password_hash="hash123",
    )
    resume = Resume(
        user=user,
        raw_text="Test resume for retention.",
    )
    session = InterviewSession(
        user=user,
        resume=resume,
        job_description="DevOps Architect",
        status=SessionStatus.IN_PROGRESS,
    )
    q = Question(
        session=session,
        question_text="Explain container orchestration best practices.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
    )
    a = Answer(
        question=q,
        answer_text="Containers should remain stateless and immutable...",
    )
    db_session.add_all([user, resume, session, q, a])
    db_session.commit()

    session_id = session.id
    resume_id = resume.id
    q_id = q.id
    a_id = a.id
    user_id = user.id

    # 1. Delete resume: session should persist, with resume_id cleared to None
    db_session.delete(resume)
    db_session.commit()

    db_session.expire_all()
    refreshed_session = db_session.get(InterviewSession, session_id)
    assert refreshed_session is not None
    assert refreshed_session.resume_id is None

    # 2. Deleting session cascades to questions and answers
    db_session.delete(refreshed_session)
    db_session.commit()

    db_session.expire_all()
    assert db_session.get(Question, q_id) is None
    assert db_session.get(Answer, a_id) is None

    # 3. User still exists
    refreshed_user = db_session.get(User, user_id)
    assert refreshed_user is not None

    # Deleting user cleans up remaining user data
    db_session.delete(refreshed_user)
    db_session.commit()
    db_session.expire_all()
    assert db_session.get(User, user_id) is None
