import re
from typing import Dict, List, Any, Set
from app.services.skill_dictionary import (
    SKILL_ALIASES,
    SKILL_CATEGORIES,
    ALIAS_TO_CANONICAL,
    normalize_skill_name,
    get_skill_category,
)

# Common section header patterns in resumes
SECTION_PATTERNS = {
    "experience": r"(?:work\s+experience|professional\s+experience|employment\s+history|experience|internships|work\s+history)",
    "education": r"(?:education|academic\s+background|academic\s+qualifications|degrees|educational\s+background)",
    "skills": r"(?:technical\s+skills|skills\s*(?:&|and)\s*technologies|core\s+competencies|technologies|skills|technical\s+competencies|key\s+skills|areas\s+of\s+expertise|tech\s+stack|programming\s+skills|skills\s+summary|technical\s+proficiency|tools\s*(?:&|and)\s*technologies)",
    "projects": r"(?:personal\s+projects|academic\s+projects|key\s+projects|projects|technical\s+projects)",
    "certifications": r"(?:certifications|licenses\s*(?:&|and)\s*certifications|certificates|professional\s+credentials)",
}

# Degree keywords for education extraction
DEGREE_PATTERNS = [
    r"\b(?:Ph\.?D|Doctor\s+of\s+Philosophy)\b",
    r"\b(?:M\.?S\.?|Master\s+of\s+Science|Master\s+of\s+Arts|M\.?A\.?|MBA|M\.?Tech|MCA)\b",
    r"\b(?:B\.?S\.?|Bachelor\s+of\s+Science|Bachelor\s+of\s+Arts|B\.?A\.?|B\.?E\.?|B\.?Tech|Bachelor\s+of\s+Engineering|BCA|B\.?Sc)\b",
    r"\b(?:Associate\s+Degree|Associate\s+of\s+Science|A\.?S\.?)\b",
]

# Year pattern
YEAR_PATTERN = r"\b(19\d{2}|20\d{2})\b"


def extract_skills_from_text(text: str) -> Dict[str, Any]:
    """
    Scans text for skills using regex boundary matching against the canonical skill dictionary.
    Returns:
        {
            "languages": [...],
            "frameworks": [...],
            "databases": [...],
            "cloud_devops": [...],
            "data_ml": [...],
            "practices": [...],
            "other": [...],
            "all_skills": [...],
            "evidence_snippets": { "Python": "Proficient in Python and FastAPI..." }
        }
    """
    found_canonical: Set[str] = set()
    evidence_snippets: Dict[str, str] = {}
    lower_text = text.lower()

    lines = text.split("\n")

    for canonical, aliases in SKILL_ALIASES.items():
        matched = False
        matched_alias = None

        for alias in aliases:
            escaped_alias = re.escape(alias)
            # Use boundary \b for alphanumeric words, and whitespace/punctuation for symbols
            if alias in ["c++", "c#", ".net"]:
                pattern = r"(?:^|[\s,;:(/])" + escaped_alias + r"(?:[\s,;:!.)/]|$)"
            elif alias in ["c", "r"]:
                # Require explicit programming or language context for single-letter matches
                pattern = r"(?:^|[\s,;:(/])" + escaped_alias + r"(?:[\s,;:!.)/]|$)"
                context_match = (
                    re.search(r"\b" + escaped_alias + r"\s*(?:language|programming|code|\+\+|/c\+\+)\b", lower_text)
                    or re.search(r"(?:languages|skills|programming|tools)[:\s\-]+[^\n]*\b" + escaped_alias + r"\b", lower_text)
                )
                if not context_match:
                    continue
            else:
                pattern = r"\b" + escaped_alias + r"\b"

            match = re.search(pattern, lower_text)
            if match:
                matched = True
                matched_alias = alias
                found_canonical.add(canonical)
                break

        if matched and matched_alias:
            # Find evidence line in resume
            for line in lines:
                if re.search(r"\b" + re.escape(matched_alias) + r"\b", line.lower()) or matched_alias in line.lower():
                    snippet = line.strip()
                    if snippet and len(snippet) > 5:
                        evidence_snippets[canonical] = snippet[:200]
                        break

    # Group into categories
    categorized: Dict[str, List[str]] = {
        "languages": [],
        "frameworks": [],
        "databases": [],
        "cloud_devops": [],
        "data_ml": [],
        "practices": [],
        "other": [],
    }

    for skill in sorted(found_canonical):
        cat = SKILL_CATEGORIES.get(skill, "other")
        if cat in categorized:
            categorized[cat].append(skill)
        else:
            categorized["other"].append(skill)

    categorized["all_skills"] = sorted(list(found_canonical))
    categorized["evidence_snippets"] = evidence_snippets

    return categorized


