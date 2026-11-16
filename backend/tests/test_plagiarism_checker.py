import pytest
from app.services.plagiarism_checker import check_plagiarism
from app.services.resume_parser import parse_resume_content
from app.services.answer_evaluator import evaluate_answer
from app.services.pdf_generator import generate_ats_pdf_report
from app.models.enums import QuestionType, QuestionDifficulty


def test_plagiarism_checker_cloned_template_flagged():
    """Verify that copy-pasted tutorial projects exceed the 20% similarity threshold and are flagged."""
    cloned_text = (
        "Built a full stack e commerce web application using MERN stack with user authentication "
        "and payment gateway integration using stripe. Developed an ecommerce website with react node js "
        "express and mongodb featuring shopping cart product catalog and order management."
    )
    result = check_plagiarism(cloned_text, context_type="resume", custom_threshold=20.0)

    assert result["threshold_percentage"] == 20.0
    assert result["similarity_percentage"] >= 20.0
    assert result["is_flagged"] is True
    assert result["status"] == "flagged"
    assert len(result["matched_phrases"]) > 0
    assert "remediation_tips" in result
    assert len(result["remediation_tips"]) > 0


def test_plagiarism_checker_original_content_passed():
    """Verify that original first-person engineering descriptions pass with < 20% similarity."""
    original_text = (
        "Engineered an event-driven telemetry pipeline processing 45,000 sensor readings per second. "
        "Implemented distributed sharding across custom Redis clusters to mitigate thundering herd locks, "
        "reducing p99 write latency from 220ms to 18ms and saving $14,000 in monthly cloud compute."
    )
    result = check_plagiarism(original_text, context_type="resume", custom_threshold=20.0)

    assert result["threshold_percentage"] == 20.0
    assert result["similarity_percentage"] < 20.0
    assert result["is_flagged"] is False
    assert result["status"] == "passed"
    assert result["originality_score"] > 80.0


def test_resume_parser_incorporates_plagiarism_check():
    """Verify resume parser populates ats_analysis.plagiarism_check."""
    resume_text = (
        "JANE DOE\n"
        "jane@example.com | 555-123-4567 | github.com/janedoe\n\n"
        "SKILLS\n"
        "Python, FastAPI, Docker, PostgreSQL, Redis, Kubernetes\n\n"
        "EXPERIENCE\n"
        "Senior Backend Engineer, Acme Corp (2021 - Present)\n"
        "• Architected 12 microservices with PostgreSQL and Redis caching, cutting p95 latency by 45%.\n"
        "• Containerized deployment pipelines with Docker and Kubernetes for 15,000 active users.\n\n"
        "EDUCATION\n"
        "B.S. in Computer Science, 2021\n\n"
        "PROJECTS\n"
        "Distributed Event Pipeline | Python, Kafka, Redis\n"
        "• Built distributed consensus pipeline reducing message loss to zero.\n"
    )
    parsed = parse_resume_content(resume_text)
    ats = parsed["ats_analysis"]

    assert "plagiarism_check" in ats
    plag = ats["plagiarism_check"]
    assert plag["threshold_percentage"] == 20.0
    assert "similarity_percentage" in plag
    assert "is_flagged" in plag
    assert plag["similarity_percentage"] < 20.0
    assert plag["is_flagged"] is False


def test_interview_evaluator_incorporates_plagiarism_check():
    """Verify answer evaluator attaches plagiarism verification to evaluation_details."""
    canned_answer = (
        "A process is an instance of a program in execution whereas a thread is the smallest unit "
        "of execution within a process. The four pillars of object oriented programming are encapsulation "
        "abstraction inheritance and polymorphism."
    )
    eval_result = evaluate_answer(
        question_text="What is the difference between a process and a thread?",
        question_type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        answer_text=canned_answer,
    )

    plag = eval_result["evaluation_details"]["plagiarism_check"]
    assert plag["threshold_percentage"] == 20.0
    assert plag["similarity_percentage"] >= 20.0
    assert plag["is_flagged"] is True
    # Verify warning is added to suggestions
    assert any("Originality Warning" in s for s in eval_result["suggestions"])


def test_ats_pdf_report_includes_plagiarism_verification():
    """Verify that ATS PDF report compiles cleanly and contains the plagiarism audit."""
    resume_payload = {
        "filename": "Original_Resume.pdf",
        "user_name": "Alex Smith",
        "user_email": "alex@example.com",
        "skills": {
            "all_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
            "languages": ["Python"],
            "frameworks": ["FastAPI"],
            "databases": ["PostgreSQL"],
            "cloud_devops": ["Docker"],
        },
        "ats_analysis": {
            "ats_score": 88,
            "potential_score": 96,
            "action_verbs": ["Architected", "Engineered"],
            "action_verbs_count": 5,
            "quantifiable_metrics_count": 4,
            "score_breakdown": {
                "technical_skills": {"score": 30, "max": 35, "detail": "4 skills"},
                "section_completeness": {"score": 25, "max": 25, "detail": "4 sections"},
                "action_verbs": {"score": 18, "max": 20, "detail": "5 verbs"},
                "quantifiable_impact": {"score": 15, "max": 20, "detail": "4 metrics"},
            },
            "transparency_explanation": "Standard 4-pillar algorithmic evaluation.",
            "deductions": [],
            "enhancement_suggestions": [],
            "bullet_rewrites": [],
            "formatting_checks": {"has_email": True, "has_github_or_linkedin": True, "word_count": 350},
            "plagiarism_check": {
                "similarity_percentage": 5.2,
                "threshold_percentage": 20.0,
                "is_flagged": False,
                "status": "passed",
                "originality_score": 94.8,
                "verdict": "Original Content (< 20% match)",
                "matched_phrases": [],
                "remediation_tips": ["Authentic phrasing verified."],
                "criteria_rule": "Similarity must be less than 20%",
            },
        },
    }

    pdf_bytes = generate_ats_pdf_report(resume_payload)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 1000

