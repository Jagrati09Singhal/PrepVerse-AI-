import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from app.models.enums import QuestionType, QuestionDifficulty
from app.services.ai_provider import get_ai_provider
from app.services.speech_analytics import compute_speech_analytics

logger = logging.getLogger(__name__)

# Common filler phrases and crutches in written responses
FILLER_PATTERNS = [
    r"\bbasically\b",
    r"\byou know\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\bobviously\b",
    r"\bto be honest\b",
    r"\bliterally\b",
    r"\bactually\b",
    r"\bat the end of the day\b",
    r"\bfor the most part\b",
]

# STAR keywords and patterns
SITUATION_PATTERNS = [
    r"\b(when I was|at my previous|during my time|in my previous role|we were working on|the team faced|the challenge was|in 20\d\d|our system experienced|there was an issue|situation|context)\b",
]

TASK_PATTERNS = [
    r"\b(my task was|my responsibility was|I was tasked with|I was assigned to|the objective was|my goal was|I needed to|I was responsible for|we needed to achieve)\b",
]

ACTION_PATTERNS = [
    r"\b(I\s+(?:have\s+)?(?:implemented|designed|built|led|investigated|created|refactored|decided|proposed|wrote|analyzed|coordinated|initiated|deployed|developed|resolved|architected|configured|migrated))\b",
    r"\b(implemented|designed|refactored|architected|configured|deployed|developed|mitigated)\b",
]

RESULT_PATTERNS = [
    r"\b(resulted in|as a result|increased by|reduced by|decreased by|saved|improved by|\d+%\b|\d+ (ms|seconds|minutes|hours|days|dollars)\b|successfully launched|delivered on time|prevented|the outcome was|we learned)\b",
]


def evaluate_text_communication(answer_text: str) -> Tuple[float, int, Dict[str, Any]]:
    """
    Evaluates text-visible communication qualities:
    - Structural organization (paragraphs, lists, transitions)
    - Conciseness and directness (filler phrase analysis)
    - Depth and vocabulary clarity
    NOTE: Evaluates written communication only; does not assess vocal tone or spoken delivery.
    """
    text = answer_text.strip()
    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)

    # 1. Detect filler phrases
    filler_count = 0
    detected_fillers = []
    for pattern in FILLER_PATTERNS:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if matches:
            filler_count += len(matches)
            detected_fillers.append(matches[0].lower())

    # 2. Structural markers
    has_paragraphs = "\n" in text or len(re.split(r"[.!?]\s+", text)) >= 3
    has_bullet_or_numbering = bool(re.search(r"(^|\n)\s*([*-]|\d+\.)\s+", text))
    has_transitions = bool(re.search(
        r"\b(first|secondly|additionally|furthermore|consequently|finally|in conclusion|for example)\b",
        text,
        re.IGNORECASE,
    ))

    # Base score
    score = 75.0

    # Paragraph and structural rewards
    if has_paragraphs:
        score += 8.0
    if has_bullet_or_numbering:
        score += 5.0
    if has_transitions:
        score += 5.0

    # Word count calibration
    if word_count < 30:
        score -= 20.0  # overly terse
    elif 60 <= word_count <= 400:
        score += 7.0   # well-calibrated length
    elif word_count > 600:
        score -= 5.0   # potentially rambling

    # Filler penalties (deduct 2.5 per filler, max deduction 20)
    filler_penalty = min(20.0, filler_count * 2.5)
    score -= filler_penalty

    final_score = round(max(30.0, min(score, 98.0)), 1)

    breakdown = {
        "word_count": word_count,
        "filler_count": filler_count,
        "detected_fillers": list(set(detected_fillers)),
        "has_structural_formatting": has_paragraphs or has_bullet_or_numbering,
        "assessment_type": "text_based_communication",
        "methodology": "Assesses text organization, paragraph flow, and conciseness. Vocal tone is not evaluated.",
    }

    return final_score, filler_count, breakdown


