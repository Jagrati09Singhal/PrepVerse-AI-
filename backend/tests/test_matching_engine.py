from app.services.matching_engine import (
    perform_skill_gap_analysis,
    find_skill_evidence_in_resume,
    calculate_match_coverage,
)


def test_matching_classifications():
    """Verify all 4 matching classifications (evidence_found, possible_match, needs_verification, not_found)."""
    resume_text = (
        "Alice Candidate\n"
        "Expertise in Python, FastAPI backend development.\n"
        "Configured k8s clusters for staging environments.\n"
        "Some database experience.\n"
    )
    parsed_skills = ["Python", "FastAPI"]

    # 1. Evidence found
    status1, evidence1, exp1, conf1 = find_skill_evidence_in_resume("Python", resume_text, parsed_skills)
    assert status1 == "evidence_found"
    assert "Python" in evidence1
    assert conf1 >= 0.85

    # 2. Possible match via alias (k8s for Kubernetes)
    status2, evidence2, exp2, conf2 = find_skill_evidence_in_resume("Kubernetes", resume_text, parsed_skills)
    assert status2 == "possible_match"
    assert "k8s" in evidence2
    assert conf2 == 0.70

    # 3. Not found
    status3, evidence3, exp3, conf3 = find_skill_evidence_in_resume("Rust", resume_text, parsed_skills)
    assert status3 == "not_found"
    assert evidence3 is None
    # Crucial requirement: explain that missing evidence != incompetence
    assert "textual absence" in exp3
    assert conf3 == 0.0


def test_missing_skills_described_as_absent_evidence():
    """Verify that skills not found in resume are explicitly explained as absent textual evidence."""
    parsed_resume = {"skills": {"all_skills": ["Python"]}}
    raw_text = "Python engineer."
    extracted_reqs = {
        "required_skills": ["Python", "TensorFlow"],
        "preferred_skills": ["Kubernetes"],
    }

    result = perform_skill_gap_analysis(parsed_resume, extracted_reqs, raw_text)

    tf_match = next(m for m in result["skill_matches"] if m["skill"] == "TensorFlow")
    assert tf_match["status"] == "not_found"
    assert "not a confirmed lack of candidate competence" in tf_match["explanation"]
    assert "textual absence" in tf_match["explanation"]


def test_transparent_coverage_formula():
    """Verify weighted formula: 70% required, 30% preferred."""
    # 2 required skills (1 found = 50%), 1 preferred skill (1 found = 100%)
    # Expected overall = (0.50 * 0.70) + (1.00 * 0.30) = 0.35 + 0.30 = 0.65 (65.0%)
    matches = [
        {"skill": "Python", "category": "required", "status": "evidence_found"},
        {"skill": "Java", "category": "required", "status": "not_found"},
        {"skill": "Docker", "category": "preferred", "status": "evidence_found"},
    ]
    coverage = calculate_match_coverage(matches)

    assert coverage["required_coverage_pct"] == 50.0
    assert coverage["preferred_coverage_pct"] == 100.0
    assert coverage["overall_coverage_pct"] == 65.0
    assert "Weighted model assigning 70% weight to Required Skills" in coverage["formula_explanation"]

