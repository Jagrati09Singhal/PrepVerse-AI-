import re
from typing import Dict, List, Any, Optional, Tuple
from app.services.skill_dictionary import (
    SKILL_ALIASES,
    normalize_skill_name,
)


def find_skill_evidence_in_resume(
    canonical_skill: str,
    resume_text: str,
    parsed_resume_skills: List[str],
) -> Tuple[str, Optional[str], str, float]:
    """
    Evaluates evidence of a skill within resume text and parsed skills list.
    Returns:
        (classification, evidence_snippet, explanation, confidence)
        where classification is one of:
        - "evidence_found"
        - "possible_match"
        - "needs_verification"
        - "not_found"
    """
    aliases = SKILL_ALIASES.get(canonical_skill, [canonical_skill.lower()])
    lower_text = resume_text.lower()
    lines = resume_text.split("\n")

    # 1. Direct match in parsed skills list
    direct_skill_match = canonical_skill in parsed_resume_skills

    # 2. Search for exact and alias mentions in raw text
    exact_line_match = None
    alias_line_match = None
    matched_alias = None

    for alias in aliases:
        if alias in ["c++", "c#", ".net"]:
            pattern = r"(?:^|[\s,;:(])" + re.escape(alias) + r"(?:[\s,;:!.)]|$)"
        else:
            pattern = r"\b" + re.escape(alias) + r"\b"

        for line in lines:
            if re.search(pattern, line.lower()):
                snippet = line.strip()[:200]
                if alias == canonical_skill.lower():
                    exact_line_match = snippet
                    break
                elif not alias_line_match:
                    alias_line_match = snippet
                    matched_alias = alias
        if exact_line_match:
            break

    # Classification logic
    if exact_line_match:
        # Check if the mention is substantive vs a bare keyword
        if len(exact_line_match.split()) > 4:
            return (
                "evidence_found",
                exact_line_match,
                f"Direct textual evidence found in resume: '{exact_line_match}'",
                0.95,
            )
        else:
            return (
                "evidence_found",
                exact_line_match,
                f"Direct keyword mention identified in resume: '{exact_line_match}'",
                0.85,
            )

    if direct_skill_match and not exact_line_match:
        return (
            "evidence_found",
            f"Listed under technical skills section as {canonical_skill}.",
            f"The skill '{canonical_skill}' is explicitly included in the candidate's skill inventory.",
            0.85,
        )

    if alias_line_match:
        return (
            "possible_match",
            alias_line_match,
            f"Related term/alias '{matched_alias}' was detected in resume: '{alias_line_match}'. Recommended to verify depth of usage.",
            0.70,
        )

    # Partial context check (e.g. mention without definitive boundary or ambiguous)
    words = canonical_skill.lower().split()
    if len(words) > 1 and any(w in lower_text for w in words if len(w) > 3):
        for line in lines:
            if any(w in line.lower() for w in words if len(w) > 3):
                return (
                    "needs_verification",
                    line.strip()[:200],
                    f"Partial conceptual overlap detected for '{canonical_skill}'. Context is ambiguous and requires candidate verification.",
                    0.50,
                )

    # Not found in resume
    return (
        "not_found",
        None,
        f"No supporting evidence for '{canonical_skill}' was detected in the uploaded resume. Note: This reflects textual absence in the document, not a confirmed lack of candidate competence.",
        0.0,
    )


