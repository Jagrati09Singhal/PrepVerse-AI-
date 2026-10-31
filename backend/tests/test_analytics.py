import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.api.analytics import (
    get_analytics_overview,
    get_analytics_trends,
    get_analytics_skills,
    get_analytics_recommendations,
)


@pytest.fixture
def user_a(db_session: Session) -> User:
    u = User(name="User Alpha", email="alpha_analytics@example.com", password_hash="hash_a")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture
def user_b(db_session: Session) -> User:
    u = User(name="User Beta", email="beta_analytics@example.com", password_hash="hash_b")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def test_analytics_overview_empty_history(db_session: Session, user_a: User):
    """Test analytics overview when user has no interview sessions recorded."""
    res = get_analytics_overview(current_user=user_a, db=db_session)
    assert res.total_sessions == 0
    assert res.completed_sessions == 0
    assert res.has_history is False
    assert res.average_overall_score is None
    assert res.average_content_score is None
    assert res.speech_summary.average_pace_wpm is None
    assert "No interview sessions recorded yet" in res.empty_history_message


def test_analytics_overview_with_completed_and_inprogress_sessions(db_session: Session, user_a: User):
    """Test analytics overview aggregates completed sessions, ignores incomplete sessions in averages."""
    # 1. Create a completed session with answers
    s1 = InterviewSession(
        user_id=user_a.id,
        role_title="Backend Engineer",
        job_description="Python, FastAPI, Postgres developer needed for scalable microservices.",
        status=SessionStatus.COMPLETED,
        question_count=2,
        overall_score=85.0,
        communication_score=80.0,
        completed_at=datetime.now(timezone.utc),
    )
    db_session.add(s1)
    db_session.flush()

    q1 = Question(
        session_id=s1.id,
        question_text="Explain database indexing in PostgreSQL.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
        target_skill="PostgreSQL",
    )
    q2 = Question(
        session_id=s1.id,
        question_text="Describe a time you handled a production incident.",
        type=QuestionType.BEHAVIORAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=1,
        target_skill="Incident Response",
    )
    db_session.add_all([q1, q2])
    db_session.flush()

    a1 = Answer(
        question_id=q1.id,
        answer_text="PostgreSQL uses B-tree indexes by default to provide O(log n) lookup times.",
        content_score=90.0,
        communication_score=85.0,
        evaluation_status="completed",
        audio_duration_seconds=12.0,
        speech_analytics={
            "speaking_pace_wpm": {"words_per_minute": 135.0, "category": "Optimal Conversational Pace"},
            "filler_words": {"total_filler_count": 1, "filler_rate_percentage": 2.5},
        },
    )
    a2 = Answer(
        question_id=q2.id,
        answer_text="In our previous microservice, an unindexed query locked the database.",
        content_score=80.0,
        communication_score=75.0,
        evaluation_status="completed",
        audio_duration_seconds=15.0,
        speech_analytics={
            "speaking_pace_wpm": {"words_per_minute": 145.0, "category": "Optimal Conversational Pace"},
            "filler_words": {"total_filler_count": 2, "filler_rate_percentage": 3.8},
        },
    )
    db_session.add_all([a1, a2])

    # 2. Create an in-progress session (should not affect completed session overall_score average)
    s2 = InterviewSession(
        user_id=user_a.id,
        role_title="Backend Engineer",
        job_description="Python, FastAPI, Postgres developer needed for scalable microservices.",
        status=SessionStatus.IN_PROGRESS,
        question_count=2,
        overall_score=None,
    )
    db_session.add(s2)
    db_session.flush()

    q3 = Question(
        session_id=s2.id,
        question_text="Explain async/await in Python.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=0,
        target_skill="Python AsyncIO",
    )
    db_session.add(q3)
    db_session.flush()

    # Pending answer in s2 (must be excluded from evaluated answers and scores)
    a3 = Answer(
        question_id=q3.id,
        answer_text="Asyncio runs an event loop that coordinates coroutines without threads.",
        evaluation_status="pending",
        content_score=None,
    )
    db_session.add(a3)
    db_session.commit()

    res = get_analytics_overview(current_user=user_a, db=db_session)
    assert res.total_sessions == 2
    assert res.completed_sessions == 1
    assert res.in_progress_sessions == 1
    assert res.total_evaluated_answers == 2  # pending answer excluded
    assert res.average_overall_score == 85.0
    assert res.average_content_score == 85.0  # (90 + 80) / 2
    assert res.average_communication_score == 80.0  # (85 + 75) / 2
    assert res.speech_summary.voice_answers_count == 2
    assert res.speech_summary.average_pace_wpm == 140.0  # (135 + 145) / 2
    assert res.speech_summary.total_filler_count == 3
    assert len(res.recent_activity) == 2


