import io
import uuid
import pymupdf
import pytest
from fastapi import HTTPException, status
from starlette.datastructures import UploadFile
from sqlalchemy.orm import Session

from app.models.user import User
from app.api.resumes import upload_resume, list_resumes, get_resume, delete_resume
from app.api.job_analyses import (
    create_job_analysis,
    list_job_analyses,
    get_job_analysis,
    delete_job_analysis,
)
from app.schemas.job_analysis import JobAnalysisCreateRequest


def create_test_pdf(text: str) -> bytes:
    """Helper to generate in-memory PDF bytes."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def make_upload_file(pdf_bytes: bytes, filename: str = "resume.pdf") -> UploadFile:
    """Wraps bytes in a Starlette UploadFile."""
    return UploadFile(
        file=io.BytesIO(pdf_bytes),
        filename=filename,
        headers={"content-type": "application/pdf"},
    )


def test_upload_and_retrieve_resume(db_session: Session):
    """Verify resume upload, text extraction, structured parsing, and retrieval."""
    user = User(name="Candidate One", email="c1@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    resume_text = (
        "Alice Candidate\n"
        "Senior Software Engineer\n\n"
        "EDUCATION\n"
        "University of California, Berkeley\n"
        "Bachelor of Science in Computer Science, 2021\n\n"
        "SKILLS\n"
        "Python, FastAPI, React, PostgreSQL, Docker, AWS\n\n"
        "EXPERIENCE\n"
        "Software Engineer at Acme Corp (2021 - 2024)\n"
        "Built microservices with FastAPI and PostgreSQL."
    )
    pdf_bytes = create_test_pdf(resume_text)
    upload_file = make_upload_file(pdf_bytes, filename="alice_resume.pdf")

    # 1. Upload resume
    created = upload_resume(file=upload_file, current_user=user, db=db_session)

    assert created.id is not None
    assert created.user_id == user.id
    assert created.filename == "alice_resume.pdf"
    assert created.parsing_status == "completed"
    assert "FastAPI" in created.parsed_skills.get("all_skills", [])
    assert "PostgreSQL" in created.parsed_skills.get("all_skills", [])

    # 2. Get resume
    fetched = get_resume(resume_id=created.id, current_user=user, db=db_session)
    assert fetched.id == created.id
    assert fetched.filename == "alice_resume.pdf"

    # 3. List resumes
    user_resumes = list_resumes(current_user=user, db=db_session)
    assert len(user_resumes) == 1
    assert user_resumes[0].id == created.id
    assert user_resumes[0].total_skills >= 5


def test_resume_cross_user_isolation(db_session: Session):
    """Verify that User B cannot view, list, or delete User A's resume."""
    user_a = User(name="User Alpha", email="alpha@example.com", password_hash="hash")
    user_b = User(name="User Beta", email="beta@example.com", password_hash="hash")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    pdf_bytes = create_test_pdf("Alpha Resume content with Python and Docker.")
    upload_file = make_upload_file(pdf_bytes, "alpha.pdf")
    resume_a = upload_resume(file=upload_file, current_user=user_a, db=db_session)

    # User B list: should be empty
    user_b_resumes = list_resumes(current_user=user_b, db=db_session)
    assert len(user_b_resumes) == 0

    # User B get resume A: must return 404
    with pytest.raises(HTTPException) as exc_get:
        get_resume(resume_id=resume_a.id, current_user=user_b, db=db_session)
    assert exc_get.value.status_code == status.HTTP_404_NOT_FOUND

    # User B delete resume A: must return 404
    with pytest.raises(HTTPException) as exc_del:
        delete_resume(resume_id=resume_a.id, current_user=user_b, db=db_session)
    assert exc_del.value.status_code == status.HTTP_404_NOT_FOUND

    # User A delete resume A: must succeed
    delete_resume(resume_id=resume_a.id, current_user=user_a, db=db_session)
    assert len(list_resumes(current_user=user_a, db=db_session)) == 0


