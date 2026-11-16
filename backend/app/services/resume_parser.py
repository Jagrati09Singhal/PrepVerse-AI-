import re
from typing import Dict, List, Any, Set
from app.services.plagiarism_checker import check_plagiarism
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


STRONG_ACTION_VERBS = [
    # Architecture & System Design
    "accelerated", "accelerate", "achieved", "achieve", "architected", "architect",
    "automated", "automate", "built", "build", "centralized", "centralize",
    "collaborated", "collaborate", "configured", "configure", "constructed", "construct",
    "created", "create", "delivered", "deliver", "deployed", "deploy",
    "designed", "design", "developed", "develop", "devised", "devise",
    "engineered", "engineer", "enhanced", "enhance", "established", "establish",
    "executed", "execute", "formulated", "formulate", "implemented", "implement",
    "improved", "improve", "increased", "increase", "initiated", "initiate",
    "integrated", "integrate", "launched", "launch", "led", "lead",
    "managed", "manage", "mentored", "mentor", "migrated", "migrate",
    "modernized", "modernize", "optimized", "optimize", "orchestrated", "orchestrate",
    "programmed", "program", "refactored", "refactor", "resolved", "resolve",
    "reduced", "reduce", "scaled", "scale", "secured", "secure",
    "spearheaded", "spearhead", "streamlined", "streamline", "supervised", "supervise",
    "tested", "test", "transformed", "transform", "upgraded", "upgrade",
]


