import math
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from app.models.user import User
from app.models.roadmap import PreparationPlan, RoadmapTask
from app.models.job_analysis import JobAnalysis
from app.models.session import Session as InterviewSession
from app.models.answer import Answer
from app.models.question import Question
from app.models.enums import SessionStatus, QuestionType
from app.schemas.roadmap import (
    PreparationPlanUpdate,
    PreparationPlanOut,
    RoadmapTaskCreate,
    RoadmapTaskUpdate,
    RoadmapTaskOut,
    RoadmapMetricsOut,
    EvidenceSummaryOut,
    RoadmapOverviewOut,
)
from app.services.analytics_engine import compute_analytics_skills


def get_or_create_plan(user_id: UUID, db: DBSession) -> PreparationPlan:
    """Retrieves the active preparation plan for a user, or creates a sensible default."""
    plan = db.query(PreparationPlan).filter(PreparationPlan.user_id == user_id).first()
    if plan:
        return plan

    # Infer target role from latest job analysis or session
    target_role = "Software Engineer"
    latest_analysis = (
        db.query(JobAnalysis)
        .filter(JobAnalysis.user_id == user_id)
        .order_by(JobAnalysis.created_at.desc())
        .first()
    )
    if latest_analysis and latest_analysis.role_title:
        target_role = latest_analysis.role_title
    else:
        latest_session = (
            db.query(InterviewSession)
            .filter(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
            .first()
        )
        if latest_session and latest_session.role_title:
            target_role = latest_session.role_title

    plan = PreparationPlan(
        user_id=user_id,
        target_role=target_role,
        target_interview_date=None,
        daily_prep_minutes=30,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def compute_evidence_summary(user_id: UUID, db: DBSession) -> EvidenceSummaryOut:
    """Summarizes user evidence from analytics and job analyses."""
    skills_data = compute_analytics_skills(user_id, db)

    confirmed_strengths = [item.skill for item in skills_data.strong_skills]
    developing_skills = [item.skill for item in skills_data.developing_skills]
    priority_weak_areas = [item.skill for item in skills_data.weak_skills]

    # Gather missing skill gaps from Job Analyses
    job_analyses = (
        db.query(JobAnalysis)
        .filter(JobAnalysis.user_id == user_id)
        .order_by(JobAnalysis.created_at.desc())
        .all()
    )

    gap_skills: List[str] = []
    target_role: Optional[str] = None
    if job_analyses:
        target_role = job_analyses[0].role_title
        for ja in job_analyses:
            match_details = ja.match_results or getattr(ja, "match_details", None) or {}
            missing = match_details.get("missing_skills", []) or match_details.get("skill_gaps", [])
            for s in missing:
                if s not in gap_skills and s not in confirmed_strengths:
                    gap_skills.append(s)

    total_evals = (
        db.query(Answer)
        .join(Question)
        .join(InterviewSession)
        .filter(InterviewSession.user_id == user_id, Answer.evaluation_status == "completed")
        .count()
    )

    has_evidence = total_evals > 0 or len(job_analyses) > 0

    return EvidenceSummaryOut(
        target_role=target_role,
        confirmed_strengths=confirmed_strengths[:5],
        developing_skills=developing_skills[:5],
        priority_weak_areas=priority_weak_areas[:5],
        missing_gap_skills=gap_skills[:5],
        total_evaluations=total_evals,
        has_evidence=has_evidence,
    )


def compute_roadmap_metrics(plan: PreparationPlan, tasks: List[RoadmapTask]) -> RoadmapMetricsOut:
    """Derives genuine, mathematically accurate progress metrics from tasks."""
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    in_progress_tasks = sum(1 for t in tasks if t.status == "in_progress")
    not_started_tasks = sum(1 for t in tasks if t.status == "not_started")

    progress_pct = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0
    total_minutes = sum(t.estimated_minutes for t in tasks)
    completed_minutes = sum(t.estimated_minutes for t in tasks if t.status == "completed")
    remaining_minutes = max(0, total_minutes - completed_minutes)

    today = date.today()
    days_remaining: Optional[int] = None
    is_overdue = False

    if plan.target_interview_date:
        days_remaining = (plan.target_interview_date - today).days
        if days_remaining < 0:
            is_overdue = True

    # Check individual open tasks with past due dates
    for t in tasks:
        if t.status != "completed" and t.due_date and t.due_date < today:
            is_overdue = True
            break

    daily_goal = max(5, plan.daily_prep_minutes or 30)
    estimated_days = math.ceil(remaining_minutes / daily_goal) if remaining_minutes > 0 else 0

    return RoadmapMetricsOut(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        not_started_tasks=not_started_tasks,
        progress_percentage=progress_pct,
        total_estimated_minutes=total_minutes,
        completed_minutes=completed_minutes,
        days_remaining=days_remaining,
        is_overdue=is_overdue,
        estimated_days_to_complete=estimated_days,
    )


def generate_roadmap_tasks(user_id: UUID, db: DBSession) -> List[RoadmapTask]:
    """
    Generates personalized preparation roadmap tasks grounded in user evidence.
    CRITICAL: Preserves all completed, in-progress, and user-custom tasks.
    """
    plan = get_or_create_plan(user_id, db)
    existing_tasks = (
        db.query(RoadmapTask)
        .filter(RoadmapTask.user_id == user_id)
        .order_by(RoadmapTask.order_index.asc())
        .all()
    )

    # Topics and titles already tracked
    preserved_topics = set()
    preserved_tasks = []
    order_counter = 0

    for t in existing_tasks:
        # Keep completed, in-progress, or custom tasks
        if t.status in ("completed", "in_progress") or t.source == "custom":
            preserved_tasks.append(t)
            if t.topic:
                preserved_topics.add(t.topic.lower())
            order_counter = max(order_counter, t.order_index + 1)
        else:
            # Delete stale not_started system tasks so they can be freshly generated
            db.delete(t)

    db.flush()

    evidence = compute_evidence_summary(user_id, db)
    new_task_defs: List[Dict[str, Any]] = []

    # 1. High Priority: Priority Weak Areas (< 60% with >= 2 answers)
    for skill in evidence.priority_weak_areas:
        if skill.lower() not in preserved_topics:
            preserved_topics.add(skill.lower())
            new_task_defs.append({
                "title": f"Weak Area Drill: {skill}",
                "description": f"Focused practice to master {skill}. Review system principles, handle failure modes, and articulate edge cases.",
                "topic": skill,
                "category": "technical",
                "priority": "high",
                "source": "weak_area",
                "reason": f"Evaluated under 60% in historical interview performance.",
                "estimated_minutes": 35,
                "recommended_mode": "drill_weak_skills",
            })

    # 2. High Priority: Job Skill Gaps (from Job Analysis vs Resume)
    for skill in evidence.missing_gap_skills:
        if skill.lower() not in preserved_topics:
            preserved_topics.add(skill.lower())
            new_task_defs.append({
                "title": f"Skill Gap Practice: {skill}",
                "description": f"Prepare for target role requirements by practicing core interview questions on {skill}.",
                "topic": skill,
                "category": "technical",
                "priority": "high",
                "source": "skill_gap",
                "reason": f"Required competency identified in target job description.",
                "estimated_minutes": 30,
                "recommended_mode": "mock_interview",
            })

    # 3. Medium Priority: Developing Skills (60% - 79.9%)
    for skill in evidence.developing_skills:
        if skill.lower() not in preserved_topics:
            preserved_topics.add(skill.lower())
            new_task_defs.append({
                "title": f"Elevate Competency: {skill}",
                "description": f"Refine {skill} to reach interview mastery. Emphasize architectural trade-offs and concrete performance metrics.",
                "topic": skill,
                "category": "technical",
                "priority": "medium",
                "source": "developing_skill",
                "reason": f"Current performance is developing (60-79%). Move to confirmed strength.",
                "estimated_minutes": 30,
                "recommended_mode": "mock_interview",
            })

    # 4. Behavioral & Situational Excellence
    if "behavioral" not in preserved_topics:
        preserved_topics.add("behavioral")
        new_task_defs.append({
            "title": "STAR Behavioral Narrative Formulation",
            "description": "Formulate 3 distinct career experiences using the STAR method (Situation, Task, Action, Measurable Result).",
            "topic": "STAR Method",
            "category": "behavioral",
            "priority": "high" if not evidence.confirmed_strengths else "medium",
            "source": "recommended",
            "reason": "Crucial for passing behavioral interviews and demonstrating leadership impact.",
            "estimated_minutes": 30,
            "recommended_mode": "behavioral_deep_dive",
        })

    # 5. Low Priority: Maintenance for Confirmed Strengths (>= 80%)
    for skill in evidence.confirmed_strengths[:2]:
        if skill.lower() not in preserved_topics:
            preserved_topics.add(skill.lower())
            new_task_defs.append({
                "title": f"Strength Maintenance: {skill}",
                "description": f"Quick refresher simulation on confirmed strength {skill} to maintain sharp delivery.",
                "topic": skill,
                "category": "technical",
                "priority": "low",
                "source": "recommended",
                "reason": f"Confirmed strength (>=80%). Keep skills active with light practice.",
                "estimated_minutes": 20,
                "recommended_mode": "mock_interview",
            })

    # 6. Fallback or baseline supplement if user has insufficient prior history
    if (not evidence.has_evidence or (len(new_task_defs) + len(preserved_tasks)) < 3):
        foundational = [
            {
                "title": "Core System Architecture & Data Modeling",
                "description": "Practice structuring scalable backend architectures, database schemas, and caching strategies.",
                "topic": "System Design",
                "category": "technical",
                "priority": "high",
                "source": "recommended",
                "reason": "Foundational requirement for software engineering interviews.",
                "estimated_minutes": 45,
                "recommended_mode": "coding_deep_dive",
            },
            {
                "title": "STAR Behavioral Leadership Stories",
                "description": "Prepare STAR responses covering cross-team collaboration, conflict resolution, and technical setbacks.",
                "topic": "Behavioral Leadership",
                "category": "behavioral",
                "priority": "high",
                "source": "recommended",
                "reason": "Standard requirement across technical interview panels.",
                "estimated_minutes": 30,
                "recommended_mode": "behavioral_deep_dive",
            },
            {
                "title": "Incident Triage & Production Resilience",
                "description": "Simulate emergency production outages, rollback strategies, and stakeholder communication.",
                "topic": "Production Incidents",
                "category": "situational",
                "priority": "medium",
                "source": "recommended",
                "reason": "Tests real-world operational judgment under pressure.",
                "estimated_minutes": 25,
                "recommended_mode": "mock_interview",
            },
            {
                "title": "End-to-End Mock Interview Simulation",
                "description": "Complete a timed multi-question interview combining technical, behavioral, and situational questions.",
                "topic": "Comprehensive",
                "category": "review",
                "priority": "medium",
                "source": "recommended",
                "reason": "Build pacing, stamina, and voice articulation under realistic exam conditions.",
                "estimated_minutes": 40,
                "recommended_mode": "mock_interview",
            },
        ]
        for f in foundational:
            if f["topic"].lower() not in preserved_topics and f["title"] not in [td["title"] for td in new_task_defs]:
                new_task_defs.append(f)

    # Insert newly created tasks
    for td in new_task_defs:
        task = RoadmapTask(
            user_id=user_id,
            plan_id=plan.id,
            title=td["title"],
            description=td.get("description"),
            topic=td.get("topic"),
            category=td.get("category", "technical"),
            priority=td.get("priority", "medium"),
            status="not_started",
            source=td.get("source", "recommended"),
            reason=td.get("reason"),
            estimated_minutes=td.get("estimated_minutes", 30),
            recommended_mode=td.get("recommended_mode", "mock_interview"),
            order_index=order_counter,
        )
        order_counter += 1
        db.add(task)

    db.commit()

    # Return full ordered task list
    return (
        db.query(RoadmapTask)
        .filter(RoadmapTask.user_id == user_id)
        .order_by(RoadmapTask.order_index.asc())
        .all()
    )


def get_roadmap_overview(user_id: UUID, db: DBSession) -> RoadmapOverviewOut:
    """Returns the comprehensive roadmap overview: plan, tasks, metrics, and evidence summary."""
    plan = get_or_create_plan(user_id, db)
    tasks = (
        db.query(RoadmapTask)
        .filter(RoadmapTask.user_id == user_id)
        .order_by(RoadmapTask.order_index.asc())
        .all()
    )

    # If no tasks exist at all, auto-generate initial roadmap
    if not tasks:
        tasks = generate_roadmap_tasks(user_id, db)

    metrics = compute_roadmap_metrics(plan, tasks)
    evidence = compute_evidence_summary(user_id, db)

    return RoadmapOverviewOut(
        plan=PreparationPlanOut.model_validate(plan),
        tasks=[RoadmapTaskOut.model_validate(t) for t in tasks],
        metrics=metrics,
        evidence_summary=evidence,
    )


def update_plan(user_id: UUID, payload: PreparationPlanUpdate, db: DBSession) -> PreparationPlan:
    """Updates the user's preparation plan parameters with strict validation."""
    plan = get_or_create_plan(user_id, db)

    if payload.target_role is not None:
        plan.target_role = payload.target_role.strip() or None

    if payload.target_interview_date is not None:
        plan.target_interview_date = payload.target_interview_date

    if payload.daily_prep_minutes is not None:
        plan.daily_prep_minutes = payload.daily_prep_minutes

    if payload.academic_year is not None:
        plan.academic_year = payload.academic_year.strip() or None

    if payload.branch is not None:
        plan.branch = payload.branch.strip() or None

    if payload.ongoing_subjects is not None:
        plan.ongoing_subjects = payload.ongoing_subjects.strip() or None

    if payload.core_interests is not None:
        plan.core_interests = payload.core_interests.strip() or None

    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


def create_task(user_id: UUID, payload: RoadmapTaskCreate, db: DBSession) -> RoadmapTask:
    """Creates a user custom preparation task."""
    plan = get_or_create_plan(user_id, db)

    # Calculate next order_index
    max_order = (
        db.query(func.max(RoadmapTask.order_index))
        .filter(RoadmapTask.user_id == user_id)
        .scalar()
    )
    next_order = (max_order or 0) + 1

    task = RoadmapTask(
        user_id=user_id,
        plan_id=plan.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        topic=payload.topic.strip() if payload.topic else None,
        category=payload.category,
        priority=payload.priority,
        status="not_started",
        source="custom",
        reason=payload.reason or "Custom user-defined preparation task.",
        estimated_minutes=payload.estimated_minutes,
        recommended_mode=payload.recommended_mode,
        due_date=payload.due_date,
        order_index=next_order,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(task_id: UUID, user_id: UUID, payload: RoadmapTaskUpdate, db: DBSession) -> Optional[RoadmapTask]:
    """Updates a task, setting completed_at timestamp on completion and clearing it on reopen."""
    task = (
        db.query(RoadmapTask)
        .filter(RoadmapTask.id == task_id, RoadmapTask.user_id == user_id)
        .first()
    )
    if not task:
        return None

    if payload.title is not None:
        task.title = payload.title.strip()
    if payload.description is not None:
        task.description = payload.description.strip() if payload.description else None
    if payload.topic is not None:
        task.topic = payload.topic.strip() if payload.topic else None
    if payload.category is not None:
        task.category = payload.category
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.reason is not None:
        task.reason = payload.reason
    if payload.estimated_minutes is not None:
        task.estimated_minutes = payload.estimated_minutes
    if payload.recommended_mode is not None:
        task.recommended_mode = payload.recommended_mode
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.order_index is not None:
        task.order_index = payload.order_index

    if payload.status is not None:
        prev_status = task.status
        task.status = payload.status
        if payload.status == "completed" and prev_status != "completed":
            task.completed_at = datetime.now(timezone.utc)
        elif payload.status != "completed" and prev_status == "completed":
            task.completed_at = None

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


def delete_task(task_id: UUID, user_id: UUID, db: DBSession) -> bool:
    """Deletes a roadmap task belonging to the user."""
    task = (
        db.query(RoadmapTask)
        .filter(RoadmapTask.id == task_id, RoadmapTask.user_id == user_id)
        .first()
    )
    if not task:
        return False

    db.delete(task)
    db.commit()
    return True