def calculate_match_coverage(
    skill_matches: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Computes an explainable weighted match percentage.
    Formula:
        Required Skills: 70% weight
        Preferred Skills: 30% weight
        evidence_found = 1.0, possible_match = 0.5, needs_verification = 0.25, not_found = 0.0
    """
    req_skills = [s for s in skill_matches if s["category"] == "required"]
    pref_skills = [s for s in skill_matches if s["category"] == "preferred"]

    def score_group(skills: List[Dict[str, Any]]) -> float:
        if not skills:
            return 1.0  # If no skills in this category, full points
        points = 0.0
        for s in skills:
            status = s["status"]
            if status == "evidence_found":
                points += 1.0
            elif status == "possible_match":
                points += 0.5
            elif status == "needs_verification":
                points += 0.25
        return points / len(skills)

    req_ratio = score_group(req_skills) if req_skills else 1.0
    pref_ratio = score_group(pref_skills) if pref_skills else 1.0

    if req_skills and pref_skills:
        overall_score = (req_ratio * 0.70) + (pref_ratio * 0.30)
    elif req_skills:
        overall_score = req_ratio
    else:
        overall_score = pref_ratio

    overall_pct = round(overall_score * 100, 1)
    req_pct = round(req_ratio * 100, 1)
    pref_pct = round(pref_ratio * 100, 1)

    formula_explanation = (
        "Coverage Score Calculation: Weighted model assigning 70% weight to Required Skills and 30% weight to Preferred Skills. "
        "Scoring values: Evidence Found (100%), Possible Match (50%), Needs Verification (25%), Not Found (0%). "
        "IMPORTANT: This metric quantifies textual keyword alignment between the uploaded resume and the job description. "
        "It does NOT represent a scientifically validated appraisal of overall candidate capability, intellect, or career potential."
    )

    return {
        "overall_coverage_pct": overall_pct,
        "required_coverage_pct": req_pct,
        "preferred_coverage_pct": pref_pct,
        "formula_explanation": formula_explanation,
    }


def generate_gap_recommendations(skill_matches: List[Dict[str, Any]]) -> List[str]:
    """
    Provides targeted recommendations for addressing detected resume gaps.
    """
    recommendations = []
    missing_required = [s["skill"] for s in skill_matches if s["category"] == "required" and s["status"] == "not_found"]
    possible_matches = [s["skill"] for s in skill_matches if s["status"] == "possible_match"]
    missing_preferred = [s["skill"] for s in skill_matches if s["category"] == "preferred" and s["status"] == "not_found"]

    if missing_required:
        top_missing = ", ".join(missing_required[:3])
        recommendations.append(
            f"High Priority: Highlight relevant experience with required skills ({top_missing}) if you have worked with them."
        )

    if possible_matches:
        alias_names = ", ".join(possible_matches[:3])
        recommendations.append(
            f"Clarification Opportunity: Standardize mentions of {alias_names} to match the job description's exact terminology."
        )

    if missing_preferred:
        pref_names = ", ".join(missing_preferred[:3])
        recommendations.append(
            f"Differentiator: If you possess familiarity with preferred tools like {pref_names}, mention related projects or coursework to stand out."
        )

    if not recommendations:
        recommendations.append(
            "Strong Alignment: Your resume demonstrates substantial textual coverage across both required and preferred qualifications."
        )

    return recommendations


def perform_skill_gap_analysis(
    parsed_resume: Dict[str, Any],
    extracted_requirements: Dict[str, Any],
    raw_resume_text: str,
) -> Dict[str, Any]:
    """
    Executes the complete skill matching and gap analysis workflow:
    - Analyzes every required and preferred skill.
    - Classifies evidence into 4 categories.
    - Computes coverage percentages with transparent methodology.
    - Compiles actionable recommendations.
    """
    required_skills = extracted_requirements.get("required_skills", [])
    preferred_skills = extracted_requirements.get("preferred_skills", [])
    resume_skills = parsed_resume.get("skills", {}).get("all_skills", [])

    all_matches = []

    # Match required skills
    for skill in required_skills:
        status, evidence, explanation, confidence = find_skill_evidence_in_resume(
            canonical_skill=skill,
            resume_text=raw_resume_text,
            parsed_resume_skills=resume_skills,
        )
        all_matches.append({
            "skill": skill,
            "category": "required",
            "status": status,
            "has_evidence": status == "evidence_found",
            "evidence": evidence,
            "explanation": explanation,
            "confidence": confidence,
        })

    # Match preferred skills
    for skill in preferred_skills:
        status, evidence, explanation, confidence = find_skill_evidence_in_resume(
            canonical_skill=skill,
            resume_text=raw_resume_text,
            parsed_resume_skills=resume_skills,
        )
        all_matches.append({
            "skill": skill,
            "category": "preferred",
            "status": status,
            "has_evidence": status == "evidence_found",
            "evidence": evidence,
            "explanation": explanation,
            "confidence": confidence,
        })

    coverage = calculate_match_coverage(all_matches)
    recommendations = generate_gap_recommendations(all_matches)

    return {
        "overall_coverage_pct": coverage["overall_coverage_pct"],
        "required_coverage_pct": coverage["required_coverage_pct"],
        "preferred_coverage_pct": coverage["preferred_coverage_pct"],
        "formula_explanation": coverage["formula_explanation"],
        "skill_matches": all_matches,
        "recommendations": recommendations,
        "total_skills_evaluated": len(all_matches),
        "analysis_engine": "deterministic",
    }
