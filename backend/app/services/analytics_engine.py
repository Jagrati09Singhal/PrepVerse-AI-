import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.job_analysis import JobAnalysis
from app.models.resume import Resume
from app.models.enums import SessionStatus, QuestionType
from app.schemas.analytics import (
    AnalyticsOverview,
    AnalyticsSpeechSummary,
    RecentSessionActivity,
    AnalyticsTrends,
    TrendPoint,
    RolePerformance,
    CategoryPerformance,
    AnalyticsSkills,
    SkillPerformanceItem,
    AnalyticsRecommendations,
    PracticeRecommendation,
)

logger = logging.getLogger(__name__)


def compute_analytics_overview(user_id: UUID, db: DBSession) -> AnalyticsOverview:
    """
    Computes an empirical overview of the authenticated candidate's interview history.
    Excludes pending/failed evaluations from scoring averages.
    Distinguishes between unavailable metrics and genuine zeroes.
    """
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )

    total_sessions = len(sessions)
    if total_sessions == 0:
        return AnalyticsOverview(
            total_sessions=0,
            completed_sessions=0,
            in_progress_sessions=0,
            abandoned_sessions=0,
            total_evaluated_answers=0,
            average_overall_score=None,
            average_content_score=None,
            average_communication_score=None,
            speech_summary=AnalyticsSpeechSummary(),
            recent_activity=[],
            has_history=False,
            empty_history_message="No interview sessions recorded yet. Launch your first interview simulation to generate performance analytics.",
        )

    completed_sessions = sum(1 for s in sessions if s.status == SessionStatus.COMPLETED)
    in_progress_sessions = sum(1 for s in sessions if s.status == SessionStatus.IN_PROGRESS)
    abandoned_sessions = sum(1 for s in sessions if s.status in (SessionStatus.CREATED, SessionStatus.ABANDONED))

    # Average overall score across completed sessions with scores
    overall_scores = [s.overall_score for s in sessions if s.status == SessionStatus.COMPLETED and s.overall_score is not None]
    avg_overall = round(sum(overall_scores) / len(overall_scores), 1) if overall_scores else None

    # Query all completed answers belonging to this user
    completed_answers = (
        db.query(Answer)
        .join(Question, Question.id == Answer.question_id)
        .join(InterviewSession, InterviewSession.id == Question.session_id)
        .filter(InterviewSession.user_id == user_id, Answer.evaluation_status == "completed")
        .all()
    )

    total_evaluated_answers = len(completed_answers)
    content_scores = [a.content_score for a in completed_answers if a.content_score is not None]
    comm_scores = [a.communication_score for a in completed_answers if a.communication_score is not None]

    avg_content = round(sum(content_scores) / len(content_scores), 1) if content_scores else None
    avg_comm = round(sum(comm_scores) / len(comm_scores), 1) if comm_scores else None

    # Speech summary aggregation
    speech_paces = []
    filler_rates = []
    total_fillers = 0
    voice_answers_count = 0
    eligible_duration_answers = 0

    for a in completed_answers:
        if isinstance(a.speech_analytics, dict):
            voice_answers_count += 1
            sa = a.speech_analytics
            pace_obj = sa.get("speaking_pace_wpm", {})
            if isinstance(pace_obj, dict) and pace_obj.get("words_per_minute") is not None:
                speech_paces.append(float(pace_obj["words_per_minute"]))
                eligible_duration_answers += 1

            filler_obj = sa.get("filler_words", {})
            if isinstance(filler_obj, dict):
                rate = filler_obj.get("filler_rate_percentage")
                if rate is not None:
                    filler_rates.append(float(rate))
                total_fillers += int(filler_obj.get("total_filler_count", 0))

    avg_pace = round(sum(speech_paces) / len(speech_paces), 1) if speech_paces else None
    avg_filler_rate = round(sum(filler_rates) / len(filler_rates), 1) if filler_rates else None

    pace_assessment = "Unavailable"
    if avg_pace is not None:
        if avg_pace < 110:
            pace_assessment = "Deliberate / Slower Pace"
        elif avg_pace <= 160:
            pace_assessment = "Optimal Conversational Pace"
        else:
            pace_assessment = "Brisk / Fast Pace"

    speech_summary = AnalyticsSpeechSummary(
        voice_answers_count=voice_answers_count,
        average_pace_wpm=avg_pace,
        pace_assessment=pace_assessment,
        average_filler_rate_percentage=avg_filler_rate,
        total_filler_count=total_fillers,
        eligible_duration_answers=eligible_duration_answers,
    )

    # Recent activity (latest 5 sessions)
    recent_activity: List[RecentSessionActivity] = []
    for s in sessions[:5]:
        ans_count = sum(len(q.answers) for q in s.questions)
        session_answers = [
            ans for q in s.questions for ans in q.answers
            if ans.evaluation_status == "completed" and ans.content_score is not None
        ]
        s_content = round(sum(a.content_score for a in session_answers) / len(session_answers), 1) if session_answers else None

        recent_activity.append(
            RecentSessionActivity(
                session_id=s.id,
                role_title=s.role_title,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                interview_mode=getattr(s, "interview_mode", "text") or "text",
                practice_mode=getattr(s, "practice_mode", "mock_interview") or "mock_interview",
                question_count=s.question_count,
                answered_count=ans_count,
                overall_score=s.overall_score,
                content_score=s_content,
                created_at=s.created_at,
                completed_at=s.completed_at,
            )
        )

    return AnalyticsOverview(
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        in_progress_sessions=in_progress_sessions,
        abandoned_sessions=abandoned_sessions,
        total_evaluated_answers=total_evaluated_answers,
        average_overall_score=avg_overall,
        average_content_score=avg_content,
        average_communication_score=avg_comm,
        speech_summary=speech_summary,
        recent_activity=recent_activity,
        has_history=True,
        empty_history_message=None,
    )


