import re
import logging
from typing import List, Dict, Any, Optional, Set
from app.models.enums import QuestionType, QuestionDifficulty
from app.services.ai_provider import get_ai_provider

logger = logging.getLogger(__name__)

# Expanded STAR Behavioral Question Bank (20 distinct scenarios)
BEHAVIORAL_TEMPLATES = [
    (
        "Can you tell me about a time when you had a technical disagreement with a team member "
        "or senior engineer regarding an architectural decision? Please structure your answer using the "
        "STAR format: describe the Situation, your specific Task, the personal Actions you took to "
        "resolve the disagreement constructively, and the measurable Result."
    ),
    (
        "Describe a high-stakes project or production incident where you faced a tight delivery "
        "deadline and unexpected technical blockers. Walk through the Situation, the Task you were "
        "responsible for, the concrete Actions you executed, and the final Result achieved."
    ),
    (
        "Tell me about a situation where you identified significant technical debt or an inefficient "
        "process in your previous role and took the initiative to fix it. Detail the Situation, your "
        "Task, the Actions you implemented, and the quantifiable business or team Result."
    ),
    (
        "Can you share an experience where a deployment or feature you shipped did not go as planned or caused an outage? "
        "Explain the Situation, your Task, the recovery Actions you took, and the ultimate Result, "
        "including the key lessons learned."
    ),
    (
        "Describe a scenario where you experienced cross-functional misalignment with Product Managers, "
        "Designers, or QA regarding requirements. How did you align the team? Detail the Situation, your "
        "Task, Actions taken to bridge the gap, and the measurable business Result."
    ),
    (
        "Tell me about a time you mentored, unblocked, or onboarded a struggling engineer or student under a high-stress "
        "sprint. Detail the Situation, your Task, the empathetic yet rigorous Actions you took, and the team Result."
    ),
    (
        "Share an example of when you had to make a pragmatic compromise on code architecture to meet an urgent "
        "commercial release. Walk through the Situation, your Task, your mitigation Actions, and the quantifiable Result."
    ),
    (
        "Describe a time you were given ambiguous, rapidly evolving technical requirements with little guidance. "
        "How did you drive clarity? Walk through the Situation, your Task, the Actions you took to define milestones, and the Result."
    ),
    (
        "Tell me about a project where you had to quickly learn and adopt a completely new language, framework, or technology stack "
        "within days to deliver a critical deliverable. Walk through the Situation, your Task, your learning Actions, and the Result."
    ),
    (
        "Can you share an experience where you had to push back against an unrealistic timeline or scope from executive management? "
        "Walk through the Situation, your Task, how you communicated risks and trade-offs, and the final Result."
    ),
    (
        "Describe a situation where you spearheaded efforts to improve software reliability, automated testing, or code review standards "
        "in your team. What was the Situation, your Task, the Actions you implemented, and the measurable Result in defect reduction?"
    ),
    (
        "Tell me about a time you handled a critical customer-facing bug reported directly from production. "
        "Walk through the Situation, your Task, the root-cause Actions you took, and how you communicated the Result."
    ),
    (
        "Give an example of a time when you received tough constructive criticism during a peer review or performance evaluation. "
        "What was the Situation, what was your Task, what immediate Actions did you take to improve, and what was the Result?"
    ),
    (
        "Describe an experience where you collaborated across disparate teams or timezones to deliver a shared platform feature. "
        "Explain the Situation, your specific Task, how you coordinated cross-team Actions, and the final business Result."
    ),
    (
        "Share an instance where you optimized an application's user experience or performance based on actual user analytics or feedback. "
        "Detail the Situation, your Task, your optimization Actions, and the quantifiable engagement Result."
    ),
    (
        "Tell me about a time when a project you were working on was abruptly cancelled or radically reprioritized. "
        "How did you adapt? Detail the Situation, your Task, your pivot Actions, and the resulting engineering learnings."
    ),
    (
        "Describe a time you had to balance building a quick minimum viable prototype versus investing in long-term extensible code. "
        "Walk through the Situation, your Task, the strategic Actions taken, and the final Result."
    ),
    (
        "Can you discuss a situation where you advocated for better developer experience, documentation, or CI/CD tooling? "
        "Walk through the Situation, your Task, your implementation Actions, and the measurable productivity Result."
    ),
    (
        "Describe a time when you went above and beyond your standard job description to unblock a release or assist a colleague. "
        "Explain the Situation, your Task, your selfless Actions, and the positive team Result."
    ),
    (
        "Share an experience where you led a complex code refactoring without breaking backward compatibility. "
        "Walk through the Situation, your Task, the verification Actions you executed, and the resulting stability Result."
    ),
]

