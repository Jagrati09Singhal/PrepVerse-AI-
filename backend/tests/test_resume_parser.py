from app.services.resume_parser import parse_resume_content
from app.services.skill_dictionary import normalize_skill_name, get_skill_category


def test_skill_normalization_and_aliases():
    """Verify alias normalization across canonical skills."""
    assert normalize_skill_name("sklearn") == "Scikit-Learn"
    assert normalize_skill_name("scikit-learn") == "Scikit-Learn"
    assert normalize_skill_name("k8s") == "Kubernetes"
    assert normalize_skill_name("postgres") == "PostgreSQL"
    assert normalize_skill_name("psql") == "PostgreSQL"
    assert normalize_skill_name("node.js") == "Node.js"
    assert normalize_skill_name("nodejs") == "Node.js"
    assert normalize_skill_name("ts") == "TypeScript"
    assert normalize_skill_name("js") == "JavaScript"
    assert normalize_skill_name("reactjs") == "React"


def test_skill_categorization():
    """Verify that skills map to accurate technical domains."""
    assert get_skill_category("Python") == "languages"
    assert get_skill_category("React") == "frameworks"
    assert get_skill_category("PostgreSQL") == "databases"
    assert get_skill_category("Kubernetes") == "cloud_devops"
    assert get_skill_category("PyTorch") == "data_ml"
    assert get_skill_category("System Design") == "practices"


def test_resume_parser_structured_sections():
    """Verify extraction of skills, education, and experience from a structured resume."""
    resume_text = (
        "BOB BUILDER\n"
        "bob@example.com | San Francisco, CA\n\n"
        "EDUCATION\n"
        "Stanford University\n"
        "Master of Science in Electrical Engineering, 2020\n\n"
        "SKILLS\n"
        "Languages: Python, Go, TypeScript, SQL\n"
        "Frameworks: FastAPI, Django, React\n"
        "Infrastructure: Docker, Kubernetes, AWS, Terraform\n\n"
        "EXPERIENCE\n"
        "Lead Backend Engineer, CloudScale (2020 - 2024)\n"
        "• Architected distributed systems handling 100M events per day.\n"
        "• Implemented unit testing with pytest and automated CI/CD pipelines.\n\n"
        "CERTIFICATIONS\n"
        "AWS Certified Solutions Architect\n"
    )

    parsed = parse_resume_content(resume_text)

    # Skills verification
    all_skills = parsed["skills"]["all_skills"]
    assert "Python" in all_skills
    assert "FastAPI" in all_skills
    assert "Docker" in all_skills
    assert "Kubernetes" in all_skills
    assert "AWS" in all_skills
    assert "Unit Testing" in all_skills

    # Category verification
    assert "Python" in parsed["skills"]["languages"]
    assert "FastAPI" in parsed["skills"]["frameworks"]
    assert "Docker" in parsed["skills"]["cloud_devops"]

    # Education verification
    edu = parsed["education"]
    assert len(edu) >= 1
    assert "Master of Science" in edu[0]["degree"]
    assert edu[0]["year"] == "2020"

    # Experience verification
    exp = parsed["experience"]
    assert len(exp) >= 1
    assert "Lead Backend Engineer" in exp[0]["role_headline"]

    # Certifications verification
    certs = parsed["certifications"]
    assert len(certs) >= 1
    assert "AWS Certified Solutions Architect" in certs[0]["title"]

    # Metadata
    assert parsed["metadata"]["has_extractable_content"] is True
    assert parsed["metadata"]["total_skills_detected"] > 5