def compute_analytics_trends(user_id: UUID, db: DBSession) -> AnalyticsTrends:
    """
    Computes chronological score progression, role breakdowns, and category patterns.
    Requires at least 2 completed sessions for a trajectory assessment.
    """
    completed_sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == user_id,
            InterviewSession.status == SessionStatus.COMPLETED,
        )
        .order_by(InterviewSession.completed_at.asc(), InterviewSession.created_at.asc())
        .all()
    )

    timeline: List[TrendPoint] = []
    for s in completed_sessions:
        s_answers = [
            ans for q in s.questions for ans in q.answers
            if ans.evaluation_status == "completed"
        ]
        s_contents = [a.content_score for a in s_answers if a.content_score is not None]
        s_comms = [a.communication_score for a in s_answers if a.communication_score is not None]

        avg_c = round(sum(s_contents) / len(s_contents), 1) if s_contents else None
        avg_comm = round(sum(s_comms) / len(s_comms), 1) if s_comms else None

        timeline.append(
            TrendPoint(
                session_id=s.id,
                date=s.completed_at or s.created_at,
                role_title=s.role_title,
                overall_score=s.overall_score,
                content_score=avg_c,
                communication_score=avg_comm,
                interview_mode=getattr(s, "interview_mode", "text") or "text",
                practice_mode=getattr(s, "practice_mode", "mock_interview") or "mock_interview",
            )
        )

    # Trajectory assessment
    if len(timeline) < 2:
        trajectory = "insufficient_data"
        trajectory_message = "At least 2 completed interview sessions are required to establish a meaningful performance trajectory."
    else:
        first_score = timeline[0].overall_score or timeline[0].content_score or 0.0
        last_score = timeline[-1].overall_score or timeline[-1].content_score or 0.0
        delta = last_score - first_score

        if delta >= 3.0:
            trajectory = "improving"
            trajectory_message = f"Your interview performance is trending upwards (+{round(delta, 1)}% improvement over completed sessions)."
        elif delta <= -3.0:
            trajectory = "declining"
            trajectory_message = f"Recent sessions show a slight downward trend ({round(delta, 1)}%). Focused practice on weak areas is recommended."
        else:
            trajectory = "steady"
            trajectory_message = "Performance has remained stable and consistent across completed interviews."

    # Performance by role
    role_map: Dict[str, List[InterviewSession]] = {}
    for s in completed_sessions:
        r = s.role_title or "General Engineering"
        role_map.setdefault(r, []).append(s)

    performance_by_role: List[RolePerformance] = []
    for role_name, r_sessions in role_map.items():
        o_scores = [s.overall_score for s in r_sessions if s.overall_score is not None]
        avg_o = round(sum(o_scores) / len(o_scores), 1) if o_scores else None

        # Content score
        c_scores = [
            ans.content_score for s in r_sessions for q in s.questions for ans in q.answers
            if ans.evaluation_status == "completed" and ans.content_score is not None
        ]
        avg_c = round(sum(c_scores) / len(c_scores), 1) if c_scores else None

        performance_by_role.append(
            RolePerformance(
                role_title=role_name,
                session_count=len(r_sessions),
                average_overall_score=avg_o,
                average_content_score=avg_c,
            )
        )

    # Performance by category (QuestionType)
    all_eval_answers = (
        db.query(Answer, Question)
        .join(Question, Question.id == Answer.question_id)
        .join(InterviewSession, InterviewSession.id == Question.session_id)
        .filter(InterviewSession.user_id == user_id, Answer.evaluation_status == "completed")
        .all()
    )

    cat_map: Dict[str, List[Answer]] = {}
    for ans, q in all_eval_answers:
        cat_key = q.type.value if hasattr(q.type, "value") else str(q.type)
        cat_map.setdefault(cat_key, []).append(ans)

    performance_by_category: List[CategoryPerformance] = []
    for cat_name in ("technical", "behavioral", "situational"):
        ans_list = cat_map.get(cat_name, [])
        c_scores = [a.content_score for a in ans_list if a.content_score is not None]
        comm_scores = [a.communication_score for a in ans_list if a.communication_score is not None]

        performance_by_category.append(
            CategoryPerformance(
                category=cat_name.capitalize(),
                evaluated_count=len(ans_list),
                average_content_score=round(sum(c_scores) / len(c_scores), 1) if c_scores else None,
                average_communication_score=round(sum(comm_scores) / len(comm_scores), 1) if comm_scores else None,
            )
        )

    return AnalyticsTrends(
        timeline=timeline,
        performance_by_role=performance_by_role,
        performance_by_category=performance_by_category,
        trajectory=trajectory,
        trajectory_message=trajectory_message,
    )


