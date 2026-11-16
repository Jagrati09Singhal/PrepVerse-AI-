import datetime
import logging
from sqlalchemy import select
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.resume import Resume
from app.models.job_analysis import JobAnalysis
from app.models.roadmap import PreparationPlan, RoadmapTask
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import SessionStatus, QuestionDifficulty, QuestionType

logger = logging.getLogger("uvicorn")


def seed_demo_account():
    """
    Auto-seeds the default demo candidate (demo@prepverse.ai / Candidate123!)
    with a fully populated portfolio: resume, target job match, completed
    interview session, and active roadmap tasks.
    """
    try:
        with SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == "demo@prepverse.ai"))
            if user:
                return  # Already seeded

            logger.info("Auto-seeding demo candidate account: demo@prepverse.ai")

            # 1. User
            user = User(
                name="Alex Rivera",
                email="demo@prepverse.ai",
                password_hash=hash_password("Candidate123!"),
            )
            db.add(user)
            db.flush()

            # 2. Preparation Plan
            plan = PreparationPlan(
                user_id=user.id,
                target_role="Full Stack Software Engineer",
                target_interview_date=datetime.date.today() + datetime.timedelta(days=21),
                daily_prep_minutes=45,
                academic_year="Final Year B.Tech",
                branch="Computer Science & Engineering",
                ongoing_subjects="Distributed Systems, Cloud Architecture, Database Systems",
                core_interests="System Design, React, TypeScript, Python, FastAPI, Microservices",
            )
            db.add(plan)
            db.flush()

            # 3. Resume
            resume = Resume(
                user_id=user.id,
                filename="Alex_Rivera_FullStack_Resume.pdf",
                file_size_bytes=142800,
                parsing_status="completed",
                raw_text="Alex Rivera | Full Stack Engineer | React, TypeScript, Python, FastAPI, Docker, PostgreSQL, Redis, REST APIs, Microservices, AWS.",
                parsed_skills={
                    "technical_skills": [
                        "React", "TypeScript", "Python", "FastAPI", "PostgreSQL",
                        "Docker", "Redis", "REST APIs", "Microservices", "Git", "TailwindCSS"
                    ],
                    "soft_skills": [
                        "System Architecture Design", "Code Review", "Cross-Functional Collaboration", "Problem Solving"
                    ],
                },
                structured_data={
                    "name": "Alex Rivera",
                    "email": "demo@prepverse.ai",
                    "education": [{"degree": "B.Tech Computer Science", "institution": "State University", "year": "2024"}],
                    "experience": [{"role": "Software Engineering Intern", "company": "TechCorp", "duration": "6 months"}]
                }
            )
            db.add(resume)
            db.flush()

            # 4. Job Analysis
            job = JobAnalysis(
                user_id=user.id,
                resume_id=resume.id,
                role_title="Senior Full-Stack Engineer",
                company_name="Stripe",
                experience_level="mid",
                job_description_raw="We are looking for a Senior Full-Stack Engineer skilled in React, Python, FastAPI, PostgreSQL, Distributed Systems, Kafka, and Kubernetes.",
                extracted_requirements={
                    "required_skills": ["React", "Python", "FastAPI", "PostgreSQL", "Kafka", "Kubernetes", "Distributed Systems"],
                    "preferred_skills": ["TypeScript", "Docker", "Redis"],
                    "experience_years": 3
                },
                match_results={
                    "overall_match_percentage": 82.5,
                    "matched_skills": ["React", "Python", "FastAPI", "PostgreSQL", "TypeScript", "Docker", "Redis"],
                    "missing_skills": ["Kafka", "Kubernetes", "Distributed Systems"],
                    "strengths": ["Strong modern backend & frontend foundation in FastAPI and React"],
                    "recommendations": ["Review Kafka event-driven architectural patterns and Kubernetes pod orchestration"]
                }
            )
            db.add(job)
            db.flush()

            # 5. Completed Interview Session
            now_utc = datetime.datetime.now(datetime.timezone.utc)
            session = InterviewSession(
                user_id=user.id,
                resume_id=resume.id,
                job_analysis_id=job.id,
                role_title="Full-Stack Engineer",
                job_description="Technical simulation assessing FastAPI microservices, React concurrency, and database indexing.",
                status=SessionStatus.COMPLETED,
                question_count=2,
                difficulty=QuestionDifficulty.MEDIUM,
                interview_mode="text",
                is_adaptive=True,
                practice_mode="mock_interview",
                overall_score=86.5,
                communication_score=88.0,
                completed_at=now_utc,
            )
            db.add(session)
            db.flush()

            # 6. Questions & Answers
            q1 = Question(
                session_id=session.id,
                order_index=1,
                type=QuestionType.TECHNICAL,
                difficulty=QuestionDifficulty.MEDIUM,
                question_text="How do database indexes improve query lookup performance, and what are the trade-offs when performing write operations?",
                rubric_criteria="Evaluates understanding of B-Tree indexing, seek vs scan time, and insert/update overhead.",
                target_skill="PostgreSQL Indexing",
            )
            db.add(q1)
            db.flush()

            a1 = Answer(
                question_id=q1.id,
                answer_text="Database indexes (typically B-Trees) provide logarithmic O(log N) lookup times by maintaining sorted references to row locations on disk, drastically reducing full table scans. The trade-off is write overhead: INSERT, UPDATE, and DELETE operations must update both the table data and every relevant index, consuming disk I/O and increasing storage footprint.",
                content_score=90.0,
                communication_score=88.0,
                feedback_text="Excellent explanation covering B-Tree complexity and disk I/O trade-offs.",
                evaluation_status="completed",
                evaluated_at=now_utc,
            )
            db.add(a1)

            q2 = Question(
                session_id=session.id,
                order_index=2,
                type=QuestionType.TECHNICAL,
                difficulty=QuestionDifficulty.HARD,
                question_text="Explain how you prevent Race Conditions when handling concurrent inventory reservations or account balances.",
                rubric_criteria="Assesses concurrency control, pessimistic vs optimistic locking, and distributed synchronization.",
                target_skill="Concurrency Control",
            )
            db.add(q2)
            db.flush()

            a2 = Answer(
                question_id=q2.id,
                answer_text="We can handle concurrent reservations using Pessimistic Locking with SELECT FOR UPDATE at the database transaction level, or Optimistic Locking using version counters. For high-scale distributed setups, a distributed Redis lock with Redlock or atomic Lua scripts can serialize reservations without locking the relational table.",
                content_score=85.0,
                communication_score=86.0,
                feedback_text="Solid answer contrasting optimistic and pessimistic locking with distributed Redis patterns.",
                evaluation_status="completed",
                evaluated_at=now_utc,
            )
            db.add(a2)

            # 7. Roadmap Tasks
            task1 = RoadmapTask(
                user_id=user.id,
                plan_id=plan.id,
                title="Master Kafka Partitioning & Consumer Groups",
                description="Study Kafka topics, partition keys, rebalancing protocols, and consumer lag monitoring.",
                topic="Distributed Systems",
                category="technical",
                priority="high",
                status="completed",
                source="recommended",
                estimated_minutes=45,
                order_index=1,
            )
            task2 = RoadmapTask(
                user_id=user.id,
                plan_id=plan.id,
                title="Kubernetes Pod Networking & Ingress Controllers",
                description="Review Services (ClusterIP, NodePort, LoadBalancer), CoreDNS, and Envoy-based ingress traffic routing.",
                topic="Cloud Infrastructure",
                category="technical",
                priority="medium",
                status="not_started",
                source="recommended",
                estimated_minutes=40,
                order_index=2,
            )
            db.add_all([task1, task2])

            db.commit()
            logger.info("Successfully seeded demo candidate account: demo@prepverse.ai")

    except Exception as exc:
        logger.warning(f"Demo candidate seed note: {exc}")