# Expanded Situational Problem Solving Question Bank (16 distinct operational crisis scenarios)
SITUATIONAL_TEMPLATES = [
    (
        "Imagine you are the primary engineer on-call for {clean_role} and latency spikes by 300% "
        "on a core API service, but CPU and memory metrics appear normal. Walk through your systematic "
        "triage, investigation steps, containment strategy, and stakeholder communication."
    ),
    (
        "Suppose product management requests an urgent feature launch in two weeks that would typically "
        "require six weeks to implement cleanly. As a {clean_role}, how would you negotiate scope, "
        "manage technical trade-offs, and ensure long-term code quality?"
    ),
    (
        "Imagine you discover an unpatched zero-day security vulnerability in a third-party dependency currently "
        "running in production. How would you assess the blast radius, prioritize the patch, and coordinate "
        "a zero-downtime release with the team?"
    ),
    (
        "Suppose you observe severe database replication lag and suspect intermittent network partitions causing "
        "potential split-brain write conflicts in your cluster. How do you triage, contain data divergence, and restore consistency?"
    ),
    (
        "Imagine a key business executive pressures you to bypass testing and deploy an emergency hotfix directly "
        "to production to avoid missing a quarterly client commitment. How do you handle this conflict professionally?"
    ),
    (
        "Suppose an external third-party payment or authentication webhook begins failing intermittently, causing "
        "ingestion backpressure and thread pool starvation in your API gateway. How do you isolate the blast radius?"
    ),
    (
        "Imagine your production service suffers an Out-Of-Memory (OOM) crash during peak traffic hours. "
        "The service restarts automatically but crashes again every 15 minutes. Walk through your live incident response."
    ),
    (
        "Suppose you push a major database schema migration and immediately start seeing deadlocks and connection pool exhaustion. "
        "What is your immediate rollback and mitigation protocol?"
    ),
    (
        "Imagine a caching layer fails completely (Cache Stampede / Thundering Herd) and all traffic cascades directly "
        "onto the primary database, causing database CPU to hit 100%. How do you recover the system safely?"
    ),
    (
        "Suppose a junior engineer on your team accidentally commits AWS root credentials or database secrets into a public GitHub repository. "
        "What exact remediation steps do you take in the first 10 minutes, 1 hour, and 24 hours?"
    ),
    (
        "Imagine a mobile app version with a critical API serialization bug was shipped to 500,000 active users and cannot be updated immediately. "
        "How do you configure backward compatibility on the backend to prevent client app crashes?"
    ),
    (
        "Suppose your team's cloud infrastructure bill suddenly spikes by $15,000 in one week without a corresponding increase in active users. "
        "How do you investigate, identify runaway cloud resources, and prevent future budget overruns?"
    ),
    (
        "Imagine you must migrate a live database with 20 million records from MongoDB to PostgreSQL with strictly zero downtime and zero data loss. "
        "Explain your phased dual-write, backfill, verification, and cutover architecture."
    ),
    (
        "Suppose an automated batch processing pipeline that typically finishes in 45 minutes begins taking 7 hours to complete. "
        "Walk through how you profile bottlenecks, identify indexing or I/O issues, and restore throughput."
    ),
    (
        "Imagine multiple microservices depend on each other synchronously in a distributed chain, and one deep downstream service times out. "
        "How do you implement circuit breakers, retries with exponential jitter, and fallbacks to prevent cascading system failure?"
    ),
    (
        "Suppose you join a legacy codebase with zero automated unit or integration tests, and you are tasked with adding a high-risk payment feature. "
        "How do you safely introduce test harnesses and refactor without introducing regression bugs?"
    ),
]

