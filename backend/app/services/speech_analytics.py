import re
import logging
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger(__name__)

# Documented canonical filler dictionary
CONFIGURABLE_FILLER_TERMS = [
    r"\bum\b",
    r"\buh\b",
    r"\blike\b",
    r"\bbasically\b",
    r"\byou know\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\bobviously\b",
    r"\bto be honest\b",
    r"\bliterally\b",
    r"\bactually\b",
    r"\bi mean\b",
    r"\bat the end of the day\b",
    r"\bfor the most part\b",
]

# Optimal conversational pace benchmarks (Words Per Minute)
MIN_OPTIMAL_WPM = 110.0
MAX_OPTIMAL_WPM = 160.0


def extract_filler_words(text: str) -> Tuple[int, List[str]]:
    """
    Counts and extracts documented filler phrases from text.
    """
    total_count = 0
    detected_fillers: List[str] = []

    for pattern in CONFIGURABLE_FILLER_TERMS:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if matches:
            total_count += len(matches)
            detected_fillers.extend([m.lower() for m in matches])

    return total_count, detected_fillers


def compute_speech_analytics(
    transcript: str,
    duration_seconds: Optional[float] = None,
    pause_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Computes evidence-based speech analytics strictly from verifiable data.
    - Word count & filler rate (derived from transcript).
    - Speaking pace (WPM) computed ONLY when reliable duration is provided (> 5.0s).
    - Pause count and pause statistics computed ONLY when client audio silence data exists.
    - Unavailable metrics are marked as 'unavailable' with transparent reasons (never 0).
    - Speech analytics are isolated from content evaluation scores.
    """
    clean_text = transcript.strip() if transcript else ""
    words = re.findall(r"\b\w+\b", clean_text)
    word_count = len(words)

    # 1. Filler Analysis
    filler_count, detected_fillers = extract_filler_words(clean_text)
    filler_rate_per_100 = round((filler_count / word_count * 100.0), 1) if word_count > 0 else 0.0

    # 2. Speaking Pace Calculation
    speaking_pace: Dict[str, Any] = {
        "metric": "speaking_pace_wpm",
        "label": "Speaking Pace",
        "value": None,
        "status": "unavailable",
        "unit": "words per minute",
        "interpretation": None,
        "reason": "Speech duration was not recorded for this response. Pace cannot be calculated from plain text alone.",
    }

    if duration_seconds is not None and duration_seconds >= 5.0 and word_count > 0:
        minutes = duration_seconds / 60.0
        wpm = round(word_count / minutes, 1)

        if wpm < MIN_OPTIMAL_WPM:
            interp = f"Deliberate pace ({wpm} WPM). Speaking a bit more fluidly will keep responses engaging."
        elif MIN_OPTIMAL_WPM <= wpm <= MAX_OPTIMAL_WPM:
            interp = f"Conversational, optimal pace ({wpm} WPM). Fits standard technical and behavioral interviews well."
        else:
            interp = f"Rapid pace ({wpm} WPM). Slowing down slightly can help emphasize key architectural trade-offs."

        speaking_pace = {
            "metric": "speaking_pace_wpm",
            "label": "Speaking Pace",
            "value": wpm,
            "status": "available",
            "unit": "words per minute",
            "duration_seconds": round(duration_seconds, 1),
            "interpretation": interp,
            "reason": None,
        }

    # 3. Pause Analysis
    pause_metrics: Dict[str, Any] = {
        "metric": "pause_analysis",
        "label": "Speech Pauses",
        "value": None,
        "status": "unavailable",
        "reason": "Pause timing data requires audio silence tracking and is unavailable for plain text transcripts.",
    }

    if pause_data and isinstance(pause_data, dict) and "pause_count" in pause_data:
        p_count = pause_data.get("pause_count", 0)
        p_total_dur = pause_data.get("total_pause_duration_seconds", 0.0)
        avg_pause = round(p_total_dur / p_count, 1) if p_count > 0 else 0.0

        pause_metrics = {
            "metric": "pause_analysis",
            "label": "Speech Pauses",
            "value": {
                "pause_count": p_count,
                "total_pause_duration_seconds": round(p_total_dur, 1),
                "average_pause_seconds": avg_pause,
            },
            "status": "available",
            "interpretation": f"Recorded {p_count} noticeable pauses averaging {avg_pause}s.",
            "reason": None,
        }

    # 4. Transcript Organization & Clarity
    has_paragraphs = "\n" in clean_text
    has_bullets = bool(re.search(r"(^|\n)\s*([*-]|\d+\.)\s+", clean_text))
    has_connectors = bool(re.search(
        r"\b(first|secondly|additionally|furthermore|consequently|for example|in conclusion)\b",
        clean_text,
        re.IGNORECASE,
    ))

    clarity_notes: List[str] = []
    if has_paragraphs or has_bullets:
        clarity_notes.append("Good structural organization with distinct paragraph or list divisions.")
    if has_connectors:
        clarity_notes.append("Effective use of sequential transitional words to guide the listener.")
    if word_count < 30:
        clarity_notes.append("Answer is concise; consider elaborating with concrete implementation steps.")
    elif word_count > 500:
        clarity_notes.append("Comprehensive response; prioritize the core outcome earlier to avoid meandering.")
    if not clarity_notes:
        clarity_notes.append("Clear and direct prose without obvious organizational blockers.")

    # 5. Targeted Actionable Suggestion
    suggestions: List[str] = []
    if filler_rate_per_100 > 3.0:
        suggestions.append(
            f"Filler word density is {filler_rate_per_100}% ({filler_count} detected: {', '.join(set(detected_fillers[:3]))}). "
            "Try replacing filler words with a brief silent pause to project poise."
        )
    elif speaking_pace["status"] == "available" and speaking_pace["value"] > 165:
        suggestions.append(
            "Speaking speed is over 165 WPM. Pausing between key architectural points will allow interviewers to absorb complex details."
        )
    elif speaking_pace["status"] == "available" and speaking_pace["value"] < 100:
        suggestions.append(
            "Speaking pace is under 100 WPM. Rehearsing common technical walkthroughs can build smoother conversational momentum."
        )
    else:
        suggestions.append(
            "Maintain current pacing and vocal clarity while continuing to structure answers with Situation, Task, Action, and Result."
        )

    return {
        "word_count": {
            "value": word_count,
            "status": "available",
            "interpretation": f"{word_count} total words transcribed.",
        },
        "filler_words": {
            "count": filler_count,
            "rate_per_100_words": filler_rate_per_100,
            "detected_sample": list(set(detected_fillers))[:5],
            "status": "available",
            "interpretation": f"{filler_count} filler words detected ({filler_rate_per_100} per 100 words).",
        },
        "speaking_pace": speaking_pace,
        "pauses": pause_metrics,
        "clarity_feedback": clarity_notes,
        "actionable_suggestion": suggestions[0] if suggestions else "Continue practicing structured responses.",
        "methodology": (
            "Speech analytics derive pace (WPM) strictly when speech duration is recorded, and pause metrics only when audio silence tracking is present. "
            "These metrics evaluate delivery mechanics only and are never factored into hiring predictions or candidate merit."
        ),
        "disclaimer": (
            "PrepVerse AI speech analytics do not evaluate vocal tone, accents, dialects, or emotional inflection. "
            "Metrics are provided strictly as private self-improvement aids."
        ),
    }