def compute_analytics_skills(user_id: UUID, db: DBSession) -> AnalyticsSkills:
    """
    Evaluates skill and topic mastery by grouping evaluation answers by target_skill.
    Avoids declaring mastery or weakness from a single answer.
    """
    answers_and_questions = (
        db.query(Answer, Question)
        .join(Question, Question.id == Answer.question_id)
        .join(InterviewSession, InterviewSession.id == Question.session_id)
        .filter(
            InterviewSession.user_id == user_id,
            Answer.evaluation_status == "completed",
            Answer.content_score.isnot(None),
        )
        .all()
    )

    skill_groups: Dict[str, List[Answer]] = {}
    tech_scores: List[float] = []
    behav_scores: List[float] = []
    sit_scores: List[float] = []

    for ans, q in answers_and_questions:
        skill = (q.target_skill or "").strip()
        if skill and skill not in ("General Engineering", "STAR Behavioral Competency", "Situational Problem Solving"):
            skill_groups.setdefault(skill, []).append(ans)

        # Category aggregates
        if ans.content_score is not None:
            if q.type == QuestionType.TECHNICAL:
                tech_scores.append(ans.content_score)
            elif q.type == QuestionType.BEHAVIORAL:
                behav_scores.append(ans.content_score)
            elif q.type == QuestionType.SITUATIONAL:
                sit_scores.append(ans.content_score)

    strong_skills: List[SkillPerformanceItem] = []
    developing_skills: List[SkillPerformanceItem] = []
    weak_skills: List[SkillPerformanceItem] = []
    insufficient_evidence_skills: List[SkillPerformanceItem] = []

    for skill, ans_list in skill_groups.items():
        scores = [a.content_score for a in ans_list if a.content_score is not None]
        if not scores:
            continue

        avg_s = round(sum(scores) / len(scores), 1)
        min_s = round(min(scores), 1)
        max_s = round(max(scores), 1)
        count = len(scores)

        dates = [a.evaluated_at or a.created_at for a in ans_list if a.evaluated_at or a.created_at]
        last_dt = max(dates) if dates else None

        # Classification rule: at least 2 questions to classify as confirmed strong or weak
        if count < 2:
            cat = "insufficient_evidence"
            insufficient_evidence_skills.append(
                SkillPerformanceItem(
                    skill=skill,
                    evaluated_count=count,
                    average_score=avg_s,
                    min_score=min_s,
                    max_score=max_s,
                    category=cat,
                    last_practiced=last_dt,
                )
            )
        elif avg_s >= 80.0:
            cat = "strong"
            strong_skills.append(
                SkillPerformanceItem(
                    skill=skill,
                    evaluated_count=count,
                    average_score=avg_s,
                    min_score=min_s,
                    max_score=max_s,
                    category=cat,
                    last_practiced=last_dt,
                )
            )
        elif avg_s < 60.0:
            cat = "weak"
            weak_skills.append(
                SkillPerformanceItem(
                    skill=skill,
                    evaluated_count=count,
                    average_score=avg_s,
                    min_score=min_s,
                    max_score=max_s,
                    category=cat,
                    last_practiced=last_dt,
                )
            )
        else:
            cat = "developing"
            developing_skills.append(
                SkillPerformanceItem(
                    skill=skill,
                    evaluated_count=count,
                    average_score=avg_s,
                    min_score=min_s,
                    max_score=max_s,
                    category=cat,
                    last_practiced=last_dt,
                )
            )

    # Sort items
    strong_skills.sort(key=lambda x: x.average_score, reverse=True)
    developing_skills.sort(key=lambda x: x.average_score, reverse=True)
    weak_skills.sort(key=lambda x: x.average_score)
    insufficient_evidence_skills.sort(key=lambda x: x.average_score, reverse=True)

    avg_tech = round(sum(tech_scores) / len(tech_scores), 1) if tech_scores else None
    avg_behav = round(sum(behav_scores) / len(behav_scores), 1) if behav_scores else None
    avg_sit = round(sum(sit_scores) / len(sit_scores), 1) if sit_scores else None

    return AnalyticsSkills(
        strong_skills=strong_skills,
        developing_skills=developing_skills,
        weak_skills=weak_skills,
        insufficient_evidence_skills=insufficient_evidence_skills,
        technical_average_score=avg_tech,
        behavioral_average_score=avg_behav,
        situational_average_score=avg_sit,
        total_skills_evaluated=len(skill_groups),
    )