# Targeted Technical Perspectives (10 Architectural Angles)
TECHNICAL_ANGLES = [
    (
        "performance",
        "In the context of {clean_role}, how do you approach performance profiling, concurrency, "
        "and latency minimization when building production services with {skill}? "
        "Discuss specific caching, connection pooling, and profiling strategies you rely on.",
        "Candidate should discuss profiling, indexing, cache-aside strategies, connection management, "
        "and latency trade-offs with {skill}."
    ),
    (
        "resilience",
        "How do you design for resilience, fault-isolation, and graceful degradation when integrating {skill} into {clean_role} systems? "
        "Explain how you handle upstream timeouts, cascading thread pool starvation, and circuit breaker patterns.",
        "Candidate should cite circuit breakers, exponential backoff, dead-letter queues, and health checks when utilizing {skill}."
    ),
    (
        "concurrency",
        "Under high concurrent workloads in {clean_role}, how do you ensure data correctness and prevent race conditions when using {skill}? "
        "Contrast optimistic versus pessimistic locking, idempotency keys, and transaction boundary management.",
        "Candidate should demonstrate deep understanding of ACID boundaries, race conditions, idempotency, and distributed locking."
    ),
    (
        "observability",
        "When operating {skill} at scale as a {clean_role}, what golden signals (latency, traffic, errors, saturation) "
        "do you instrument? How would you configure automated alerts and distributed tracing to detect degradation early?",
        "Candidate should explain distributed tracing, Prometheus/Grafana metrics, SLA/SLO tracking, and proactive anomaly alerting."
    ),
    (
        "architecture",
        "As a {clean_role}, walk through your approach to structuring a modular, maintainable architecture around {skill}. "
        "How do you manage schema evolution, zero-downtime database migrations, and backward compatibility for existing clients?",
        "Candidate outlines modular decomposition, loose coupling, contract testing, and expand-and-contract migration patterns."
    ),
    (
        "security",
        "What are the most critical security vulnerabilities, injection vectors, and access control challenges associated with {skill} in {clean_role}? "
        "How do you enforce least-privilege, input sanitization, and secrets management in production?",
        "Candidate should detail OWASP vulnerabilities, authentication, authorization, encrypted data-in-transit and at-rest."
    ),
    (
        "testing",
        "How do you design a comprehensive testing strategy (unit, integration, contract, and end-to-end) for components utilizing {skill}? "
        "Discuss mocking external dependencies versus using test containers for deterministic test suites.",
        "Candidate should describe test pyramids, mock boundaries, contract tests, and test database isolation with {skill}."
    ),
    (
        "scalability",
        "When traffic increases by 10x, what are the primary architectural bottlenecks and resource constraints encountered with {skill}? "
        "How do you scale horizontally versus vertically, and how do you partition or shard data?",
        "Candidate should discuss horizontal scaling, stateless architectures, sharding strategies, and bottleneck mitigation."
    ),
    (
        "debugging",
        "Walk through a systematic approach to debugging a silent data corruption or intermittent memory leak issue in a service utilizing {skill}. "
        "What diagnostic tools, heap dump analyzers, or profilers would you use?",
        "Candidate describes methodical troubleshooting, reproduction environments, memory profiling, and root-cause verification."
    ),
    (
        "api_design",
        "How do you approach API design, request validation, and error handling when building consumer-facing interfaces with {skill}? "
        "Discuss pagination strategies (keyset vs offset), rate limiting, and standard HTTP status code semantics.",
        "Candidate explains clear API contracts, idempotent mutations, validation schemas, and robust client error communication."
    ),
]

