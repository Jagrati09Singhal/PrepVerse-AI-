import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverview,
    AnalyticsTrends,
    AnalyticsSkills,
    AnalyticsRecommendations,
)
from app.services.analytics_engine import (
    compute_analytics_overview,
    compute_analytics_trends,
    compute_analytics_skills,
    compute_analytics_recommendations,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Performance Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Returns an empirical performance overview for the authenticated candidate.
    - Aggregates overall scores, content scores, and communication scores across completed evaluations.
    - Includes speech analytics summaries for eligible voice answers with verified duration >= 5.0s.
    - Strictly scoped to the authenticated user.
    """
    return compute_analytics_overview(user_id=current_user.id, db=db)


@router.get("/trends", response_model=AnalyticsTrends)
def get_analytics_trends(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Returns longitudinal performance trends across the candidate's completed interviews.
    - Chronological timeline of overall and content scores.
    - Performance breakdowns by target role title and question category.
    - Requires at least 2 completed sessions for a trajectory assessment.
    """
    return compute_analytics_trends(user_id=current_user.id, db=db)


@router.get("/skills", response_model=AnalyticsSkills)
def get_analytics_skills(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Returns topic and skill mastery analysis derived from actual answer evaluations.
    - Identifies confirmed strong skills (>= 80% across multiple answers).
    - Identifies recurring weak skills (< 60%).
    - Identifies developing skills and skills with insufficient evidence.
    """
    return compute_analytics_skills(user_id=current_user.id, db=db)


@router.get("/recommendations", response_model=AnalyticsRecommendations)
def get_analytics_recommendations(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Returns transparent rule-based practice recommendations based on candidate's history.
    - Prioritizes recurring weak skills and identified job description skill gaps.
    - Explains the explicit reason for every recommendation.
    """
    return compute_analytics_recommendations(user_id=current_user.id, db=db)