def evaluate_behavioral_star(answer_text: str, rubric_criteria: Optional[str]) -> Tuple[float, Dict[str, float], List[str], List[str], List[str], str]:
    """
    Evaluates behavioral interview answers according to the STAR framework:
    Situation (20%), Task (20%), Action (35%), Result (25%).
    """
    text = answer_text.strip()
    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)

    # Component checks
    s_hits = sum(len(re.findall(p, text, re.IGNORECASE)) for p in SITUATION_PATTERNS)
    t_hits = sum(len(re.findall(p, text, re.IGNORECASE)) for p in TASK_PATTERNS)
    a_hits = sum(len(re.findall(p, text, re.IGNORECASE)) for p in ACTION_PATTERNS)
    r_hits = sum(len(re.findall(p, text, re.IGNORECASE)) for p in RESULT_PATTERNS)

    # Component scores (0 - 100)
    # Situation score
    if s_hits >= 2 or (s_hits >= 1 and word_count >= 60):
        s_score = 90.0
    elif s_hits >= 1:
        s_score = 75.0
    elif word_count >= 80:
        s_score = 60.0
    else:
        s_score = 40.0

    # Task score
    if t_hits >= 2:
        t_score = 92.0
    elif t_hits >= 1:
        t_score = 80.0
    elif word_count >= 80:
        t_score = 65.0
    else:
        t_score = 45.0

    # Action score (heavily weighted: must show personal agency)
    if a_hits >= 3:
        a_score = 95.0
    elif a_hits >= 2 or (a_hits >= 1 and word_count >= 60):
        a_score = 85.0
    elif a_hits >= 1:
        a_score = 75.0
    elif word_count >= 80:
        a_score = 60.0
    else:
        a_score = 40.0

    # Result score (looks for metrics or clear lessons)
    if r_hits >= 2:
        r_score = 95.0
    elif r_hits >= 1:
        r_score = 82.0
    elif word_count >= 90:
        r_score = 65.0
    else:
        r_score = 40.0

    star_scores = {
        "situation": s_score,
        "task": t_score,
        "action": a_score,
        "result": r_score,
    }

    # Weighted content score: S(20%) + T(20%) + A(35%) + R(25%)
    content_score = round(
        0.20 * s_score + 0.20 * t_score + 0.35 * a_score + 0.25 * r_score,
        1,
    )

    strengths = []
    missing = []
    suggestions = []

    if s_score >= 80:
        strengths.append("Clearly established the background context and constraints of the situation.")
    else:
        missing.append("More explicit background context regarding company/team constraints.")
        suggestions.append("Open with a concrete 1-2 sentence framing describing the exact challenge and timeline.")

    if t_score >= 80:
        strengths.append("Articulated specific personal ownership and project objectives.")
    else:
        missing.append("Clear distinction between your individual responsibility and overall team goals.")
        suggestions.append("State explicitly: 'My specific task was to...' to highlight personal ownership.")

    if a_score >= 80:
        strengths.append("Demonstrated decisive personal initiative with concrete first-person actions ('I designed/implemented').")
    else:
        missing.append("Specific first-person actions detailing your exact engineering decisions.")
        suggestions.append("Emphasize what YOU personally built, investigated, or refactored rather than generalized team efforts.")

    if r_score >= 80:
        strengths.append("Highlighted measurable outcomes, quantifiable metrics, or key takeaways.")
    else:
        missing.append("Quantifiable metrics or long-term operational impact.")
        suggestions.append("Include measurable results (e.g. '% latency reduction', 'saved hours', 'zero rollback releases').")

    feedback_text = (
        f"Behavioral evaluation using the STAR framework. Demonstrated solid agency with a content score of {content_score}/100. "
        + (" ".join(strengths[:2]))
    )

    return content_score, star_scores, strengths, missing, suggestions, feedback_text


def evaluate_technical_situational(
    question_text: str,
    answer_text: str,
    q_type: QuestionType,
    difficulty: QuestionDifficulty,
    rubric_criteria: Optional[str],
    target_skill: Optional[str],
) -> Tuple[float, List[str], List[str], List[str], str]:
    """
    Evaluates technical or situational answers:
    - Correctness & concept alignment
    - Relevance to question prompt
    - Practical reasoning & trade-off analysis
    - Supporting evidence and architectural grounding
    NOTE: STAR rubric is strictly omitted as it does not apply to non-behavioral prompts.
    """
    text = answer_text.strip()
    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)

    # Core concept check
    skill_mentioned = False
    if target_skill and target_skill.lower() in text.lower():
        skill_mentioned = True

    # Look for trade-off and reasoning markers
    reasoning_hits = len(re.findall(
        r"\b(because|trade-off|tradeoff|in order to|instead of|alternative|scalability|latency|reliability|throughput|bottleneck|failure mode|mitigation|rollback|telemetry|metrics)\b",
        text,
        re.IGNORECASE,
    ))

    # Look for concrete architectural or technical mechanisms
    tech_hits = len(re.findall(
        r"\b(cache|redis|postgres|database|index|queue|kafka|asynchronous|concurrency|mutex|lock|replica|load balancer|api|docker|kubernetes|circuit breaker|log|exception)\b",
        text,
        re.IGNORECASE,
    ))

    # 1. Correctness & Concept Alignment (0-100)
    base_correctness = 70.0
    if skill_mentioned:
        base_correctness += 10.0
    if tech_hits >= 3:
        base_correctness += 12.0
    elif tech_hits >= 1:
        base_correctness += 6.0
    if word_count < 25:
        base_correctness -= 25.0
    correctness = max(35.0, min(base_correctness, 96.0))

    # 2. Relevance (0-100)
    relevance = 80.0
    if word_count >= 50:
        relevance += 10.0
    if word_count < 20:
        relevance -= 30.0

    # 3. Practical Reasoning & Trade-offs (0-100)
    reasoning = 65.0
    if reasoning_hits >= 3:
        reasoning += 25.0
    elif reasoning_hits >= 1:
        reasoning += 15.0

    # 4. Evidence & Real-world Depth (0-100)
    evidence = 65.0
    if word_count >= 80:
        evidence += 15.0
    if "for example" in text.lower() or "in production" in text.lower() or "in my experience" in text.lower():
        evidence += 15.0

    # Weighted content score: 35% Correctness + 25% Relevance + 20% Reasoning + 20% Evidence
    content_score = round(
        0.35 * correctness + 0.25 * relevance + 0.20 * reasoning + 0.20 * evidence,
        1,
    )

    strengths = []
    missing = []
    suggestions = []

    if skill_mentioned or tech_hits >= 2:
        strengths.append(f"Addressed relevant architectural mechanisms relating to {target_skill or 'the technical requirements'}.")
    if reasoning_hits >= 2:
        strengths.append("Analyzed practical engineering trade-offs and operational failure modes.")
    else:
        missing.append("Discussion of performance trade-offs and edge-case handling.")
        suggestions.append("Explicitly state the trade-offs (e.g. latency vs consistency, complexity vs maintainability).")

    if word_count < 40:
        missing.append("Depth of technical explanation.")
        suggestions.append("Provide a deeper walkthrough with concrete implementation steps and monitoring metrics.")
    else:
        strengths.append("Provided a well-elaborated technical response with clear sequencing.")

    feedback_text = (
        f"Technical assessment evaluated on architectural correctness and practical reasoning. "
        f"Awarded {content_score}/100. "
        + (" ".join(strengths[:2]))
    )

    return content_score, strengths, missing, suggestions, feedback_text


