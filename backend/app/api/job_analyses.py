from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job_analysis import JobAnalysis
from app.schemas.job_analysis import (
    JobAnalysisCreateRequest,
    JobAnalysisResponse,
    JobAnalysisListItem,
)
from app.services.job_analyzer import analyze_job_description_content
from app.services.matching_engine import perform_skill_gap_analysis
from app.services.ai_provider import get_ai_provider

router = APIRouter(prefix="/job-analyses", tags=["Job Description Analysis"])


@router.post(
    "",
    response_model=JobAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze a job description against an owned resume",
)
def create_job_analysis(
    payload: JobAnalysisCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobAnalysisResponse:
    """
    Analyzes a target job description against a selected resume.
    Strictly verifies resume ownership to prevent cross-tenant data access.
    Produces an explainable skill match and gap analysis.
    """
    # 1. Verify that the referenced resume exists and is owned by the current user
    resume = db.scalar(
        select(Resume).where(
            Resume.id == payload.resume_id,
            Resume.user_id == current_user.id,
        )
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced resume not found or does not belong to the current user",
        )

    # 2. Extract job description requirements (deterministic baseline with robust fallback)
    raw_jd = (payload.job_description_raw or payload.job_description or "").strip()
    if not raw_jd or len(raw_jd) < 3:
        role_label = payload.role_title or "Software Engineer"
        raw_jd = (
            f"Core technical competencies and requirements for {role_label}: "
            f"Proficiency in software development, architecture, testing, "
            f"database systems, and team collaboration."
        )

    extracted_reqs = analyze_job_description_content(
        job_description_raw=raw_jd,
        role_title=payload.role_title,
        company_name=payload.company_name,
        experience_level=payload.experience_level,
    )

    # 3. Optional AI provider refinement (non-blocking fallback to deterministic)
    ai_provider = get_ai_provider()
    refined_reqs = ai_provider.refine_job_analysis(
        job_description_raw=raw_jd,
        baseline_analysis=extracted_reqs,
    )

    # 4. Perform explainable matching and gap analysis against candidate's resume
    match_results = perform_skill_gap_analysis(
        parsed_resume=resume.structured_data or {"skills": resume.parsed_skills or {}},
        extracted_requirements=refined_reqs,
        raw_resume_text=resume.raw_text,
    )

    # Attach analysis engine info
    match_results["analysis_engine"] = refined_reqs.get("analysis_engine", "deterministic")

    # 5. Persist the analysis record
    analysis = JobAnalysis(
        user_id=current_user.id,
        resume_id=resume.id,
        role_title=payload.role_title,
        company_name=payload.company_name,
        experience_level=payload.experience_level,
        job_description_raw=raw_jd,
        extracted_requirements=refined_reqs,
        match_results=match_results,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return JobAnalysisResponse.model_validate(analysis)


@router.get(
    "",
    response_model=List[JobAnalysisListItem],
    status_code=status.HTTP_200_OK,
    summary="List authenticated user's job analyses",
)
def list_job_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[JobAnalysisListItem]:
    """
    Returns all job analyses conducted by the authenticated candidate.
    Data is strictly isolated to current_user.id.
    """
    analyses = db.scalars(
        select(JobAnalysis)
        .where(JobAnalysis.user_id == current_user.id)
        .order_by(JobAnalysis.created_at.desc())
    ).all()

    items = []
    for a in analyses:
        coverage = a.match_results.get("overall_coverage_pct", 0.0) if a.match_results else 0.0
        items.append(
            JobAnalysisListItem(
                id=a.id,
                resume_id=a.resume_id,
                role_title=a.role_title,
                company_name=a.company_name,
                overall_coverage_pct=coverage,
                created_at=a.created_at,
            )
        )

    return items


@router.get(
    "/{analysis_id}",
    response_model=JobAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve details of an owned job analysis",
)
def get_job_analysis(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobAnalysisResponse:
    """
    Retrieves full details of a saved analysis.
    Enforces tenant isolation: attempts to access another user's analysis yield 404.
    """
    analysis = db.scalar(
        select(JobAnalysis).where(
            JobAnalysis.id == analysis_id,
            JobAnalysis.user_id == current_user.id,
        )
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job analysis not found or access denied",
        )

    return JobAnalysisResponse.model_validate(analysis)


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an owned job analysis",
)
def delete_job_analysis(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes an owned analysis."""
    analysis = db.scalar(
        select(JobAnalysis).where(
            JobAnalysis.id == analysis_id,
            JobAnalysis.user_id == current_user.id,
        )
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job analysis not found or access denied",
        )

    db.delete(analysis)
    db.commit()
    return None

