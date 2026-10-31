from typing import Dict, Any, List, Optional
from app.models.session import Session
from app.models.question import Question
from app.models.answer import Answer
from app.models.enums import QuestionType, SessionStatus


def generate_interview_report(session: Session) -> Dict[str, Any]:
    """
    Constructs a comprehensive interview report from saved questions, answers, and evaluations.
    Excludes pending or failed evaluations from aggregate score formulas.
    Never treats missing scores as zero.
    Integrates speech analytics and adaptive difficulty progression.
    """
    questions: List[Question] = session.questions or []
    total_questions = len(questions)

    # Map answers by question_id
    answer_map: Dict[str, Answer] = {}
    for q in questions:
        for ans in q.answers:
            answer_map[str(q.id)] = ans

    completed_questions = len(answer_map)
    evaluated_count = sum(
        1 for ans in answer_map.values()
        if ans.evaluation_status == "completed" and ans.content_score is not None
    )
    pending_count = sum(
        1 for ans in answer_map.values()
        if ans.evaluation_status == "pending"
    )
    failed_count = sum(
        1 for ans in answer_map.values()
        if ans.evaluation_status == "failed"
    )

    # 1. Score Aggregations (Strictly excluding pending, failed, or missing scores)
    valid_content_scores = [
        ans.content_score for ans in answer_map.values()
        if ans.evaluation_status == "completed" and ans.content_score is not None
    ]
    valid_comm_scores = [
        ans.communication_score for ans in answer_map.values()
        if ans.evaluation_status == "completed" and ans.communication_score is not None
    ]

    avg_content_score: Optional[float] = None
    if valid_content_scores:
        avg_content_score = round(sum(valid_content_scores) / len(valid_content_scores), 1)

    avg_comm_score: Optional[float] = None
    if valid_comm_scores:
        avg_comm_score = round(sum(valid_comm_scores) / len(valid_comm_scores), 1)

    overall_score: Optional[float] = None
    if avg_content_score is not None and avg_comm_score is not None:
        overall_score = round(0.75 * avg_content_score + 0.25 * avg_comm_score, 1)
    elif avg_content_score is not None:
        overall_score = avg_content_score

    # 2. Behavioral STAR Breakdown
    star_situations: List[float] = []
    star_tasks: List[float] = []
    star_actions: List[float] = []
    star_results: List[float] = []

    for q in questions:
        if q.type == QuestionType.BEHAVIORAL and str(q.id) in answer_map:
            ans = answer_map[str(q.id)]
            if ans.evaluation_status == "completed" and isinstance(ans.star_component_scores, dict):
                scores = ans.star_component_scores
                if "situation" in scores and scores["situation"] is not None:
                    star_situations.append(float(scores["situation"]))
                if "task" in scores and scores["task"] is not None:
                    star_tasks.append(float(scores["task"]))
                if "action" in scores and scores["action"] is not None:
                    star_actions.append(float(scores["action"]))
                if "result" in scores and scores["result"] is not None:
                    star_results.append(float(scores["result"]))

    star_breakdown: Optional[Dict[str, float]] = None
    if star_situations or star_tasks or star_actions or star_results:
        star_breakdown = {
            "situation": round(sum(star_situations) / len(star_situations), 1) if star_situations else 0.0,
            "task": round(sum(star_tasks) / len(star_tasks), 1) if star_tasks else 0.0,
            "action": round(sum(star_actions) / len(star_actions), 1) if star_actions else 0.0,
            "result": round(sum(star_results) / len(star_results), 1) if star_results else 0.0,
        }

    # 3. Speech Analytics Aggregation
    speech_paces: List[float] = []
    total_words = 0
    total_fillers = 0
    pause_counts: List[int] = []

    for ans in answer_map.values():
        if isinstance(ans.speech_analytics, dict):
            sa = ans.speech_analytics
            # Word count
            if isinstance(sa.get("word_count"), dict) and sa["word_count"].get("value"):
                total_words += sa["word_count"]["value"]
            # Fillers
            if isinstance(sa.get("filler_words"), dict) and sa["filler_words"].get("count") is not None:
                total_fillers += sa["filler_words"]["count"]
            # Pace
            if (
                isinstance(sa.get("speaking_pace"), dict)
                and sa["speaking_pace"].get("status") == "available"
                and sa["speaking_pace"].get("value")
            ):
                speech_paces.append(float(sa["speaking_pace"]["value"]))
            # Pauses
            if (
                isinstance(sa.get("pauses"), dict)
                and sa["pauses"].get("status") == "available"
                and isinstance(sa["pauses"].get("value"), dict)
            ):
                pause_counts.append(sa["pauses"]["value"].get("pause_count", 0))

    speech_analytics_summary: Optional[Dict[str, Any]] = None
    if answer_map:
        avg_pace = round(sum(speech_paces) / len(speech_paces), 1) if speech_paces else None
        overall_filler_rate = round((total_fillers / total_words * 100.0), 1) if total_words > 0 else 0.0

        speech_analytics_summary = {
            "total_words_spoken": total_words,
            "total_filler_words": total_fillers,
            "average_filler_rate_per_100": overall_filler_rate,
            "average_speaking_pace_wpm": avg_pace,
            "speaking_pace_status": "available" if avg_pace is not None else "unavailable",
            "speaking_pace_reason": (
                f"Computed across {len(speech_paces)} recorded audio responses."
                if avg_pace is not None
                else "Speech duration was not recorded for submitted answers."
            ),
            "pause_tracking_status": "available" if pause_counts else "unavailable",
            "pause_tracking_reason": (
                f"Tracked across {len(pause_counts)} responses with audio silence detection."
                if pause_counts
                else "Pause timing requires audio-level silence tracking."
            ),
        }

    # 4. Difficulty Progression
    difficulty_progression: List[Dict[str, Any]] = []
    for q in questions:
        difficulty_progression.append({
            "order_index": q.order_index,
            "target_skill": q.target_skill,
            "type": q.type.value if hasattr(q.type, "value") else str(q.type),
            "difficulty": q.difficulty.value if hasattr(q.difficulty, "value") else str(q.difficulty),
            "adaptation_reason": q.adaptation_reason or "Derived from baseline interview setup.",
            "has_answer": str(q.id) in answer_map,
        })

    # 5. Question-by-Question Feedback Compilation
    questions_feedback: List[Dict[str, Any]] = []
    strongest_areas: List[str] = []
    improvement_areas: List[str] = []
    verified_skills: List[str] = []
    weak_skills_detected: List[str] = []

    for q in questions:
        ans = answer_map.get(str(q.id))
        q_item: Dict[str, Any] = {
            "question_id": str(q.id),
            "order_index": q.order_index,
            "question_text": q.question_text,
            "type": q.type.value if hasattr(q.type, "value") else str(q.type),
            "difficulty": q.difficulty.value if hasattr(q.difficulty, "value") else str(q.difficulty),
            "target_skill": q.target_skill,
            "adaptation_reason": q.adaptation_reason,
            "has_answer": ans is not None,
            "answer_text": ans.answer_text if ans else None,
            "audio_duration_seconds": ans.audio_duration_seconds if ans else None,
            "speech_analytics": ans.speech_analytics if ans else None,
            "evaluation_status": ans.evaluation_status if ans else "unanswered",
            "content_score": ans.content_score if ans else None,
            "communication_score": ans.communication_score if ans else None,
            "feedback_text": ans.feedback_text if ans else None,
            "star_component_scores": ans.star_component_scores if ans else None,
            "strengths": ans.evaluation_details.get("strengths", []) if (ans and ans.evaluation_details) else [],
            "missing_elements": ans.evaluation_details.get("missing_elements", []) if (ans and ans.evaluation_details) else [],
            "suggestions": ans.evaluation_details.get("suggestions", []) if (ans and ans.evaluation_details) else [],
        }
        questions_feedback.append(q_item)

        # Identify strengths and improvement areas
        if ans and ans.evaluation_status == "completed" and ans.content_score is not None:
            skill_tag = q.target_skill or f"Question #{q.order_index + 1} ({q.type.value})"
            if ans.content_score >= 80:
                strongest_areas.append(f"{skill_tag}: Demonstrated strong domain knowledge and structured reasoning.")
                if q.target_skill and q.target_skill not in verified_skills:
                    verified_skills.append(q.target_skill)
            elif ans.content_score < 70:
                improvement_areas.append(f"{skill_tag}: Could benefit from deeper technical specificity and revision.")
                if q.target_skill and q.target_skill not in weak_skills_detected:
                    weak_skills_detected.append(q.target_skill)

    # Deduplicate areas
    strongest_areas = list(dict.fromkeys(strongest_areas))
    improvement_areas = list(dict.fromkeys(improvement_areas))

    if not strongest_areas and evaluated_count > 0:
        strongest_areas.append("Demonstrated foundational engagement across evaluated questions.")

    if not improvement_areas and evaluated_count > 0:
        improvement_areas.append("Maintain current level of detail while continuing to practice edge-case trade-offs.")

    # 6. Actionable Preparation Recommendations (Constructive & Growth-Oriented)
    actionable_recommendations: List[str] = []
    if weak_skills_detected:
        actionable_recommendations.append(
            f"Targeted Growth Area: Prioritize a 20-minute conceptual refresh on {', '.join(weak_skills_detected[:3])} to reinforce claimed resume competencies."
        )
    if speech_analytics_summary and speech_analytics_summary.get("average_speaking_pace_wpm"):
        pace = speech_analytics_summary["average_speaking_pace_wpm"]
        if pace > 165:
            actionable_recommendations.append(
                f"Your average speaking pace was {pace} WPM. Moderating your speed will help complex technical ideas land effectively."
            )
        elif pace < 105:
            actionable_recommendations.append(
                f"Your average speaking pace was {pace} WPM. Practicing common engineering narratives can build fluid delivery momentum."
            )

    if star_breakdown and star_breakdown.get("result", 100) < 75:
        actionable_recommendations.append(
            "Structure behavioral answers with explicit quantifiable impact (e.g. latency reduced by X%, team delivery accelerated by Y weeks)."
        )
    if avg_comm_score is not None and avg_comm_score < 75:
        actionable_recommendations.append(
            "Structure written and spoken responses into distinct paragraphs or bullet points to enhance immediate clarity."
        )
    actionable_recommendations.append(
        f"Continue practicing architectural trade-offs specific to the {session.role_title or 'target'} role."
    )
    actionable_recommendations.append(
        "Address identified skill gaps directly by explaining adjacent tooling and willingness to rapidly ramp up."
    )

    scoring_methodology = (
        "Content Score evaluates technical correctness, relevance, and STAR completeness on a 0-100 scale. "
        "Text-Based Communication Score evaluates written clarity, paragraph flow, and conciseness. "
        "Overall Score = 75% Average Content + 25% Average Communication. "
        "Pending and failed evaluations are excluded from averages."
    )

    disclaimer = (
        "PrepVerse AI is an educational preparation and interview readiness aid. Scores and feedback reflect automated "
        "rubric analysis and do not constitute an official employment evaluation, hiring prediction, or guarantee of interview success."
    )

    return {
        "session_id": str(session.id),
        "role_title": session.role_title,
        "status": session.status,
        "interview_mode": getattr(session, "interview_mode", "text") or "text",
        "is_adaptive": getattr(session, "is_adaptive", True),
        "practice_mode": getattr(session, "practice_mode", "mock_interview") or "mock_interview",
        "target_focus": getattr(session, "target_focus", None),
        "created_at": session.created_at,
        "completed_at": session.completed_at,
        "total_questions": total_questions,
        "completed_questions": completed_questions,
        "evaluated_count": evaluated_count,
        "pending_count": pending_count,
        "failed_count": failed_count,
        "average_content_score": avg_content_score,
        "average_communication_score": avg_comm_score,
        "overall_score": overall_score,
        "star_breakdown": star_breakdown,
        "speech_analytics_summary": speech_analytics_summary,
        "difficulty_progression": difficulty_progression,
        "strongest_areas": strongest_areas,
        "improvement_areas": improvement_areas,
        "verified_skills": verified_skills,
        "weak_skills_detected": weak_skills_detected,
        "actionable_recommendations": actionable_recommendations,
        "questions_feedback": questions_feedback,
        "scoring_methodology": scoring_methodology,
        "disclaimer": disclaimer,
    }
