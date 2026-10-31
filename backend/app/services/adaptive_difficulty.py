import logging
from typing import List, Tuple, Optional
from app.models.enums import QuestionDifficulty, QuestionType
from app.models.answer import Answer
from app.models.question import Question

logger = logging.getLogger(__name__)

DIFF_TO_RANK = {
    QuestionDifficulty.EASY: 1,
    QuestionDifficulty.MEDIUM: 2,
    QuestionDifficulty.HARD: 3,
}

RANK_TO_DIFF = {
    1: QuestionDifficulty.EASY,
    2: QuestionDifficulty.MEDIUM,
    3: QuestionDifficulty.HARD,
}


def compute_next_difficulty(
    completed_answers: List[Answer],
    current_difficulty: QuestionDifficulty,
) -> Tuple[QuestionDifficulty, str]:
    """
    Computes performance-based adaptive difficulty for the next interview question:
    - Evaluates completed, validly evaluated answers only.
    - Inspects the trajectory of recent 1-2 evaluations.
    - Upgrades difficulty by +1 if performance is strong (avg >= 80%).
    - Downgrades difficulty by -1 if performance is weak (avg < 60%).
    - Keeps difficulty stable if mixed (60% to 79.9%) or at bounds.
    - Returns (new_difficulty, user_facing_adaptation_reason).
    """
    valid_answers = [
        a for a in completed_answers
        if a.evaluation_status == "completed" and a.content_score is not None
    ]

    if not valid_answers:
        return (
            current_difficulty,
            "Initial baseline difficulty derived from your interview setup parameters.",
        )

    # Window of recent evaluations (last 1-2 answers)
    recent_answers = valid_answers[-2:]
    recent_scores = [a.content_score for a in recent_answers if a.content_score is not None]
    avg_score = round(sum(recent_scores) / len(recent_scores), 1)

    curr_rank = DIFF_TO_RANK.get(current_difficulty, 2)

    if avg_score >= 80.0:
        new_rank = min(curr_rank + 1, 3)
        new_diff = RANK_TO_DIFF[new_rank]
        if new_rank > curr_rank:
            reason = (
                f"Difficulty increased to {new_diff.value} because your recent answers "
                f"demonstrated strong practical reasoning and depth (recent average: {avg_score}%)."
            )
        else:
            reason = (
                f"Maintained at advanced difficulty ({current_difficulty.value}) "
                f"following consistently strong evaluations (recent average: {avg_score}%)."
            )
    elif avg_score < 60.0:
        new_rank = max(curr_rank - 1, 1)
        new_diff = RANK_TO_DIFF[new_rank]
        if new_rank < curr_rank:
            reason = (
                f"Difficulty adjusted to {new_diff.value} to consolidate core fundamentals "
                f"before progressing (recent average: {avg_score}%)."
            )
        else:
            reason = (
                f"Maintained at foundational difficulty ({current_difficulty.value}) "
                f"to support deliberate practice (recent average: {avg_score}%)."
            )
    else:
        new_diff = current_difficulty
        reason = (
            f"Difficulty maintained at {current_difficulty.value} "
            f"reflecting solid, steady performance (recent average: {avg_score}%)."
        )

    return new_diff, reason


def adapt_upcoming_question(
    upcoming_question: Question,
    completed_answers: List[Answer],
    role_title: Optional[str] = None,
    skill_gaps: Optional[List[str]] = None,
) -> Question:
    """
    Applies adaptive difficulty progression to an upcoming unanswered question:
    - Never changes difficulty of questions already presented or answered.
    - Records the explicit adaptation reason on the question.
    - Calibrates question wording to match the new difficulty if adjusted.
    """
    new_diff, reason = compute_next_difficulty(
        completed_answers=completed_answers,
        current_difficulty=upcoming_question.difficulty,
    )

    old_diff = upcoming_question.difficulty
    upcoming_question.difficulty = new_diff
    upcoming_question.adaptation_reason = reason

    # If difficulty changed and question is technical/situational, adjust phrasing depth
    if old_diff != new_diff and upcoming_question.type in (QuestionType.TECHNICAL, QuestionType.SITUATIONAL):
        clean_role = role_title or "Software Engineer"
        target = upcoming_question.target_skill or "System Architecture"

        if new_diff == QuestionDifficulty.HARD:
            upcoming_question.question_text = (
                f"Advancing to high difficulty: In the context of {clean_role}, how would you architect a fault-tolerant, "
                f"high-concurrency subsystem with {target} handling distributed consensus, graceful failure degradation, and zero data loss?"
            )
            upcoming_question.rubric_criteria = (
                f"Advanced evaluation criteria for {target}: distributed locking, partition tolerance, "
                "telemetry/metrics, backpressure, idempotency, and automated recovery."
            )
        elif new_diff == QuestionDifficulty.EASY:
            upcoming_question.question_text = (
                f"Focusing on foundational concepts: As a {clean_role}, what are the primary use-cases and core advantages "
                f"of utilizing {target}, and what fundamental patterns do you rely on in day-to-day development?"
            )
            upcoming_question.rubric_criteria = (
                f"Foundational criteria for {target}: clear explanation of purpose, basic data structures or syntax, "
                "and common developer workflows."
            )

    return upcoming_question