def compute_analytics_recommendations(user_id: UUID, db: DBSession) -> AnalyticsRecommendations:
    """
    Transparent, rule-based practice recommendations based on actual user evidence.
    Prioritizes recurring low scores and identified job skill gaps.
    Gracefully falls back to resume core competencies or software engineering fundamentals.
    """
    skills_data = compute_analytics_skills(user_id, db)
    completed_sessions_count = (
        db.query(func.count(InterviewSession.id))
        .filter(InterviewSession.user_id == user_id, InterviewSession.status == SessionStatus.COMPLETED)
        .scalar()
        or 0
    )

    recs: List[PracticeRecommendation] = []
    seen_topics = set()

    # Rule 1: High Priority for recurring weak skills (< 60%)
    for item in skills_data.weak_skills:
        if item.skill not in seen_topics:
            seen_topics.add(item.skill)
            recs.append(
                PracticeRecommendation(
                    topic=item.skill,
                    priority="high",
                    recommended_mode="weak_area",
                    suggested_difficulty="medium",
                    reason=f"Repeated low score ({item.average_score}% across {item.evaluated_count} questions). Focused practice recommended.",
                    source="historical_weakness",
                )
            )

    # Rule 2: Medium Priority for unpracticed skill gaps from Job Analyses
    job_analyses = (
        db.query(JobAnalysis)
        .filter(JobAnalysis.user_id == user_id)
        .order_by(JobAnalysis.created_at.desc())
        .limit(3)
        .all()
    )

    for ja in job_analyses:
        if isinstance(ja.match_results, list):
            for m in ja.match_results:
                if isinstance(m, dict) and m.get("classification") in ("not_found", "needs_verification"):
                    skill = m.get("skill_name")
                    if skill and skill not in seen_topics:
                        seen_topics.add(skill)
                        recs.append(
                            PracticeRecommendation(
                                topic=skill,
                                priority="medium",
                                recommended_mode="focused_technical",
                                suggested_difficulty="medium",
                                reason=f"Identified as required in '{ja.role_title}' analysis but missing or unverified in your resume.",
                                source="job_gap",
                            )
                        )
                if len(recs) >= 6:
                    break

    # Rule 3: Skills needing more evidence (insufficient evidence)
    for item in skills_data.insufficient_evidence_skills:
        if item.skill not in seen_topics and len(recs) < 6:
            seen_topics.add(item.skill)
            recs.append(
                PracticeRecommendation(
                    topic=item.skill,
                    priority="medium",
                    recommended_mode="quick_practice",
                    suggested_difficulty="medium",
                    reason=f"Only 1 response recorded ({item.average_score}%). Additional questions needed to confirm proficiency.",
                    source="readiness_test",
                )
            )

    # Rule 4: Challenge strong skills with Hard difficulty
    for item in skills_data.strong_skills[:2]:
        if item.skill not in seen_topics and len(recs) < 6:
            seen_topics.add(item.skill)
            recs.append(
                PracticeRecommendation(
                    topic=item.skill,
                    priority="low",
                    recommended_mode="focused_technical",
                    suggested_difficulty="hard",
                    reason=f"Consistently strong performance ({item.average_score}%). Recommended for advanced Hard difficulty practice.",
                    source="mastery_challenge",
                )
            )

    # Fallback if recommendations are sparse or empty
    if len(recs) == 0:
        # Check user's resume for skills
        latest_resume = (
            db.query(Resume)
            .filter(Resume.user_id == user_id)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )
        if latest_resume and isinstance(latest_resume.parsed_skills, list) and latest_resume.parsed_skills:
            for s in latest_resume.parsed_skills[:3]:
                recs.append(
                    PracticeRecommendation(
                        topic=s,
                        priority="medium",
                        recommended_mode="quick_practice",
                        suggested_difficulty="medium",
                        reason=f"Core skill identified in your resume '{latest_resume.filename}'. Recommended for initial baseline assessment.",
                        source="resume_core",
                    )
                )

        if len(recs) == 0:
            recs = [
                PracticeRecommendation(
                    topic="Distributed System Design",
                    priority="medium",
                    recommended_mode="mock_interview",
                    suggested_difficulty="medium",
                    reason="Fundamental engineering competency. Recommended baseline simulation.",
                    source="engineering_foundation",
                ),
                PracticeRecommendation(
                    topic="STAR Behavioral Competencies",
                    priority="medium",
                    recommended_mode="mock_interview",
                    suggested_difficulty="medium",
                    reason="Standard evaluation framework for engineering collaboration and impact.",
                    source="engineering_foundation",
                ),
            ]

    message = (
        f"Generated {len(recs)} practice recommendations based on {completed_sessions_count} completed sessions "
        f"and {len(skills_data.weak_skills) + len(skills_data.developing_skills) + len(skills_data.strong_skills)} assessed skills."
    )

    return AnalyticsRecommendations(
        recommendations=recs,
        based_on_sessions_count=completed_sessions_count,
        message=message,
    )

