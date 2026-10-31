import pytest
from app.services.speech_analytics import (
    compute_speech_analytics,
    extract_filler_words,
)


def test_extract_filler_words():
    """Verifies that documented filler words are accurately extracted and counted."""
    sample = "Basically, we had to sort of migrate the database, and you know, it was literally challenging."
    count, detected = extract_filler_words(sample)
    assert count >= 4
    assert "basically" in detected
    assert "sort of" in detected
    assert "you know" in detected
    assert "literally" in detected


def test_speaking_pace_when_duration_is_available():
    """Verifies that speaking pace (WPM) is computed when duration > 5.0 seconds is provided."""
    # 120 words spoken in 60 seconds = 120 WPM
    words = "word " * 120
    analytics = compute_speech_analytics(transcript=words, duration_seconds=60.0)

    pace = analytics["speaking_pace"]
    assert pace["status"] == "available"
    assert pace["value"] == pytest.approx(120.0, abs=1.0)
    assert "Conversational, optimal pace" in pace["interpretation"]


def test_speaking_pace_marked_unavailable_without_duration():
    """Verifies speaking pace is strictly marked unavailable when speech duration is absent or <= 0."""
    sample = "This is a response without recorded speech duration."
    analytics = compute_speech_analytics(transcript=sample, duration_seconds=None)

    pace = analytics["speaking_pace"]
    assert pace["status"] == "unavailable"
    assert pace["value"] is None
    assert "Pace cannot be calculated from plain text alone" in pace["reason"]


def test_pause_metrics_availability():
    """Verifies pause metrics are available only when audio timing data is provided."""
    # When timing data is missing
    no_pauses = compute_speech_analytics(transcript="Sample response without pause data.", duration_seconds=20.0)
    assert no_pauses["pauses"]["status"] == "unavailable"
    assert no_pauses["pauses"]["value"] is None

    # When timing data is present
    pause_data = {
        "pause_count": 4,
        "total_pause_duration_seconds": 6.0,
    }
    with_pauses = compute_speech_analytics(
        transcript="Sample response with measured silence breaks.",
        duration_seconds=25.0,
        pause_data=pause_data,
    )
    assert with_pauses["pauses"]["status"] == "available"
    assert with_pauses["pauses"]["value"]["pause_count"] == 4
    assert with_pauses["pauses"]["value"]["average_pause_seconds"] == 1.5


def test_filler_rate_calculation():
    """Verifies filler word count and rate per 100 words calculation."""
    # 50 words with 2 fillers = 4.0%
    filler_sample = "Basically, we designed the cache and you know it scaled well " + ("word " * 40)
    analytics = compute_speech_analytics(transcript=filler_sample, duration_seconds=20.0)

    fillers = analytics["filler_words"]
    assert fillers["status"] == "available"
    assert fillers["count"] >= 2
    assert fillers["rate_per_100_words"] > 0.0


def test_speech_analytics_disclaimer_and_isolation():
    """Verifies ethical disclaimer and methodological clarity."""
    analytics = compute_speech_analytics(transcript="Testing compliance.", duration_seconds=10.0)
    assert "do not evaluate vocal tone, accents" in analytics["disclaimer"]
    assert "never factored into hiring predictions" in analytics["methodology"]