def segment_resume_sections(text: str) -> Dict[str, str]:
    """
    Segments the resume text into named sections based on header patterns.
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "header": [],
        "experience": [],
        "education": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "other": [],
    }

    current_section = "header"

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line matches a known section header (< 55 chars)
        matched_new_section = None
        if len(stripped) < 55:
            clean_heading = re.sub(r"[:\-_#*•]", "", stripped).strip().lower()
            for sec_name, pattern in SECTION_PATTERNS.items():
                if re.fullmatch(pattern, clean_heading, re.IGNORECASE):
                    matched_new_section = sec_name
                    break

        if matched_new_section:
            current_section = matched_new_section
        else:
            sections[current_section].append(stripped)

    return {k: "\n".join(v) for k, v in sections.items()}


def extract_education_details(education_text: str) -> List[Dict[str, Any]]:
    """Extracts degree and year details from the education section."""
    results = []
    lines = education_text.split("\n")

    for line in lines:
        for degree_pat in DEGREE_PATTERNS:
            match = re.search(degree_pat, line, re.IGNORECASE)
            if match:
                degree = match.group(0).strip()
                # Search for graduation year
                year_match = re.search(YEAR_PATTERN, line)
                year = year_match.group(0) if year_match else None

                results.append({
                    "degree": degree,
                    "raw_entry": line.strip()[:200],
                    "year": year,
                    "is_inferred": False,
                })
                break

    return results


def extract_experience_entries(experience_text: str) -> List[Dict[str, Any]]:
    """Identifies work experience snippets and role titles."""
    results = []
    lines = experience_text.split("\n")

    role_patterns = [
        r"\b(?:Software Engineer|Developer|Backend Engineer|Frontend Engineer|Full Stack Developer|Data Scientist|DevOps Engineer|Architect|Intern|Engineering Lead|Analyst|Consultant|Manager)\b"
    ]

    for line in lines:
        for pat in role_patterns:
            if re.search(pat, line, re.IGNORECASE):
                years = re.findall(YEAR_PATTERN, line)
                duration = " - ".join(years) if len(years) >= 2 else (years[0] if years else None)
                results.append({
                    "role_headline": line.strip()[:150],
                    "duration": duration,
                    "is_inferred": False,
                })
                break

    return results


def parse_resume_content(raw_text: str) -> Dict[str, Any]:
    """
    Main parsing pipeline:
    Analyzes raw resume text and extracts categorized skills, education, experience,
    and metadata while distinguishing directly extracted from inferred content.
    """
    if not raw_text or not raw_text.strip():
        return {
            "skills": {"all_skills": [], "languages": [], "frameworks": [], "databases": [], "cloud_devops": [], "data_ml": [], "practices": [], "other": []},
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "metadata": {"has_extractable_content": False},
        }

    skills_data = extract_skills_from_text(raw_text)
    sections = segment_resume_sections(raw_text)

    # Secondary extraction: directly inspect the Skills section for comma/bullet-delimited skills
    skills_section_text = sections.get("skills", "")
    if skills_section_text:
        existing_skills_lower = {s.lower() for s in skills_data.get("all_skills", [])}
        for line in skills_section_text.split("\n"):
            # Strip common prefix labels (e.g. "Languages:", "Web Tech:")
            cleaned_line = re.sub(
                r"^(?:languages|frameworks|technologies|tools|databases|core competencies|competencies|technical skills|other|platforms)[:\s\-]+",
                "",
                line,
                flags=re.IGNORECASE,
            ).strip()

            items = re.split(r"[,;|•·/]", cleaned_line)
            for item in items:
                tok = item.strip()
                if 2 <= len(tok) <= 30 and not re.search(r"^\d+$", tok):
                    canonical_name = normalize_skill_name(tok)
                    # If it matches an alias or is capitalized
                    if canonical_name.lower() in ALIAS_TO_CANONICAL:
                        target_name = ALIAS_TO_CANONICAL[canonical_name.lower()]
                    elif tok[0].isupper() and len(tok.split()) <= 3:
                        target_name = tok
                    else:
                        continue

                    if target_name.lower() not in existing_skills_lower:
                        existing_skills_lower.add(target_name.lower())
                        skills_data["all_skills"].append(target_name)
                        cat = get_skill_category(target_name)
                        if cat in skills_data:
                            skills_data[cat].append(target_name)
                        else:
                            skills_data["other"].append(target_name)

    education_entries = extract_education_details(sections.get("education", "") or raw_text)
    experience_entries = extract_experience_entries(sections.get("experience", "") or raw_text)

    # Basic project snippets
    projects_text = sections.get("projects", "")
    project_entries = []
    if projects_text:
        for p_line in projects_text.split("\n")[:6]:
            if len(p_line.strip()) > 10:
                project_entries.append({
                    "title": p_line.strip()[:120],
                    "is_inferred": False,
                })

    # Basic certifications
    cert_text = sections.get("certifications", "")
    cert_entries = []
    if cert_text:
        for c_line in cert_text.split("\n")[:5]:
            if len(c_line.strip()) > 5:
                cert_entries.append({
                    "title": c_line.strip()[:120],
                    "is_inferred": False,
                })

    skills_data["all_skills"] = sorted(list(set(skills_data.get("all_skills", []))))

    return {
        "skills": skills_data,
        "education": education_entries,
        "experience": experience_entries,
        "projects": project_entries,
        "certifications": cert_entries,
        "metadata": {
            "has_extractable_content": True,
            "total_skills_detected": len(skills_data.get("all_skills", [])),
            "sections_detected": [sec for sec, content in sections.items() if len(content) > 0],
            "word_count": len(raw_text.split()),
        },
    }