# Domain-Specific Technical Questions for Common Technologies
SPECIFIC_SKILL_QUESTIONS: Dict[str, List[Tuple[str, str]]] = {
    "React": [
        (
            "In React production applications, how do you diagnose and resolve unnecessary component re-renders? "
            "Contrast useMemo, useCallback, React.memo, and state localization. When might premature memoization actually degrade performance?",
            "Candidate explains React reconciliation, shallow prop comparison, reference equality, and profiler usage."
        ),
        (
            "How do you architect global client state management in a large-scale React application? "
            "Compare Redux Toolkit, Context API, and Zustand in terms of boilerplate, re-render boundaries, and developer ergonomics.",
            "Candidate evaluates state lifting, selective subscription, selectors, and separating server cache from UI state."
        ),
    ],
    "Python": [
        (
            "Explain Python's Global Interpreter Lock (GIL) and its implications on CPU-bound versus I/O-bound tasks. "
            "When would you choose asyncio, threading, or multiprocessing in a production Python service?",
            "Candidate demonstrates deep knowledge of GIL mechanics, cooperative multitasking, event loops, and process isolation."
        ),
        (
            "How does Python manage memory under the hood? Discuss reference counting, cyclical garbage collection, and how to detect memory leaks.",
            "Candidate explains reference counters, gc module, weak references, and profiling tools like tracemalloc."
        ),
    ],
    "SQL": [
        (
            "When analyzing a slow-performing SQL query, walk through how you interpret an EXPLAIN ANALYZE execution plan. "
            "What is the difference between an Index Scan, Index Only Scan, and Sequential Scan?",
            "Candidate explains cost estimation, actual timing, selectivity, composite index ordering, and index-only scans."
        ),
        (
            "Contrast SQL database normalization (1NF through BCNF) with pragmatic denormalization in high-read systems. "
            "How do you maintain data integrity and handle cache invalidation when denormalizing tables?",
            "Candidate explains read vs write trade-offs, anomaly prevention, triggers, and read-replica replication."
        ),
    ],
    "Docker": [
        (
            "How do you optimize Dockerfiles for production security and minimal image size? "
            "Discuss multi-stage builds, non-root execution, base image selection (Alpine vs Distroless), and layer caching.",
            "Candidate details layer caching order, multi-stage artifacts, security scanning, and minimal attack surfaces."
        ),
    ],
    "Node.js": [
        (
            "How does the Node.js event loop coordinate with the libuv thread pool? "
            "How do you prevent blocking the event loop when processing heavy payloads or computational algorithms?",
            "Candidate explains phases of the event loop (timers, poll, check), microtasks, setImmediate, and worker threads."
        ),
    ],
}


