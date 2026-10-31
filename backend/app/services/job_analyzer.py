import re
from typing import Dict, List, Any, Set, Tuple
from app.services.skill_dictionary import (
    SKILL_ALIASES,
    SKILL_CATEGORIES,
    normalize_skill_name,
)

# Headers indicating required skills/qualifications
REQUIRED_SECTION_HEADERS = [
    r"(?:basic\s+qualifications|minimum\s+qualifications|requirements|must\s+have|what\s+you\s+need|what\s+we\s+are\s+looking\s+for|role\s+requirements|required\s+skills)",
]

# Headers indicating preferred or optional qualifications
PREFERRED_SECTION_HEADERS = [
    r"(?:preferred\s+qualifications|nice\s+to\s+have|bonus\s+points|bonus|plus|what\s+would\s+be\s+great|preferred\s+skills|desired\s+skills)",
]

# Headers indicating responsibilities
RESPONSIBILITY_SECTION_HEADERS = [
    r"(?:responsibilities|what\s+you\s+will\s+do|duties|the\s+role|key\s+responsibilities)",
]


def segment_job_description_sections(text: str) -> Dict[str, str]:
    """
    Splits job description into functional sections:
    'required', 'preferred', 'responsibilities', and 'general'.
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "required": [],
        "preferred": [],
        "responsibilities": [],
        "general": [],
    }

    current_section = "general"

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line looks like a section header (usually < 50 chars, no sentence ending)
        if len(stripped) < 55:
            clean = re.sub(r"[:\-_#*]", "", stripped).strip().lower()
            matched = False

            for pat in PREFERRED_SECTION_HEADERS:
                if re.fullmatch(pat, clean, re.IGNORECASE) or clean.startswith("preferred") or clean.startswith("nice to have"):
                    current_section = "preferred"
                    matched = True
                    break

            if not matched:
                for pat in REQUIRED_SECTION_HEADERS:
                    if re.fullmatch(pat, clean, re.IGNORECASE) or clean.startswith("require") or clean.startswith("must have"):
                        current_section = "required"
                        matched = True
                        break

            if not matched:
                for pat in RESPONSIBILITY_SECTION_HEADERS:
                    if re.fullmatch(pat, clean, re.IGNORECASE) or clean.startswith("responsibilit"):
                        current_section = "responsibilities"
                        matched = True
                        break

            if matched:
                continue

        sections[current_section].append(stripped)

    return {k: "\n".join(v) for k, v in sections.items()}


def extract_skills_from_text_block(text: str) -> Set[str]:
    """Extracts canonical skill names from a specific text block."""
    found: Set[str] = set()
    lower_text = text.lower()

    for canonical, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            if alias in ["c++", "c#", ".net"]:
                pattern = r"(?:^|[\s,;:(])" + re.escape(alias) + r"(?:[\s,;:!.)]|$)"
            else:
                pattern = r"\b" + re.escape(alias) + r"\b"

            if re.search(pattern, lower_text):
                found.add(canonical)
                break

    return found


def extract_experience_years(text: str) -> List[str]:
    """Extracts years of experience mentioned (e.g. '3+ years', '5-7 years')."""
    pattern = r"\b(\d{1,2}\s*(?:\+|-\s*\d{1,2})?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?)\b"
    matches = re.findall(pattern, text, re.IGNORECASE)
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for m in matches:
        clean = m.strip().lower()
        if clean not in seen:
            seen.add(clean)
            unique.append(m.strip())
    return unique


def analyze_job_description_content(
    job_description_raw: str,
    role_title: str = None,
    company_name: str = None,
    experience_level: str = None,
) -> Dict[str, Any]:
    """
    Parses and categorizes job description requirements:
    - required_skills
    - preferred_skills
    - tools_and_technologies
    - responsibilities
    - experience_years
    - education_requirements
    """
    if not job_description_raw or not job_description_raw.strip():
        raise ValueError("Job description text cannot be empty.")

    sections = segment_job_description_sections(job_description_raw)

    # 1. Skills in 'preferred' section
    preferred_skills = extract_skills_from_text_block(sections.get("preferred", ""))

    # 2. Skills in 'required' section
    required_skills = extract_skills_from_text_block(sections.get("required", ""))

    # 3. Skills in general/responsibilities sections
    general_skills = extract_skills_from_text_block(
        sections.get("general", "") + "\n" + sections.get("responsibilities", "")
    )

    # If no separate required/preferred sections were detected (flat format),
    # treat skills mentioned in general text as required, unless marked with modal 'bonus/preferred'
    if not required_skills and not preferred_skills:
        # Check modal sentences for preferred skills
        sentences = re.split(r"[.\n;]", job_description_raw)
        for sentence in sentences:
            sent_lower = sentence.lower()
            sent_skills = extract_skills_from_text_block(sentence)
            if any(term in sent_lower for term in ["plus", "preferred", "bonus", "nice to have", "ideal"]):
                preferred_skills.update(sent_skills)
            else:
                required_skills.update(sent_skills)
    else:
        # Assign remaining skills from general text
        for s in general_skills:
            if s not in preferred_skills and s not in required_skills:
                required_skills.add(s)

    # Ensure no overlap: if skill is in both, required takes precedence
    preferred_skills = preferred_skills - required_skills

    all_tools = sorted(list(required_skills | preferred_skills))

    # Extract bullet points from responsibilities
    responsibilities = []
    resp_text = sections.get("responsibilities", "") or sections.get("general", "")
    for line in resp_text.split("\n"):
        stripped = line.strip()
        if stripped.startswith(("•", "-", "*")) or len(stripped) > 40:
            if len(stripped) > 15:
                responsibilities.append(stripped.lstrip("•-* ").strip())

    # Extract education requirements
    edu_mentions = []
    edu_patterns = [
        r"\b(?:Bachelor['’]?s?|Master['’]?s?|Ph\.?D|BS|MS|B\.?Tech|Computer\s+Science|Engineering|related\s+field)\b[^\n.]{0,60}"
    ]
    for line in job_description_raw.split("\n"):
        for ep in edu_patterns:
            if re.search(ep, line, re.IGNORECASE):
                edu_mentions.append(line.strip())
                break

    return {
        "role_title": role_title,
        "company_name": company_name,
        "experience_level": experience_level,
        "required_skills": sorted(list(required_skills)),
        "preferred_skills": sorted(list(preferred_skills)),
        "tools_and_technologies": all_tools,
        "responsibilities": responsibilities[:10],
        "experience_years": extract_experience_years(job_description_raw),
        "education_requirements": edu_mentions[:4],
        "sections_found": [k for k, v in sections.items() if len(v) > 0],
    }
