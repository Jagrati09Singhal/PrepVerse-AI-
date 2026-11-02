import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.services.skill_assessment_engine import (
    detect_student_year_from_resume,
    generate_skill_assessment_questions,
)
from app.api.admin import (
    authenticate_admin,
    get_admin_overview,
    list_admin_students,
    check_admin_authorization,
    AdminAuthRequest,
)
from app.models.user import User


def test_detect_student_year_from_resume():
    # 1. Test 3rd/4th year detection
    text_3rd = "B.Tech Computer Science student, Expected Graduation: May 2026. Proficient in React and Python."
    res_3rd = detect_student_year_from_resume(text_3rd)
    assert res_3rd["tier_key"] in ("3rd_year", "3rd_4th_year")
    assert "3rd" in res_3rd["tier_label"]

    # 2. Test 1st/2nd year detection
    text_1st = "First year undergraduate student graduating in 2028. Exploring data structures."
    res_1st = detect_student_year_from_resume(text_1st)
    assert res_1st["tier_key"] in ("1st_year", "1st_2nd_year")


def test_generate_skill_assessment_questions_with_weak_skills():
    resume_skills = ["Python", "SQL", "React"]
    weak_skills = ["SQL"]
    ongoing_subjects = ["Operating Systems", "Database Management Systems"]

    questions = generate_skill_assessment_questions(
        resume_skills=resume_skills,
        student_level="3rd_year",
        ongoing_subjects=ongoing_subjects,
        weak_skills=weak_skills,
        question_count=4,
    )

    assert len(questions) == 4
    # The first question should prioritize the weak skill (SQL) for reinforcement
    assert questions[0]["target_skill"] == "SQL"
    assert "rubric_criteria" in questions[0]


def test_admin_auth_direct():
    # Test invalid passcode
    with pytest.raises(HTTPException) as exc_info:
        authenticate_admin(AdminAuthRequest(passcode="wrong_password"))
    assert exc_info.value.status_code == 401

    # Test valid passcode
    resp = authenticate_admin(AdminAuthRequest(passcode="PrepVerseAdmin2026!"))
    assert resp.authorized is True
    assert resp.role == "platform_administrator"

    # Test check_admin_authorization
    assert check_admin_authorization("PrepVerseAdmin2026!") is True
    with pytest.raises(HTTPException):
        check_admin_authorization("invalid_code")

    # Test jagratisinghal9@gmail.com authorization
    admin_resp = authenticate_admin(AdminAuthRequest(email="jagratisinghal9@gmail.com"))
    assert admin_resp.authorized is True
    assert check_admin_authorization(x_admin_email="jagratisinghal9@gmail.com") is True

    # Test unauthorized email rejection
    with pytest.raises(HTTPException) as exc_blocked:
        authenticate_admin(AdminAuthRequest(email="unauthorized_student@gmail.com"))
    assert exc_blocked.value.status_code == 403

    with pytest.raises(HTTPException):
        check_admin_authorization(x_admin_passcode="PrepVerseAdmin2026!", x_admin_email="unauthorized_student@gmail.com")


def test_admin_overview_and_students_direct(db_session: Session):
    # Add a mock user
    u = User(name="Test Candidate", email="candidate@example.com", password_hash="hash")
    db_session.add(u)
    db_session.commit()

    overview = get_admin_overview(db=db_session, authorized=True)
    assert "total_students" in overview
    assert overview["total_students"] >= 1
    assert "cohort_weak_topics" in overview

    students = list_admin_students(db=db_session, authorized=True)
    assert len(students) >= 1
    assert students[0]["email"] == "candidate@example.com"