def generate_deterministic_questions(
    role_title: str,
    resume_skills: List[str],
    jd_required_skills: List[str],
    jd_preferred_skills: List[str],
    skill_gaps: List[str],
    evidenced_skills: List[str],
    question_count: int,
    question_types: List[QuestionType],
    difficulty: QuestionDifficulty,
    target_focus: Optional[str] = None,
    previously_asked: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Deterministically crafts personalized interview questions based on actual resume data,
    job description requirements, and identified skill gaps.
    Supports flexible session sizes (1 to 50 questions) without arbitrary caps.
    Enforces deduplication against previously asked questions from earlier candidate sessions.
    """
    clean_role = role_title.strip() if role_title else "Software Engineer"
    questions: List[Dict[str, Any]] = []
    asked_set = set(previously_asked or set())

    # Prepare pools of skills
    gap_pool = [s for s in skill_gaps if s]
    if target_focus and target_focus not in gap_pool:
        gap_pool.insert(0, target_focus)
    evidenced_pool = [s for s in (evidenced_skills or resume_skills) if s]
    required_pool = [s for s in jd_required_skills if s and s not in gap_pool]

    all_available_skills = (
        (gap_pool * 3) +
        (required_pool * 2) +
        (evidenced_pool * 2) +
        ["Distributed Systems", "Database Optimization", "API Security", "Cloud Infrastructure", "System Architecture", "Data Structures & Algorithms"]
    )

    requested_types = question_types if question_types else [
        QuestionType.TECHNICAL,
        QuestionType.BEHAVIORAL,
        QuestionType.SITUATIONAL,
    ]

    type_sequence: List[QuestionType] = []
    while len(type_sequence) < question_count:
        for q_type in requested_types:
            if len(type_sequence) < question_count:
                type_sequence.append(q_type)

    b_idx = 0
    s_idx = 0
    tech_skill_idx = 0
    tech_angle_idx = 0

    for i, q_type in enumerate(type_sequence):
        order_index = i
        q_text = ""
        rubric = ""
        target_skill = ""

        if q_type == QuestionType.TECHNICAL:
            skill = all_available_skills[tech_skill_idx % len(all_available_skills)]
            tech_skill_idx += 1
            target_skill = skill

            # Check if specialized domain question exists for this skill
            selected_text = None
            selected_rubric = None

            if skill in SPECIFIC_SKILL_QUESTIONS:
                for q_pair in SPECIFIC_SKILL_QUESTIONS[skill]:
                    if q_pair[0] not in asked_set:
                        selected_text = q_pair[0]
                        selected_rubric = q_pair[1]
                        break

            # Fall back to rotating architectural perspectives
            if not selected_text:
                angle_offset = 0
                while angle_offset < len(TECHNICAL_ANGLES):
                    angle_def = TECHNICAL_ANGLES[(tech_angle_idx + angle_offset) % len(TECHNICAL_ANGLES)]
                    candidate_q = angle_def[1].format(clean_role=clean_role, skill=skill)

                    if candidate_q not in asked_set:
                        selected_text = candidate_q
                        selected_rubric = angle_def[2].format(clean_role=clean_role, skill=skill)
                        tech_angle_idx += angle_offset + 1
                        break
                    angle_offset += 1

            if not selected_text:
                variant_id = (i // len(requested_types)) + 1
                selected_text = (
                    f"In an enterprise production deployment for {clean_role}, how do you evaluate the "
                    f"scalability limits, operational trade-offs, and failure recovery protocols of {skill} (Scenario {variant_id})?"
                )
                selected_rubric = f"Candidate should evaluate real-world trade-offs, failure modes, and recovery strategies for {skill}."

            q_text = selected_text
            rubric = selected_rubric
            asked_set.add(q_text)

        elif q_type == QuestionType.BEHAVIORAL:
            target_skill = "STAR Behavioral Competency"
            b_offset = 0
            selected_text = None

            while b_offset < len(BEHAVIORAL_TEMPLATES):
                cand = BEHAVIORAL_TEMPLATES[(b_idx + b_offset) % len(BEHAVIORAL_TEMPLATES)]
                if cand not in asked_set:
                    selected_text = cand
                    b_idx += b_offset + 1
                    break
                b_offset += 1

            if not selected_text:
                cand = BEHAVIORAL_TEMPLATES[b_idx % len(BEHAVIORAL_TEMPLATES)]
                b_idx += 1
                selected_text = f"Reflecting on your {clean_role} career: {cand}"

            q_text = selected_text
            rubric = (
                "Evaluation criteria (STAR Rubric): "
                "1. Situation: Clear context, stakeholders, constraints, and initial challenge. "
                "2. Task: Explicit individual responsibility or objective. "
                "3. Action: First-person concrete execution ('I designed', 'I implemented', 'I resolved'). "
                "4. Result: Measurable outcome, business metrics, or clear engineering takeaways."
            )
            asked_set.add(q_text)

        elif q_type == QuestionType.SITUATIONAL:
            target_skill = "Situational Problem Solving"
            s_offset = 0
            selected_text = None

            while s_offset < len(SITUATIONAL_TEMPLATES):
                cand = SITUATIONAL_TEMPLATES[(s_idx + s_offset) % len(SITUATIONAL_TEMPLATES)].format(clean_role=clean_role)
                if cand not in asked_set:
                    selected_text = cand
                    s_idx += s_offset + 1
                    break
                s_offset += 1

            if not selected_text:
                cand = SITUATIONAL_TEMPLATES[s_idx % len(SITUATIONAL_TEMPLATES)].format(clean_role=clean_role)
                s_idx += 1
                selected_text = cand

            q_text = selected_text
            rubric = (
                "Candidate should demonstrate structured troubleshooting, prioritization of customer impact, "
                "clear risk assessment, practical compromise with stakeholders, and thorough documentation."
            )
            asked_set.add(q_text)

        else:
            target_skill = "General Engineering"
            q_text = f"What are the most critical engineering principles you adhere to when building software for {clean_role}?"
            rubric = "Candidate should articulate clean code, modularity, automated testing, observability, and maintainability."
            asked_set.add(q_text)

        questions.append({
            "question_text": q_text,
            "type": q_type,
            "difficulty": difficulty,
            "order_index": order_index,
            "target_skill": target_skill,
            "rubric_criteria": rubric,
        })

    return questions


def generate_interview_questions(
    role_title: str,
    resume_skills: List[str],
    resume_raw_text: str,
    jd_required_skills: List[str],
    jd_preferred_skills: List[str],
    skill_gaps: List[str],
    evidenced_skills: List[str],
    question_count: int = 5,
    question_types: Optional[List[QuestionType]] = None,
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM,
    target_focus: Optional[str] = None,
    previously_asked: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Orchestrates personalized question generation.
    Supports flexible question counts (up to 50 questions per session).
    Enforces deduplication against previously presented questions.
    Attempts configured AI provider (e.g. Gemini) first when active;
    seamlessly falls back to the deterministic question generator on any issue.
    """
    bounded_count = max(1, min(question_count, 50))
    selected_types = question_types if question_types else [
        QuestionType.TECHNICAL,
        QuestionType.BEHAVIORAL,
        QuestionType.SITUATIONAL,
    ]

    ai_provider = get_ai_provider()

    # If provider supports generate_questions, invoke it safely
    if hasattr(ai_provider, "generate_questions"):
        try:
            context = {
                "role_title": role_title,
                "resume_skills": resume_skills,
                "resume_raw_text": resume_raw_text[:2000],
                "jd_required_skills": jd_required_skills,
                "jd_preferred_skills": jd_preferred_skills,
                "skill_gaps": skill_gaps,
                "evidenced_skills": evidenced_skills,
                "question_count": bounded_count,
                "question_types": [qt.value if hasattr(qt, "value") else str(qt) for qt in selected_types],
                "difficulty": difficulty.value if hasattr(difficulty, "value") else str(difficulty),
                "target_focus": target_focus,
                "previously_asked": list(previously_asked)[:15] if previously_asked else [],
            }
            ai_questions = ai_provider.generate_questions(context)
            if ai_questions and isinstance(ai_questions, list) and len(ai_questions) == bounded_count:
                logger.info("Generated %d interview questions using AI provider.", len(ai_questions))
                return ai_questions
        except Exception as exc:
            logger.warning("AI provider failed to generate questions (%s). Falling back to deterministic engine.", exc)

    # Deterministic generation with deduplication
    return generate_deterministic_questions(
        role_title=role_title,
        resume_skills=resume_skills,
        jd_required_skills=jd_required_skills,
        jd_preferred_skills=jd_preferred_skills,
        skill_gaps=skill_gaps,
        evidenced_skills=evidenced_skills,
        question_count=bounded_count,
        question_types=selected_types,
        difficulty=difficulty,
        target_focus=target_focus,
        previously_asked=previously_asked,
    )