def test_create_and_retrieve_job_analysis(db_session: Session):
    """Verify job description analysis creation, skill gap scoring, and retrieval."""
    user = User(name="Analyst Candidate", email="analyst@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    pdf_bytes = create_test_pdf("Python backend engineer with FastAPI and Docker experience.")
    upload_file = make_upload_file(pdf_bytes, "analyst.pdf")
    resume = upload_resume(file=upload_file, current_user=user, db=db_session)

    jd_text = (
        "Role: Backend Engineer\n\n"
        "Requirements:\n"
        "- Experience in Python and FastAPI.\n"
        "- Experience with PostgreSQL.\n\n"
        "Preferred:\n"
        "- Experience with Docker and AWS.\n"
    )

    req = JobAnalysisCreateRequest(
        resume_id=resume.id,
        job_description_raw=jd_text,
        role_title="Backend Engineer",
        company_name="CloudTech",
        experience_level="Mid-Level",
    )

    # 1. Create analysis
    analysis = create_job_analysis(payload=req, current_user=user, db=db_session)

    assert analysis.id is not None
    assert analysis.resume_id == resume.id
    assert analysis.role_title == "Backend Engineer"
    assert "overall_coverage_pct" in analysis.match_results
    assert len(analysis.match_results["skill_matches"]) > 0

    # 2. Get analysis
    fetched = get_job_analysis(analysis_id=analysis.id, current_user=user, db=db_session)
    assert fetched.id == analysis.id
    assert fetched.company_name == "CloudTech"

    # 3. List analyses
    analyses_list = list_job_analyses(current_user=user, db=db_session)
    assert len(analyses_list) == 1
    assert analyses_list[0].id == analysis.id


def test_job_analysis_cross_user_resume_attack(db_session: Session):
    """
    Verify security protection:
    User B attempts to create a job analysis referencing User A's resume ID.
    Must be rejected with 404 (preventing cross-tenant resume data leakage).
    """
    user_a = User(name="User A", email="a@example.com", password_hash="hash")
    user_b = User(name="User B", email="b@example.com", password_hash="hash")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    pdf_bytes = create_test_pdf("User A secret resume content.")
    upload_file = make_upload_file(pdf_bytes, "secret_a.pdf")
    resume_a = upload_resume(file=upload_file, current_user=user_a, db=db_session)

    # User B attempts to analyze User A's resume
    req = JobAnalysisCreateRequest(
        resume_id=resume_a.id,
        job_description_raw="We need a Python engineer with 5 years experience.",
    )

    with pytest.raises(HTTPException) as exc_info:
        create_job_analysis(payload=req, current_user=user_b, db=db_session)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert "not found or does not belong to the current user" in exc_info.value.detail


def test_job_analysis_cross_user_isolation(db_session: Session):
    """Verify that User B cannot view or delete User A's job analysis."""
    user_a = User(name="User A", email="ua@example.com", password_hash="hash")
    user_b = User(name="User B", email="ub@example.com", password_hash="hash")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    pdf_bytes = create_test_pdf("User A resume with Python.")
    upload_file = make_upload_file(pdf_bytes, "ua.pdf")
    resume_a = upload_resume(file=upload_file, current_user=user_a, db=db_session)

    req = JobAnalysisCreateRequest(
        resume_id=resume_a.id,
        job_description_raw="Python engineer with Docker experience.",
    )
    analysis_a = create_job_analysis(payload=req, current_user=user_a, db=db_session)

    # User B get analysis A: must return 404
    with pytest.raises(HTTPException) as exc_get:
        get_job_analysis(analysis_id=analysis_a.id, current_user=user_b, db=db_session)
    assert exc_get.value.status_code == status.HTTP_404_NOT_FOUND

    # User B delete analysis A: must return 404
    with pytest.raises(HTTPException) as exc_del:
        delete_job_analysis(analysis_id=analysis_a.id, current_user=user_b, db=db_session)
    assert exc_del.value.status_code == status.HTTP_404_NOT_FOUND

