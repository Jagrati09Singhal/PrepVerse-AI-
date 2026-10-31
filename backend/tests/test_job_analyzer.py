from app.services.job_analyzer import analyze_job_description_content


def test_job_analyzer_required_vs_preferred():
    """Verify distinct separation between required and preferred qualifications."""
    jd_text = (
        "Role: Senior Backend Engineer\n\n"
        "Requirements:\n"
        "- 4+ years of professional software engineering.\n"
        "- Strong proficiency in Python and FastAPI.\n"
        "- Demonstrated experience with PostgreSQL.\n\n"
        "Preferred Qualifications:\n"
        "- Experience with Docker and Kubernetes.\n"
        "- Familiarity with AWS and Redis is a plus.\n"
    )

    analysis = analyze_job_description_content(
        jd_text,
        role_title="Senior Backend Engineer",
        company_name="Cloud Corp",
        experience_level="Senior",
    )

    assert analysis["role_title"] == "Senior Backend Engineer"
    assert analysis["company_name"] == "Cloud Corp"

    # Required skills
    assert "Python" in analysis["required_skills"]
    assert "FastAPI" in analysis["required_skills"]
    assert "PostgreSQL" in analysis["required_skills"]

    # Preferred skills
    assert "Docker" in analysis["preferred_skills"]
    assert "Kubernetes" in analysis["preferred_skills"]
    assert "AWS" in analysis["preferred_skills"]
    assert "Redis" in analysis["preferred_skills"]

    # Ensure no duplicate overlap between required and preferred
    overlap = set(analysis["required_skills"]).intersection(set(analysis["preferred_skills"]))
    assert len(overlap) == 0

    # Experience years
    assert len(analysis["experience_years"]) > 0
    assert "4+ years of" in analysis["experience_years"][0]


def test_job_analyzer_flat_format():
    """Verify analysis handles unstructured or flat job descriptions without formal headers."""
    flat_jd = (
        "We are looking for a Python developer who knows Django and React. "
        "Must have experience with SQL and Git. "
        "Knowledge of Docker and AWS is a plus."
    )

    analysis = analyze_job_description_content(flat_jd)

    assert "Python" in analysis["required_skills"]
    assert "Django" in analysis["required_skills"]
    assert "React" in analysis["required_skills"]
    assert "Docker" in analysis["preferred_skills"] or "Docker" in analysis["required_skills"]
    assert len(analysis["tools_and_technologies"]) >= 4

