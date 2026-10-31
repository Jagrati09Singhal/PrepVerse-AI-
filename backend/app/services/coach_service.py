import re
import logging
from typing import Dict, Any, List, Optional
from uuid import UUID

from app.models.enums import QuestionType, QuestionDifficulty
from app.services.ai_provider import get_ai_provider

logger = logging.getLogger(__name__)


def generate_coaching_feedback(
    question_id: UUID,
    session_id: UUID,
    question_text: str,
    question_type: str,
    difficulty: str,
    target_skill: Optional[str],
    rubric_criteria: Optional[str],
    answer_text: str,
    content_score: Optional[float] = None,
    communication_score: Optional[float] = None,
    star_component_scores: Optional[Dict[str, Any]] = None,
    evaluation_details: Optional[Dict[str, Any]] = None,
    user_focus_note: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates actionable coaching feedback, exemplar answer, and contextual follow-up.
    Guaranteed: Does NOT mutate original answer or historical scores.
    Uses Gemini when configured; otherwise falls back transparently to deterministic heuristics.
    """
    clean_ans = (answer_text or "").strip()
    words = re.findall(r"\b\w+\b", clean_ans)
    word_count = len(words)
    q_type_str = str(question_type).lower()

    # 1. Try external AI provider if enabled
    ai_provider = get_ai_provider()
    try:
        external_feedback = ai_provider.generate_coaching({
            "question_text": question_text,
            "question_type": q_type_str,
            "difficulty": str(difficulty),
            "target_skill": target_skill or "General Technical Competence",
            "rubric_criteria": rubric_criteria,
            "answer_text": clean_ans,
            "user_focus_note": user_focus_note,
        })
        if external_feedback and isinstance(external_feedback, dict):
            exemplar = external_feedback.get("exemplar_answer")
            improvements = external_feedback.get("actionable_improvements")
            if exemplar and improvements:
                return {
                    "question_id": question_id,
                    "session_id": session_id,
                    "question_text": question_text,
                    "question_type": q_type_str,
                    "target_skill": target_skill,
                    "strengths": external_feedback.get("strengths", ["Solid foundational answer"]),
                    "weaknesses": external_feedback.get("weaknesses", ["Could provide deeper technical rigor"]),
                    "actionable_improvements": improvements,
                    "exemplar_answer": exemplar,
                    "contextual_follow_up": external_feedback.get(
                        "contextual_follow_up",
                        "How would you measure the long-term success of this technical approach in production?"
                    ),
                    "engine": "gemini",
                    "disclaimer": "Generated using Gemini AI interview coach.",
                }
    except Exception as exc:
        logger.warning("External AI coach failed, using deterministic fallback: %s", exc)

    # 2. Deterministic AI Coach Heuristics (Transparent deterministic fallback)
    strengths: List[str] = []
    weaknesses: List[str] = []
    improvements: List[str] = []

    # Analyze Strengths
    if word_count >= 80:
        strengths.append(
            f"Elaborated in substantive detail ({word_count} words), demonstrating sustained thought and commitment."
        )
    elif word_count >= 30:
        strengths.append("Addressed the core interview prompt directly without excessive filler or rambling.")

    if target_skill and re.search(rf"\b{re.escape(target_skill)}\b", clean_ans, flags=re.IGNORECASE):
        strengths.append(f"Explicitly integrated the target competency ({target_skill}) into your explanation.")

    if "\n" in clean_ans or re.search(r"^\s*[-*•\d]", clean_ans, flags=re.MULTILINE):
        strengths.append("Structured the response clearly using distinct paragraphs or enumerated points.")

    if q_type_str == QuestionType.BEHAVIORAL.value:
        if star_component_scores and isinstance(star_component_scores, dict):
            high_star = [k.capitalize() for k, v in star_component_scores.items() if (v or 0) >= 75]
            if high_star:
                strengths.append(f"Demonstrated strong competency in STAR dimensions: {', '.join(high_star)}.")
            else:
                strengths.append("Provided a personal narrative with an identifiable situation and goal.")
        else:
            strengths.append("Provided real-world experiential context grounding the response.")
    else:
        # Technical or situational
        tech_terms = re.findall(
            r"\b(api|database|cache|latency|throughput|async|queue|scalable|architecture|security|index|lock|event)\b",
            clean_ans,
            flags=re.IGNORECASE,
        )
        if tech_terms:
            unique_terms = sorted(list(set(t.lower() for t in tech_terms)))
            strengths.append(f"Employed domain-relevant engineering terminology: {', '.join(unique_terms[:4])}.")
        else:
            strengths.append("Approached the problem with logical intent and problem-solving framing.")

    if not strengths:
        strengths.append("Understood the premise of the question and provided an initial perspective.")

    # Analyze Weaknesses
    if word_count < 40:
        weaknesses.append("The response is overly brief and lacks sufficient depth to convince a senior interviewer.")

    if q_type_str == QuestionType.BEHAVIORAL.value:
        has_metrics = bool(re.search(r"\b(\d+%\b|\$\d+|\d+ ms|\d+ days|\d+ hours|\d+ users)\b", clean_ans, flags=re.IGNORECASE))
        if not has_metrics:
            weaknesses.append("Missing quantifiable outcomes or metrics (e.g., '% latency reduced', 'hours saved', or 'team velocity improved') in the Result.")

        if star_component_scores and isinstance(star_component_scores, dict):
            low_star = [k.capitalize() for k, v in star_component_scores.items() if (v or 0) < 60]
            if low_star:
                weaknesses.append(f"Under-developed STAR components: {', '.join(low_star)} need clearer emphasis.")
    else:
        # Technical/situational
        has_tradeoffs = bool(re.search(r"\b(tradeoff|trade-off|versus|vs|alternative|pros and cons|bottleneck|drawback)\b", clean_ans, flags=re.IGNORECASE))
        if not has_tradeoffs:
            weaknesses.append("Did not evaluate trade-offs or alternatives (e.g., consistency vs latency, memory vs CPU).")

        has_failure_handling = bool(re.search(r"\b(error|exception|failure|retry|deadlock|timeout|fallback|rollback)\b", clean_ans, flags=re.IGNORECASE))
        if not has_failure_handling:
            weaknesses.append("Did not address failure modes, edge cases, or production incident safeguards.")

    filler_matches = re.findall(r"\b(basically|you know|kind of|sort of|literally|actually)\b", clean_ans, flags=re.IGNORECASE)
    if len(filler_matches) >= 2:
        weaknesses.append(f"Detected conversational filler phrases ({', '.join(set(filler_matches[:3]))}) that dilute professional authority.")

    if not weaknesses:
        weaknesses.append("Could further sharpen executive conciseness and include more concrete production benchmarks.")

    # Actionable Improvements
    if q_type_str == QuestionType.BEHAVIORAL.value:
        improvements.append(
            "Structure using the explicit STAR format: spend 15% on Situation, 15% on your specific Task, 50% on Actions YOU took, and 20% on the Result."
        )
        improvements.append(
            "Quantify your impact: replace generic statements like 'it was much faster' with specific metrics like 'reduced P99 latency by 35% and cut cloud compute costs by $4,000/month'."
        )
        improvements.append(
            "Emphasize personal agency: use active first-person phrasing ('I architected', 'I coordinated', 'I resolved') rather than passive team phrasing ('we did')."
        )
    else:
        improvements.append(
            "Frame your technical answer in 3 phases: 1) Clarify assumptions and requirements, 2) Propose the core architecture/design, 3) Analyze bottlenecks and trade-offs."
        )
        improvements.append(
            "Explicitly evaluate engineering trade-offs: compare your chosen approach with an alternative solution to show architectural maturity."
        )
        improvements.append(
            "Walk through production edge cases: explain how your implementation handles timeouts, unexpected null payloads, database retries, or traffic bursts."
        )

    # Exemplar Answer
    exemplar_answer = _build_exemplar_answer(
        question_text=question_text,
        question_type=q_type_str,
        target_skill=target_skill,
        difficulty=difficulty,
    )

    # Contextual Follow-up
    contextual_follow_up = _build_follow_up_question(
        question_text=question_text,
        question_type=q_type_str,
        target_skill=target_skill,
    )

    return {
        "question_id": question_id,
        "session_id": session_id,
        "question_text": question_text,
        "question_type": q_type_str,
        "target_skill": target_skill,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "actionable_improvements": improvements,
        "exemplar_answer": exemplar_answer,
        "contextual_follow_up": contextual_follow_up,
        "engine": "deterministic_fallback",
        "disclaimer": "Generated using PrepVerse AI deterministic coaching heuristics. No external LLM was used.",
    }


def _build_exemplar_answer(
    question_text: str,
    question_type: str,
    target_skill: Optional[str],
    difficulty: str,
) -> str:
    """Generates an exemplar answer tailored to question type, skill, and difficulty."""
    skill = target_skill or "Software Engineering"

    if question_type == QuestionType.BEHAVIORAL.value:
        return (
            f"**STAR Exemplar Answer:**\n\n"
            f"**Situation:** During a high-stakes release at my previous company, our team was migrating our core "
            f"service to support a 300% projected increase in transaction volume. Two days before launch, we discovered "
            f"intermittent latency spikes in the {skill} pipeline that threatened our 99.9% uptime SLA.\n\n"
            f"**Task:** As the engineering lead on this component, my task was to isolate the root cause, prevent "
            f"downstream service timeouts, and deliver the release without delaying our public launch commitments.\n\n"
            f"**Action:** I set up distributed tracing to pinpoint the bottleneck, discovering unindexed query "
            f"patterns and contention on shared thread pools. I introduced asynchronous worker queues with exponential "
            f"backoff, optimized database indexing strategies, and instituted comprehensive unit and integration stress "
            f"tests to validate the fix under 1.5x maximum peak load.\n\n"
            f"**Result:** We successfully launched on schedule. The optimized service reduced P99 latency by 65% "
            f"(from 820ms to 285ms) and sustained zero downtime during peak traffic, saving an estimated 15 hours of "
            f"weekly operational troubleshooting."
        )
    elif question_type == QuestionType.SITUATIONAL.value:
        return (
            f"**1. Immediate Triage & Blast Radius Assessment:**\n"
            f"My first action would be to assess the immediate customer and business impact. If production systems "
            f"or data integrity are at risk regarding {skill}, I would activate our incident management process, "
            f"notify on-call stakeholders, and toggle emergency feature flags or initiate a clean rollback to the last verified stable build.\n\n"
            f"**2. Root-Cause Analysis & Containment:**\n"
            f"Once systems are stabilized, I would review system telemetry, distributed traces, and audit logs to reproduce "
            f"and isolate the underlying fault without guessing. I would draft an isolated patch with regression tests.\n\n"
            f"**3. Transparent Stakeholder Communication:**\n"
            f"I would communicate clear, cadence-based status updates every 30 minutes to both technical and non-technical "
            f"partners, outlining what is known, current mitigation steps, and the estimated time to full resolution.\n\n"
            f"**4. Blameless Post-Mortem & Preventative Hardening:**\n"
            f"Finally, I would conduct a blameless post-mortem with the team to identify process or test gaps, scheduling "
            f"remediation tasks (such as automated canary testing and alerting thresholds) to ensure this failure mode cannot recur."
        )
    else:
        # Technical question
        return (
            f"To approach {question_text.rstrip('?')} effectively in a production system, I recommend a structured 4-step framework:\n\n"
            f"**1. High-Level Architecture & Data Flow:**\n"
            f"At scale, {skill} should be designed with loose coupling and clear separation of concerns. Ingestion should "
            f"be decoupled from heavy processing through an event-driven queue (e.g., Kafka or RabbitMQ) to provide backpressure "
            f"cushioning and prevent cascading thread pool starvation.\n\n"
            f"**2. Concurrency & Consistency Strategy:**\n"
            f"To guarantee correctness under concurrent access, we employ idempotent request keys and optimistic locking "
            f"with version checks on writes. For read-heavy operations, a multi-tier caching layer (e.g., Redis with cache-aside "
            f"and jittered TTLs) avoids cache stampede phenomena.\n\n"
            f"**3. Trade-offs & Complexity Analysis:**\n"
            f"- **Latency vs. Consistency:** In an AP-oriented system (eventual consistency), writes acknowledge immediately while "
            f"replicas catch up asynchronously, maximizing throughput at the cost of transient read delay.\n"
            f"- **Space vs. Compute:** Pre-aggregating data or maintaining denormalized projections trades slight storage overhead "
            f"for O(1) query lookups.\n\n"
            f"**4. Production Observability & Edge Cases:**\n"
            f"Instrument distributed tracing and track golden signals (latency, traffic, errors, saturation). Ensure dead-letter "
            f"queues and automated circuit breakers are configured to handle dependency outages gracefully."
        )


def _build_follow_up_question(
    question_text: str,
    question_type: str,
    target_skill: Optional[str],
) -> str:
    """Generates a realistic probing follow-up question."""
    skill = target_skill or "the system"
    if question_type == QuestionType.BEHAVIORAL.value:
        return (
            f"If you were to tackle this exact project again today with full hindsight, "
            f"what is one architectural or managerial decision you would make differently in the opening phase?"
        )
    elif question_type == QuestionType.SITUATIONAL.value:
        return (
            f"Suppose a key business executive urges you to bypass testing and push the emergency hotfix directly "
            f"to production to meet a client deadline. How would you handle this conflict?"
        )
    else:
        return (
            f"How would your proposed design for {skill} adapt if the write-to-read ratio shifted dramatically "
            f"from 1:10 to 10:1 during burst traffic events?"
        )