def test_analytics_trends_and_trajectory(db_session: Session, user_a: User):
    """Test longitudinal trend calculation across chronological sessions."""
    s1 = InterviewSession(
        user_id=user_a.id,
        role_title="Senior Backend Engineer",
        job_description="Scalable distributed systems engineer.",
        status=SessionStatus.COMPLETED,
        question_count=1,
        overall_score=75.0,
        completed_at=datetime(2026, 10, 15, 10, 0, tzinfo=timezone.utc),
    )
    s2 = InterviewSession(
        user_id=user_a.id,
        role_title="Senior Backend Engineer",
        job_description="Scalable distributed systems engineer.",
        status=SessionStatus.COMPLETED,
        question_count=1,
        overall_score=88.0,
        completed_at=datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc),
    )
    db_session.add_all([s1, s2])
    db_session.flush()

    q1 = Question(session_id=s1.id, question_text="Q1", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=0)
    q2 = Question(session_id=s2.id, question_text="Q2", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=0)
    db_session.add_all([q1, q2])
    db_session.flush()

    a1 = Answer(question_id=q1.id, answer_text="Ans1", content_score=75.0, communication_score=75.0, evaluation_status="completed")
    a2 = Answer(question_id=q2.id, answer_text="Ans2", content_score=88.0, communication_score=88.0, evaluation_status="completed")
    db_session.add_all([a1, a2])
    db_session.commit()

    res = get_analytics_trends(current_user=user_a, db=db_session)
    assert len(res.timeline) == 2
    assert res.timeline[0].overall_score == 75.0
    assert res.timeline[1].overall_score == 88.0
    assert res.trajectory == "improving"
    assert "trending upwards" in res.trajectory_message
    assert len(res.performance_by_role) == 1
    assert res.performance_by_role[0].role_title == "Senior Backend Engineer"
    assert res.performance_by_role[0].average_overall_score == 81.5


def test_analytics_skills_classification(db_session: Session, user_a: User):
    """Test skill performance aggregation categorizes strong, weak, developing, and insufficient evidence skills."""
    s = InterviewSession(
        user_id=user_a.id,
        role_title="Fullstack Engineer",
        job_description="Fullstack engineer with React and Python experience.",
        status=SessionStatus.COMPLETED,
        question_count=5,
    )
    db_session.add(s)
    db_session.flush()

    # PostgreSQL: 2 questions, scores 85 & 95 (avg 90) -> strong
    q1 = Question(session_id=s.id, question_text="Pg1", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=0, target_skill="PostgreSQL")
    q2 = Question(session_id=s.id, question_text="Pg2", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=1, target_skill="PostgreSQL")

    # Docker: 2 questions, scores 50 & 55 (avg 52.5) -> weak
    q3 = Question(session_id=s.id, question_text="Dk1", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=2, target_skill="Docker")
    q4 = Question(session_id=s.id, question_text="Dk2", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=3, target_skill="Docker")

    # Kubernetes: only 1 question, score 90 -> insufficient evidence (needs >= 2)
    q5 = Question(session_id=s.id, question_text="K8s", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=4, target_skill="Kubernetes")

    db_session.add_all([q1, q2, q3, q4, q5])
    db_session.flush()

    a1 = Answer(question_id=q1.id, answer_text="Ans", content_score=85.0, evaluation_status="completed")
    a2 = Answer(question_id=q2.id, answer_text="Ans", content_score=95.0, evaluation_status="completed")
    a3 = Answer(question_id=q3.id, answer_text="Ans", content_score=50.0, evaluation_status="completed")
    a4 = Answer(question_id=q4.id, answer_text="Ans", content_score=55.0, evaluation_status="completed")
    a5 = Answer(question_id=q5.id, answer_text="Ans", content_score=90.0, evaluation_status="completed")

    db_session.add_all([a1, a2, a3, a4, a5])
    db_session.commit()

    res = get_analytics_skills(current_user=user_a, db=db_session)
    strong_names = [item.skill for item in res.strong_skills]
    weak_names = [item.skill for item in res.weak_skills]
    insufficient_names = [item.skill for item in res.insufficient_evidence_skills]

    assert "PostgreSQL" in strong_names
    assert "Docker" in weak_names
    assert "Kubernetes" in insufficient_names


def test_analytics_recommendations_rules(db_session: Session, user_a: User):
    """Test recommendations prioritize recurring weak skills and identify gaps."""
    s = InterviewSession(
        user_id=user_a.id,
        role_title="DevOps Engineer",
        job_description="DevOps engineer needed.",
        status=SessionStatus.COMPLETED,
        question_count=2,
    )
    db_session.add(s)
    db_session.flush()

    q1 = Question(session_id=s.id, question_text="Dk1", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=0, target_skill="Docker")
    q2 = Question(session_id=s.id, question_text="Dk2", type=QuestionType.TECHNICAL, difficulty=QuestionDifficulty.MEDIUM, order_index=1, target_skill="Docker")
    db_session.add_all([q1, q2])
    db_session.flush()

    a1 = Answer(question_id=q1.id, answer_text="Ans", content_score=45.0, evaluation_status="completed")
    a2 = Answer(question_id=q2.id, answer_text="Ans", content_score=52.0, evaluation_status="completed")
    db_session.add_all([a1, a2])
    db_session.commit()

    res = get_analytics_recommendations(current_user=user_a, db=db_session)
    assert len(res.recommendations) > 0
    top_rec = res.recommendations[0]
    assert top_rec.topic == "Docker"
    assert top_rec.priority == "high"
    assert top_rec.recommended_mode == "weak_area"
    assert "Repeated low score" in top_rec.reason


def test_analytics_multi_user_isolation(db_session: Session, user_a: User, user_b: User):
    """Test that candidate A cannot see candidate B's analytics data."""
    s = InterviewSession(
        user_id=user_a.id,
        role_title="Secret Role For User A",
        job_description="Python developer required.",
        status=SessionStatus.COMPLETED,
        question_count=1,
        overall_score=99.0,
    )
    db_session.add(s)
    db_session.commit()

    # Candidate B checks overview
    res_b = get_analytics_overview(current_user=user_b, db=db_session)
    assert res_b.total_sessions == 0
    assert res_b.has_history is False

    # Candidate A checks overview
    res_a = get_analytics_overview(current_user=user_a, db=db_session)
    assert res_a.total_sessions == 1
    assert res_a.average_overall_score == 99.0