def evaluate_answer(
    question_text: str,
    question_type: QuestionType,
    difficulty: QuestionDifficulty,
    answer_text: str,
    rubric_criteria: Optional[str] = None,
    target_skill: Optional[str] = None,
    role_title: Optional[str] = None,
    duration_seconds: Optional[float] = None,
    pause_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates candidate interview answer.
    - Evaluates communication score based strictly on text-visible qualities.
    - Evaluates content score with STAR rubric if behavioral, or technical/situational rubric if non-behavioral.
    - Computes evidence-based speech analytics (word count, filler rate, speaking pace, pauses).
    - Uses configured AI provider if available; falls back immediately to deterministic evaluator.
    """
    # 1. Text communication score & speech analytics
    comm_score, filler_count, comm_breakdown = evaluate_text_communication(answer_text)
    speech_analytics = compute_speech_analytics(
        transcript=answer_text,
        duration_seconds=duration_seconds,
        pause_data=pause_data,
    )

    # 2. Check for AI provider evaluation
    ai_provider = get_ai_provider()
    if hasattr(ai_provider, "evaluate_answer"):
        try:
            context = {
                "question_text": question_text,
                "question_type": question_type.value if hasattr(question_type, "value") else str(question_type),
                "difficulty": difficulty.value if hasattr(difficulty, "value") else str(difficulty),
                "rubric_criteria": rubric_criteria,
                "target_skill": target_skill,
                "role_title": role_title,
                "answer_text": answer_text,
            }
            ai_eval = ai_provider.evaluate_answer(context)
            if ai_eval and isinstance(ai_eval, dict) and "content_score" in ai_eval:
                ai_eval["communication_score"] = comm_score
                ai_eval["filler_word_count"] = filler_count
                ai_eval["speech_analytics"] = speech_analytics
                ai_eval["evaluation_details"] = {
                    "strengths": ai_eval.get("strengths", []),
                    "missing_elements": ai_eval.get("missing_elements", []),
                    "suggestions": ai_eval.get("suggestions", []),
                    "communication_breakdown": comm_breakdown,
                    "engine": "gemini",
                }
                return ai_eval
        except Exception as exc:
            logger.warning("AI provider failed to evaluate answer (%s). Falling back to deterministic engine.", exc)

    # 3. Deterministic evaluation
    if question_type == QuestionType.BEHAVIORAL:
        content_score, star_scores, strengths, missing, suggestions, feedback = evaluate_behavioral_star(
            answer_text, rubric_criteria
        )
    else:
        star_scores = None
        content_score, strengths, missing, suggestions, feedback = evaluate_technical_situational(
            question_text, answer_text, question_type, difficulty, rubric_criteria, target_skill
        )

    return {
        "content_score": content_score,
        "communication_score": comm_score,
        "filler_word_count": filler_count,
        "star_component_scores": star_scores,
        "speech_analytics": speech_analytics,
        "feedback_text": feedback,
        "strengths": strengths,
        "missing_elements": missing,
        "suggestions": suggestions,
        "evaluation_details": {
            "strengths": strengths,
            "missing_elements": missing,
            "suggestions": suggestions,
            "communication_breakdown": comm_breakdown,
            "engine": "deterministic",
        },
    }
