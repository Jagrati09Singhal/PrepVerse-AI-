import pytest
from uuid import uuid4
from app.models.enums import QuestionDifficulty, QuestionType
from app.models.answer import Answer
from app.models.question import Question
from app.services.adaptive_difficulty import (
    compute_next_difficulty,
    adapt_upcoming_question,
)


def make_dummy_answer(score: float, status: str = "completed") -> Answer:
    ans = Answer(
        id=uuid4(),
        question_id=uuid4(),
        answer_text="Sample evaluated answer text.",
        content_score=score,
        evaluation_status=status,
    )
    return ans


def test_adaptive_difficulty_increases_on_high_score():
    """Verifies that high evaluation performance (>= 80%) increases difficulty by one rank."""
    answers = [make_dummy_answer(85.0)]
    new_diff, reason = compute_next_difficulty(answers, QuestionDifficulty.MEDIUM)
    assert new_diff == QuestionDifficulty.HARD
    assert "Difficulty increased to hard" in reason


def test_adaptive_difficulty_decreases_on_low_score():
    """Verifies that low evaluation performance (< 60%) decreases difficulty by one rank."""
    answers = [make_dummy_answer(52.0)]
    new_diff, reason = compute_next_difficulty(answers, QuestionDifficulty.MEDIUM)
    assert new_diff == QuestionDifficulty.EASY
    assert "Difficulty adjusted to easy" in reason


def test_adaptive_difficulty_maintains_on_moderate_score():
    """Verifies that moderate scores (60-79%) maintain current difficulty."""
    answers = [make_dummy_answer(72.0)]
    new_diff, reason = compute_next_difficulty(answers, QuestionDifficulty.MEDIUM)
    assert new_diff == QuestionDifficulty.MEDIUM
    assert "Difficulty maintained at medium" in reason


def test_adaptive_difficulty_bounded_at_maximum():
    """Verifies that difficulty cannot exceed HARD even with a 100% score."""
    answers = [make_dummy_answer(98.0)]
    new_diff, reason = compute_next_difficulty(answers, QuestionDifficulty.HARD)
    assert new_diff == QuestionDifficulty.HARD
    assert "Maintained at advanced difficulty" in reason


def test_adaptive_difficulty_bounded_at_minimum():
    """Verifies that difficulty cannot drop below EASY even with a 35% score."""
    answers = [make_dummy_answer(40.0)]
    new_diff, reason = compute_next_difficulty(answers, QuestionDifficulty.EASY)
    assert new_diff == QuestionDifficulty.EASY
    assert "Maintained at foundational difficulty" in reason


def test_adaptive_difficulty_ignores_pending_and_failed_answers():
    """Verifies that pending or failed answers are excluded from adaptive difficulty calculation."""
    answers = [
        make_dummy_answer(88.0, status="completed"),
        make_dummy_answer(0.0, status="failed"),
        make_dummy_answer(0.0, status="pending"),
    ]
    # Only the completed 88.0 answer should be evaluated
    new_diff, reason = compute_next_difficulty(answers, QuestionDifficulty.EASY)
    assert new_diff == QuestionDifficulty.MEDIUM


def test_adapt_upcoming_question_adjusts_rubric_and_text():
    """Verifies that adapting an upcoming question updates its difficulty, text, and adaptation reason."""
    q = Question(
        id=uuid4(),
        session_id=uuid4(),
        question_text="Initial medium difficulty question.",
        type=QuestionType.TECHNICAL,
        difficulty=QuestionDifficulty.MEDIUM,
        order_index=1,
        target_skill="Docker",
    )
    answers = [make_dummy_answer(90.0)]

    adapted_q = adapt_upcoming_question(q, answers, role_title="DevOps Lead")
    assert adapted_q.difficulty == QuestionDifficulty.HARD
    assert "Advancing to high difficulty" in adapted_q.question_text
    assert "Difficulty increased to hard" in adapted_q.adaptation_reason
    assert adapted_q.rubric_criteria is not None