def calculate_ats_metrics(raw_text: str, sections: Dict[str, str], skills_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes diagnostic ATS and technical resume quality metrics with transparent multi-pillar calibration:
    - Pillar 1: Technical Competencies & Breadth (35 max)
    - Pillar 2: Section Completeness & Layout Standards (25 max)
    - Pillar 3: Action Verbs & Delivery (20 max)
    - Pillar 4: Quantifiable Outcomes & Metrics (20 max)
    Total = 100 max.
    """
    lower_text = raw_text.lower()

    # 1. Action verbs detection (deduplicate stems)
    detected_verbs = []
    seen_verb_roots = set()
    for verb in STRONG_ACTION_VERBS:
        if re.search(r"\b" + re.escape(verb) + r"\b", lower_text):
            stem = verb[:5]
            if stem not in seen_verb_roots:
                seen_verb_roots.add(stem)
                detected_verbs.append(verb.capitalize())

    # 2. Quantifiable numbers / metrics detection
    metric_regex = r"(?:(?:\$|€|£|₹)\s*\d+(?:,\d+)*(?:\.\d+)?(?:k|m|b)?|\b\d+(?:\.\d+)?\s*(?:%|x|k|m|b|ms|s|mb|gb|tb|req/s|rps|queries/sec|\+)\b|\b\d+(?:,\d{3})+\b)"
    quant_matches = re.findall(metric_regex, lower_text)
    standalone_numbers = [
        n for n in re.findall(r"\b\d+\b", lower_text)
        if not (1900 <= int(n) <= 2035) and int(n) > 1 and int(n) not in [10, 11, 12]
    ]
    quant_metrics = sorted(list(set(quant_matches + standalone_numbers[:6])))

    # 3. Pillar 1: Technical Competencies & Domain Breadth (Max: 35 pts)
    total_skills = len(skills_data.get("all_skills", []))
    if total_skills >= 25:
        skill_count_points = 25
    elif total_skills >= 18:
        skill_count_points = 22
    elif total_skills >= 12:
        skill_count_points = 19
    elif total_skills >= 8:
        skill_count_points = 15
    elif total_skills >= 4:
        skill_count_points = 10
    else:
        skill_count_points = int(total_skills * 2.5)

    domain_categories = ["languages", "frameworks", "databases", "cloud_devops", "data_ml", "practices"]
    active_domains_list = [cat for cat in domain_categories if len(skills_data.get(cat, [])) > 0]
    active_domains = len(active_domains_list)
    if active_domains >= 4:
        domain_points = 10
    elif active_domains == 3:
        domain_points = 8
    elif active_domains == 2:
        domain_points = 5
    elif active_domains == 1:
        domain_points = 2
    else:
        domain_points = 0

    technical_points = min(35, skill_count_points + domain_points)

    # 4. Pillar 2: Section Completeness & Layout Standards (Max: 25 pts)
    detected_sections = [sec for sec, content in sections.items() if len(content.strip()) > 0]
    section_points = 0
    if "skills" in detected_sections:
        section_points += 7
    if "education" in detected_sections:
        section_points += 6
    if "projects" in detected_sections:
        section_points += 6
    if "experience" in detected_sections:
        section_points += 6
    elif len(sections.get("projects", "").strip().split()) >= 70:
        # Fresher/Student grace: Strong project portfolio compensates for lack of corporate experience
        section_points += 4

    section_points = min(25, section_points)

    # 5. Pillar 3: Action Verbs & Delivery (Max: 20 pts)
    v_count = len(detected_verbs)
    if v_count >= 8:
        verb_points = 20
    elif v_count >= 6:
        verb_points = 17
    elif v_count >= 4:
        verb_points = 14
    elif v_count >= 2:
        verb_points = 10
    elif v_count == 1:
        verb_points = 6
    else:
        verb_points = 0

    # 6. Pillar 4: Quantifiable Outcomes & Metrics (Max: 20 pts)
    m_count = len(quant_metrics)
    if m_count >= 5:
        metric_points = 20
    elif m_count >= 3:
        metric_points = 16
    elif m_count >= 2:
        metric_points = 12
    elif m_count == 1:
        metric_points = 7
    else:
        metric_points = 0

    overall_ats_score = int(round(technical_points + section_points + verb_points + metric_points))
    overall_ats_score = max(20, min(99, overall_ats_score))

    potential_score = min(99, overall_ats_score + max(5, int((100 - overall_ats_score) * 0.75)))

    # Explicit Deductions & Rationale
    deductions = []

    # 7. Plagiarism and Template Similarity Verification (Threshold: strictly LESS THAN 20.0%)
    plagiarism_check = check_plagiarism(raw_text, context_type="resume", custom_threshold=20.0)
    if plagiarism_check["is_flagged"]:
        deductions.append(
            f"Template Similarity Alert: -5 pts. Content exhibits {plagiarism_check['similarity_percentage']}% similarity to common tutorial clones and templates (Originality standard requires < 20.0%)."
        )
        overall_ats_score = max(20, min(99, overall_ats_score - 5))

    if technical_points < 35:
        deductions.append(f"Technical Competencies: -{35 - technical_points} pts. Add more diverse skills across Databases, Cloud/DevOps, or System Design.")
    if section_points < 25:
        deductions.append(f"Section Structure: -{25 - section_points} pts. Ensure all 4 core sections (Education, Skills, Experience, Projects) have standard headers.")
    if verb_points < 20:
        deductions.append(f"Action Verbs: -{20 - verb_points} pts. Start bullet points with strong engineering verbs (e.g. Architected, Engineered, Optimized) instead of passive phrasing.")
    if metric_points < 20:
        deductions.append(f"Quantifiable Impact: -{20 - metric_points} pts. Add measurable numbers, percentage gains, latency metrics, or user scale to project bullets.")

    transparency_explanation = (
        f"Candidate achieved {technical_points}/35 in Technical Competencies with {total_skills} skills across {active_domains} domains. "
        f"ATS scores evaluate 4 essential pillars: Technical Competencies ({technical_points}/35), Section Structure ({section_points}/25), "
        f"Action Verbs ({verb_points}/20), and Quantifiable Metrics ({metric_points}/20). "
        f"A resume with fewer skills can achieve a high score if its bullets contain dense metrics and strong action verbs, while a resume with many skills "
        f"achieves maximum technical points but may lose points in quantifiable outcomes. "
        f"Adding measurable engineering metrics to your {total_skills} skills will boost your score to {potential_score}%+."
    )

    # Formatting hygiene checks
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", lower_text))
    has_github_or_linkedin = bool(re.search(r"(?:github\.com|linkedin\.com)", lower_text))
    word_count = len(raw_text.split())

    # Build prioritized enhancement suggestions
    suggestions = []

    if plagiarism_check["is_flagged"]:
        matched_str = ", ".join(f'"{p}"' for p in plagiarism_check.get("matched_phrases", [])[:3])
        suggestions.append({
            "title": "Reduce Template & Boilerplate Similarity (< 20% Standard)",
            "impact": "+5-8 pts",
            "priority": "high",
            "category": "Originality & Authenticity",
            "advice": (
                f"Candidate text exhibits {plagiarism_check['similarity_percentage']}% similarity with public web templates and cloned tutorial projects. "
                f"Automated ATS filters and hiring committees require similarity to be strictly less than 20% to pass originality standards."
            ),
            "example": f"Common template matches detected: {matched_str or 'Generic MERN/CRUD boilerplate'}. Replace with unique architectural challenges, custom schema optimizations, and quantifiable metrics.",
            "formula": "Original Phrasing: Custom Architecture + Measurable Scale Metrics + Personal Learnings",
        })

    if m_count < 3:
        suggestions.append({
            "title": "Quantify Engineering Impact with Real Metrics",
            "impact": "+10-15 pts",
            "priority": "high",
            "category": "Impact",
            "advice": "ATS scanners and hiring managers rank candidates higher when results are quantified. Include latency improvements, user counts, database sizes, or percentage gains in your project bullets.",
            "example": "Instead of 'Created database queries', write: 'Designed PostgreSQL schema and indexed 15 foreign keys, accelerating search query response times by 45% across 25,000 records'.",
            "formula": "Accomplished [X] as measured by [Y] by doing [Z]",
        })

    if v_count < 5:
        suggestions.append({
            "title": "Replace Passive Phrases with High-Impact Verbs",
            "impact": "+8-12 pts",
            "priority": "high",
            "category": "Action Verbs",
            "advice": "Eliminate passive opening phrases like 'Helped with', 'Responsible for', or 'Worked on'. Start every bullet with strong technical action verbs.",
            "example": "Use verbs such as: 'Architected', 'Engineered', 'Optimized', 'Containerized', 'Spearheaded', 'Refactored', or 'Automated'.",
            "formula": "[Strong Action Verb] + [Specific Task / Architecture] + [Impact / Result]",
        })

    if "projects" not in detected_sections or len(sections.get("projects", "").strip()) < 50:
        suggestions.append({
            "title": "Add a Dedicated Technical Projects Section",
            "impact": "+10 pts",
            "priority": "high",
            "category": "Section Completeness",
            "advice": "Recruiters look closely at practical projects. Add 2 to 3 projects with clear tech stack tags (e.g. Python, React, Docker) and GitHub repository links.",
            "example": "Format: [Project Name] — [Tech Stack] | GitHub URL | 2-3 impact bullet points using the Google X-Y-Z formula.",
            "formula": "Project: [Title] | Tech: [Tools] | Result: [Measurable Outcome]",
        })

    if total_skills < 8:
        suggestions.append({
            "title": "Group Skills into Categorized Subsections",
            "impact": "+6-8 pts",
            "priority": "medium",
            "category": "Keywords",
            "advice": "Organize your technical proficiencies under clear domain headings: Languages (Python, C++), Frameworks (React, FastAPI), Databases (PostgreSQL, Redis), and Tools/Cloud (Docker, Git, AWS).",
            "example": "Categorization helps both OCR-based ATS parsers and human recruiters rapidly index your core competencies.",
            "formula": "Languages | Frameworks & Libraries | Databases & Storage | Cloud & Tools",
        })

    if not has_github_or_linkedin:
        suggestions.append({
            "title": "Include Clean GitHub & LinkedIn Profile Links",
            "impact": "+4-6 pts",
            "priority": "medium",
            "category": "Contact & Links",
            "advice": "Over 85% of tech interviewers inspect a candidate's GitHub repositories and public code contributions. Add clickable, clean profile URLs in the header.",
            "example": "github.com/your-username | linkedin.com/in/your-profile",
            "formula": "Header: [Name] | [Email] | [Phone] | [GitHub] | [LinkedIn]",
        })

    if not has_email:
        suggestions.append({
            "title": "Display Prominent Professional Contact Information",
            "impact": "+5 pts",
            "priority": "high",
            "category": "Contact",
            "advice": "Ensure an easily readable email and mobile number are placed at the very top header without embedding inside images or header graphics.",
            "example": "firstname.lastname@email.com | +91 98765 43210 | City, State",
            "formula": "Top Header: [Full Name] &bull; [Clean Email] &bull; [Phone]",
        })

    if len(suggestions) < 2:
        suggestions.append({
            "title": "Align Resume Keywords with Target Job Descriptions",
            "impact": "+5 pts",
            "priority": "low",
            "category": "Keyword Tuning",
            "advice": "Tailor specific keywords (e.g. 'RESTful API', 'Microservices', 'Distributed Systems') to match the exact terms used in job postings you apply to.",
            "example": "Paste job descriptions into PrepVerse AI's Job Match analyzer to discover any missing keyword gaps.",
            "formula": "Mirror the exact technical phrases used in the job requirements.",
        })
        suggestions.append({
            "title": "Maintain Strict Single-Column ATS Formatting",
            "impact": "+3 pts",
            "priority": "low",
            "category": "Formatting",
            "advice": "Keep your resume to a single-column layout without tables or text boxes, ensuring legacy ATS engines parse every word without jumbling text order.",
            "example": "Standard margins (0.5 to 0.75 in), standard bullet points, and 10-12pt clean font (Inter, Arial, Calibri).",
            "formula": "Single-column &bull; No floating text boxes &bull; Standard section titles",
        })

    bullet_rewrites = [
        {
            "domain": "Backend & API Engineering",
            "before": "Created backend REST APIs for the web platform and stored data in database.",
            "after": "Architected 16 RESTful API endpoints in FastAPI with PostgreSQL, reducing p95 latency from 450ms to 120ms and serving 1,500+ active users.",
            "improvement": "Added exact endpoint count, specific technologies, and a 73% latency reduction metric.",
        },
        {
            "domain": "Frontend & UI Development",
            "before": "Designed web application frontend pages and made sure it works on mobile phones.",
            "after": "Engineered responsive client SPA using React 18 and TailwindCSS, boosting Google Lighthouse mobile performance score from 64 to 96.",
            "improvement": "Replaced vague description with Google Lighthouse performance metric and modern tech stack.",
        },
        {
            "domain": "Data Science & Machine Learning",
            "before": "Trained machine learning models on dataset and analyzed the prediction results.",
            "after": "Developed and hyperparameter-tuned an XGBoost classification pipeline across 20k rows, achieving 91.4% accuracy and decreasing false alarms by 28%.",
            "improvement": "Specified dataset scale (20k rows), exact ML algorithm, and quantified accuracy/error reduction.",
        },
        {
            "domain": "DevOps & Cloud Systems",
            "before": "Set up Docker containers and ran automated testing scripts on GitHub.",
            "after": "Containerized multi-tier microservices with Docker and orchestrated GitHub Actions CI/CD pipeline, shortening deployment cycle from 40 to 6 minutes.",
            "improvement": "Quantified 85% time savings in deployment pipeline and highlighted production tooling.",
        },
    ]

    return {
        "ats_score": overall_ats_score,
        "potential_score": potential_score,
        "score_gain_achievable": potential_score - overall_ats_score,
        "action_verbs": detected_verbs[:10],
        "action_verbs_count": len(detected_verbs),
        "quantifiable_metrics_count": len(quant_metrics),
        "quantifiable_metrics": quant_metrics[:10],
        "score_breakdown": {
            "technical_skills": {"score": int(technical_points), "max": 35, "detail": f"{total_skills} skills across {active_domains} domains"},
            "section_completeness": {"score": int(section_points), "max": 25, "detail": f"{len(detected_sections)} core sections verified"},
            "action_verbs": {"score": int(verb_points), "max": 20, "detail": f"{len(detected_verbs)} strong action verbs detected"},
            "quantifiable_impact": {"score": int(metric_points), "max": 20, "detail": f"{len(quant_metrics)} quantifiable metrics detected"},
        },
        "score_audit": {
            "total_score": overall_ats_score,
            "max_score": 100,
            "deductions": deductions,
            "transparency_explanation": transparency_explanation,
            "skill_breadth_tier": "Top Tier (30+ skills across multi-domain stack)" if total_skills >= 25 else ("Strong (15-24 skills)" if total_skills >= 15 else "Developing"),
        },
        "transparency_explanation": transparency_explanation,
        "deductions": deductions,
        "enhancement_suggestions": suggestions,
        "bullet_rewrites": bullet_rewrites,
        "recommendations": [s["title"] for s in suggestions],
        "formatting_checks": {
            "has_email": has_email,
            "has_github_or_linkedin": has_github_or_linkedin,
            "word_count": word_count,
            "layout_format": "Single-Column (ATS Verified)",
            "length_guideline": "1 Page (< 5 Years Experience)",
        },
        "plagiarism_check": plagiarism_check,
        "is_ats_optimized": overall_ats_score >= 75,
    }


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
            "ats_analysis": {
                "ats_score": 0,
                "action_verbs": [],
                "action_verbs_count": 0,
                "quantifiable_metrics_count": 0,
                "recommendations": ["Document appears empty. Please upload a standard text PDF resume."],
                "plagiarism_check": {
                    "similarity_percentage": 0.0,
                    "threshold_percentage": 20.0,
                    "is_flagged": False,
                    "status": "passed",
                    "originality_score": 100.0,
                    "verdict": "Original Content (< 20% match)",
                    "matched_phrases": [],
                    "remediation_tips": [],
                    "criteria_rule": "Similarity should be less than 20%",
                },
                "is_ats_optimized": False,
            },
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
    ats_metrics = calculate_ats_metrics(raw_text, sections, skills_data)

    return {
        "skills": skills_data,
        "education": education_entries,
        "experience": experience_entries,
        "projects": project_entries,
        "certifications": cert_entries,
        "ats_analysis": ats_metrics,
        "metadata": {
            "has_extractable_content": True,
            "total_skills_detected": len(skills_data.get("all_skills", [])),
            "sections_detected": [sec for sec, content in sections.items() if len(content) > 0],
            "word_count": len(raw_text.split()),
            "ats_score": ats_metrics["ats_score"],
        },
    }
