import pytest
from uuid import uuid4
from fastapi import status, HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resume import Resume
from app.models.job_analysis import JobAnalysis
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
    list_interview_sessions,
    get_interview_session,
    start_interview_session,
    submit_answer,
    complete_interview_session,
    get_interview_report,
    delete_interview_session,
)


@pytest.fixture
def candidate_a(db_session: Session) -> User:
    user = User(
        name="Candidate Alpha",
        email="alpha@example.com",
        password_hash="fakehashalpha",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def candidate_b(db_session: Session) -> User:
    user = User(
        name="Candidate Beta",
        email="beta@example.com",
        password_hash="fakehashbeta",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def resume_a(db_session: Session, candidate_a: User) -> Resume:
    resume = Resume(
        user_id=candidate_a.id,
        filename="alpha_resume.pdf",
        raw_text="Experienced Python backend developer with FastAPI, PostgreSQL, and Docker experience.",
        parsed_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        parsing_status="completed",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    return resume


@pytest.fixture
def resume_b(db_session: Session, candidate_b: User) -> Resume:
    resume = Resume(
        user_id=candidate_b.id,
        filename="beta_resume.pdf",
        raw_text="Frontend engineer specialized in React, TypeScript, and CSS.",
        parsed_skills=["React", "TypeScript", "Tailwind CSS"],
        parsing_status="completed",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    return resume


@pytest.fixture
def job_analysis_a(db_session: Session, candidate_a: User, resume_a: Resume) -> JobAnalysis:
    ja = JobAnalysis(
        user_id=candidate_a.id,
        resume_id=resume_a.id,
        role_title="Senior Backend Engineer",
        company_name="CloudTech",
        job_description_raw="Seeking a Senior Backend Engineer proficient in Python, Kubernetes, Redis, and system architecture.",
        extracted_requirements={
            "required_skills": ["Python", "Kubernetes", "Redis"],
            "preferred_skills": ["FastAPI", "PostgreSQL"],
        },
        match_results=[
            {"skill": "Python", "classification": "evidence_found"},
            {"skill": "Kubernetes", "classification": "not_found"},
            {"skill": "Redis", "classification": "needs_verification"},
        ],
    )
    db_session.add(ja)
    db_session.commit()
    db_session.refresh(ja)
    return ja


def test_create_interview_session_with_resume_and_analysis(
    db_session: Session, candidate_a: User, resume_a: Resume, job_analysis_a: JobAnalysis
):
    """Verifies that an interview session is created with personalized questions based on resume and analysis."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_analysis_id=job_analysis_a.id,
        role_title="Senior Backend Engineer",
        question_count=4,
        question_types=[QuestionType.TECHNICAL, QuestionType.BEHAVIORAL],
        difficulty=QuestionDifficulty.MEDIUM,
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)

    assert session_detail.id is not None
    assert session_detail.status == SessionStatus.CREATED
    assert session_detail.role_title == "Senior Backend Engineer"
    assert session_detail.question_count == 4
    assert len(session_detail.questions) == 4

    # Verify questions are ordered sequentially
    for idx, q in enumerate(session_detail.questions):
        assert q.order_index == idx
        assert q.question_text is not None
        assert len(q.question_text) > 20

    # Verify question targeting includes skill gaps or evidenced skills
    all_texts = " ".join(q.question_text for q in session_detail.questions)
    assert "Kubernetes" in all_texts or "Python" in all_texts or "STAR" in all_texts


def test_create_interview_session_with_raw_job_description(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Verifies creating an interview session using raw job description text."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="We need a DevOps engineer experienced in AWS, Terraform, and CI/CD automation pipelines.",
        role_title="DevOps Lead",
        question_count=3,
        question_types=[QuestionType.TECHNICAL, QuestionType.SITUATIONAL],
        difficulty=QuestionDifficulty.HARD,
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)
    assert session_detail.id is not None
    assert session_detail.role_title == "DevOps Lead"
    assert len(session_detail.questions) == 3


def test_interview_cross_user_resume_isolation(
    db_session: Session, candidate_a: User, candidate_b: User, resume_b: Resume
):
    """Verifies candidate A cannot create an interview using candidate B's resume."""
    payload = InterviewCreate(
        resume_id=resume_b.id,
        job_description="Valid job description with more than twenty characters.",
        question_count=3,
    )
    with pytest.raises(HTTPException) as exc_info:
        create_interview_session(payload, current_user=candidate_a, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_interview_cross_user_analysis_isolation(
    db_session: Session, candidate_a: User, candidate_b: User, resume_b: Resume, job_analysis_a: JobAnalysis
):
    """Verifies candidate B cannot create an interview using candidate A's job analysis."""
    payload = InterviewCreate(
        resume_id=resume_b.id,
        job_analysis_id=job_analysis_a.id,
        question_count=3,
    )
    with pytest.raises(HTTPException) as exc_info:
        create_interview_session(payload, current_user=candidate_b, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_interview_cross_user_session_access_denied(
    db_session: Session, candidate_a: User, candidate_b: User, resume_a: Resume
):
    """Verifies candidate B cannot access, view, or submit answers to candidate A's session."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Valid job description with more than twenty characters.",
        question_count=3,
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)

    # Candidate B tries to retrieve session
    with pytest.raises(HTTPException) as exc_info:
        get_interview_session(session_detail.id, current_user=candidate_b, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

    # Candidate B tries to start session
    with pytest.raises(HTTPException) as exc_info:
        start_interview_session(session_detail.id, current_user=candidate_b, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

    # Candidate B tries to get report
    with pytest.raises(HTTPException) as exc_info:
        get_interview_report(session_detail.id, current_user=candidate_b, db=db_session)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_session_lifecycle_start_and_complete(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Tests session status transitions: CREATED -> IN_PROGRESS -> COMPLETED."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Backend engineer role requiring robust API development.",
        question_count=3,
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)
    assert session_detail.status == SessionStatus.CREATED

    # Start session
    started = start_interview_session(session_detail.id, current_user=candidate_a, db=db_session)
    assert started.status == SessionStatus.IN_PROGRESS

    # Starting again is idempotent
    started_again = start_interview_session(session_detail.id, current_user=candidate_a, db=db_session)
    assert started_again.status == SessionStatus.IN_PROGRESS

    # Complete session
    completed = complete_interview_session(session_detail.id, current_user=candidate_a, db=db_session)
    assert completed.status == SessionStatus.COMPLETED
    assert completed.completed_at is not None

    # Starting a completed session is rejected
    with pytest.raises(HTTPException) as exc_info:
        start_interview_session(session_detail.id, current_user=candidate_a, db=db_session)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


def test_submit_and_evaluate_behavioral_answer_with_star(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Tests behavioral answer submission with explicit STAR component evaluation."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Senior engineer role focusing on technical leadership and teamwork.",
        question_count=1,
        question_types=[QuestionType.BEHAVIORAL],
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)
    q = session_detail.questions[0]
    assert q.type == QuestionType.BEHAVIORAL

    # Candidate provides a comprehensive STAR answer
    star_answer = (
        "During my previous role at a SaaS company in 2023, our core database was experiencing "
        "heavy read latency spikes during peak afternoon traffic. The challenge was that several "
        "client dashboards were timing out. "
        "My specific responsibility was to design and lead the database caching mitigation strategy. "
        "I investigated the slow queries, implemented an asynchronous Redis caching layer with a 5-minute TTL, "
        "and refactored the ORM queries to utilize read replicas. "
        "As a result, p99 database latency was reduced by 65%, and dashboard timeouts dropped to zero. "
        "The project was successfully delivered 3 days ahead of schedule."
    )

    ans_payload = AnswerSubmit(question_id=q.id, answer_text=star_answer)
    eval_res = submit_answer(session_detail.id, ans_payload, current_user=candidate_a, db=db_session)

    assert eval_res.id is not None
    assert eval_res.evaluation_status == "completed"
    assert eval_res.content_score is not None
    assert eval_res.content_score >= 80.0
    assert eval_res.communication_score is not None
    assert eval_res.communication_score >= 75.0
    assert eval_res.star_component_scores is not None
    assert "situation" in eval_res.star_component_scores
    assert "task" in eval_res.star_component_scores
    assert "action" in eval_res.star_component_scores
    assert "result" in eval_res.star_component_scores
    assert eval_res.star_component_scores["action"] >= 80.0
    assert eval_res.star_component_scores["result"] >= 80.0
    assert len(eval_res.evaluation_details.get("strengths", [])) >= 1


def test_submit_and_evaluate_technical_answer_no_star_rubric(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Tests technical answer evaluation and confirms STAR rubric is not forced on technical questions."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Backend role requiring deep understanding of caching and concurrency.",
        question_count=1,
        question_types=[QuestionType.TECHNICAL],
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)
    q = session_detail.questions[0]
    assert q.type == QuestionType.TECHNICAL

    tech_answer = (
        "When designing high-throughput systems, caching is essential to alleviate database pressure. "
        "For example, in production we leverage Redis with a write-around or cache-aside strategy. "
        "The trade-off is eventual consistency versus latency. To prevent cache stampedes, "
        "we use distributed mutex locks and jittered expiration times. We also monitor hit-rates "
        "via Prometheus metrics to ensure memory bounds are not exceeded."
    )

    ans_payload = AnswerSubmit(question_id=q.id, answer_text=tech_answer)
    eval_res = submit_answer(session_detail.id, ans_payload, current_user=candidate_a, db=db_session)

    assert eval_res.evaluation_status == "completed"
    assert eval_res.content_score is not None
    assert eval_res.content_score >= 75.0
    # Must NOT have star component scores
    assert eval_res.star_component_scores is None
    assert "Technical assessment" in eval_res.feedback_text


def test_answer_idempotent_retry_updates_without_duplicates(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Verifies that submitting an answer multiple times for the same question updates the record rather than duplicating it."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Software engineer role.",
        question_count=1,
        question_types=[QuestionType.TECHNICAL],
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)
    q = session_detail.questions[0]

    ans_payload1 = AnswerSubmit(question_id=q.id, answer_text="First initial response with more than ten chars.")
    eval1 = submit_answer(session_detail.id, ans_payload1, current_user=candidate_a, db=db_session)

    ans_payload2 = AnswerSubmit(question_id=q.id, answer_text="Updated and improved answer with much more architectural detail and trade-offs.")
    eval2 = submit_answer(session_detail.id, ans_payload2, current_user=candidate_a, db=db_session)

    # Same Answer record ID
    assert eval1.id == eval2.id
    assert eval2.answer_text == ans_payload2.answer_text

    # Total answer records for this question must still be 1
    total_answers = db_session.query(Answer).filter(Answer.question_id == q.id).count()
    assert total_answers == 1


def test_submit_answer_rejects_foreign_question(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Verifies that submitting an answer for a question belonging to another session is rejected."""
    # Session 1
    p1 = InterviewCreate(resume_id=resume_a.id, job_description="Role 1 description with more than twenty characters.", question_count=1)
    s1 = create_interview_session(p1, current_user=candidate_a, db=db_session)

    # Session 2
    p2 = InterviewCreate(resume_id=resume_a.id, job_description="Role 2 description with more than twenty characters.", question_count=1)
    s2 = create_interview_session(p2, current_user=candidate_a, db=db_session)

    # Submit question from s2 into s1
    q_foreign = s2.questions[0]
    ans_payload = AnswerSubmit(question_id=q_foreign.id, answer_text="Valid answer text for testing.")

    with pytest.raises(HTTPException) as exc_info:
        submit_answer(s1.id, ans_payload, current_user=candidate_a, db=db_session)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Question does not belong" in exc_info.value.detail


def test_private_rubric_not_exposed_in_candidate_api(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Ensures rubric_criteria is stored in the database but never exposed in QuestionOut schemas."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Backend engineer role requiring robust API development.",
        question_count=2,
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)

    for q in session_detail.questions:
        assert not hasattr(q, "rubric_criteria")

    # Inspect the DB question directly to ensure it was saved
    db_q = db_session.get(Question, session_detail.questions[0].id)
    assert db_q.rubric_criteria is not None
    assert len(db_q.rubric_criteria) > 10


def test_full_interview_report_generation(
    db_session: Session, candidate_a: User, resume_a: Resume, job_analysis_a: JobAnalysis
):
    """Verifies end-to-end flow from interview session, answering all questions, to final report."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_analysis_id=job_analysis_a.id,
        question_count=2,
        question_types=[QuestionType.BEHAVIORAL, QuestionType.TECHNICAL],
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)

    # Answer Question 1 (Behavioral)
    q1 = session_detail.questions[0]
    submit_answer(
        session_detail.id,
        AnswerSubmit(
            question_id=q1.id,
            answer_text=(
                "At my previous job in 2024, our payments API experienced unexpected outages. "
                "My responsibility was to implement idempotent transaction processing. "
                "I designed a distributed lock using Redis and idempotency keys in PostgreSQL. "
                "As a result, duplicate payment charges dropped to zero and uptime reached 99.99%."
            ),
        ),
        current_user=candidate_a,
        db=db_session,
    )

    # Answer Question 2 (Technical)
    q2 = session_detail.questions[1]
    submit_answer(
        session_detail.id,
        AnswerSubmit(
            question_id=q2.id,
            answer_text=(
                "For high-throughput systems, we design asynchronous background workers using Kafka. "
                "Instead of blocking synchronous requests, we offload processing to consumers with retry queues. "
                "This optimizes response latency while preventing system overload."
            ),
        ),
        current_user=candidate_a,
        db=db_session,
    )

    # Complete the interview
    completed_session = complete_interview_session(session_detail.id, current_user=candidate_a, db=db_session)
    assert completed_session.status == SessionStatus.COMPLETED
    assert completed_session.overall_score is not None
    assert completed_session.overall_score >= 70.0

    # Retrieve report
    report = get_interview_report(session_detail.id, current_user=candidate_a, db=db_session)
    assert report.session_id == session_detail.id
    assert report.total_questions == 2
    assert report.completed_questions == 2
    assert report.evaluated_count == 2
    assert report.pending_count == 0
    assert report.failed_count == 0
    assert report.average_content_score is not None
    assert report.average_communication_score is not None
    assert report.star_breakdown is not None
    assert "action" in report.star_breakdown
    assert len(report.strongest_areas) >= 1
    assert len(report.actionable_recommendations) >= 1
    assert "automated" in report.disclaimer.lower()


def test_incomplete_interview_report_does_not_treat_missing_as_zero(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Verifies that in an incomplete interview, unanswered questions are excluded from score calculations."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Full stack role requiring multiple skills.",
        question_count=3,
        question_types=[QuestionType.TECHNICAL],
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)

    # Answer ONLY question 1 with a high-scoring detailed response
    q1 = session_detail.questions[0]
    detailed_answer = (
        "In our production backend environment, we implemented a robust distributed caching and database architecture. "
        "We deployed Redis clusters configured with cache-aside patterns to alleviate pressure on the primary database, "
        "and used connection pooling with PostgreSQL to prevent connection starvation during peak traffic. "
        "The trade-off between eventual consistency and response latency was carefully balanced using cache invalidation hooks. "
        "Furthermore, we monitored cache hit-rates via Prometheus metrics and ensured automated database read-replica failover."
    )
    ans1 = submit_answer(
        session_detail.id,
        AnswerSubmit(
            question_id=q1.id,
            answer_text=detailed_answer,
        ),
        current_user=candidate_a,
        db=db_session,
    )

    # Retrieve report for this in-progress interview
    report = get_interview_report(session_detail.id, current_user=candidate_a, db=db_session)
    assert report.total_questions == 3
    assert report.completed_questions == 1
    assert report.evaluated_count == 1
    # Average content score must equal the single evaluated score, NOT be diluted by two 0s
    assert report.average_content_score == pytest.approx(ans1.content_score, abs=0.2)
    assert report.overall_score is not None
    assert report.overall_score > 60.0  # If missing were 0, average would be ~25


def test_delete_interview_session(
    db_session: Session, candidate_a: User, resume_a: Resume
):
    """Verifies safe deletion of an owned interview session."""
    payload = InterviewCreate(
        resume_id=resume_a.id,
        job_description="Temporary role to test deletion.",
        question_count=1,
    )
    session_detail = create_interview_session(payload, current_user=candidate_a, db=db_session)

    delete_interview_session(session_detail.id, current_user=candidate_a, db=db_session)

    # Verify session is deleted
    deleted_session = db_session.get(InterviewSession, session_detail.id)
    assert deleted_session is None
