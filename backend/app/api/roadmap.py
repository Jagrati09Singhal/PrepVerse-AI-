import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapOverviewOut,
    PreparationPlanOut,
    PreparationPlanUpdate,
    RoadmapTaskOut,
    RoadmapTaskCreate,
    RoadmapTaskUpdate,
)
from app.services.roadmap_service import (
    get_roadmap_overview,
    generate_roadmap_tasks,
    get_or_create_plan,
    update_plan,
    create_task,
    update_task,
    delete_task,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/roadmap", tags=["Roadmap & Planner"])


@router.get("", response_model=RoadmapOverviewOut)
def get_user_roadmap(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Retrieves the user's preparation plan, prioritized tasks, progress metrics,
    and evidence summary. Auto-generates initial tasks if none exist.
    """
    return get_roadmap_overview(current_user.id, db)


@router.post("/generate", response_model=RoadmapOverviewOut)
def refresh_roadmap_recommendations(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Refreshes preparation roadmap recommendations based on latest interview evaluations
    and job analyses. Strictly preserves completed, in-progress, and user-custom tasks.
    """
    generate_roadmap_tasks(current_user.id, db)
    return get_roadmap_overview(current_user.id, db)


@router.get("/plan", response_model=PreparationPlanOut)
def get_preparation_plan(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Retrieves current user's preparation plan and target role."""
    plan = get_or_create_plan(current_user.id, db)
    return PreparationPlanOut.model_validate(plan)


@router.put("/plan", response_model=PreparationPlanOut)
@router.post("/plan", response_model=PreparationPlanOut)
def update_preparation_plan(
    payload: PreparationPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Updates target role, target interview date, and daily preparation time goal.
    Validates that target date cannot be in the past and daily minutes are positive.
    """
    plan = update_plan(current_user.id, payload, db)
    return PreparationPlanOut.model_validate(plan)


@router.post("/tasks", response_model=RoadmapTaskOut, status_code=status.HTTP_201_CREATED)
def create_custom_preparation_task(
    payload: RoadmapTaskCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Adds a custom user preparation task to the roadmap."""
    task = create_task(current_user.id, payload, db)
    return RoadmapTaskOut.model_validate(task)


@router.patch("/tasks/{task_id}", response_model=RoadmapTaskOut)
def update_roadmap_task(
    task_id: UUID,
    payload: RoadmapTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Updates task status (not_started, in_progress, completed), priority, or notes.
    Sets completion timestamp when marked completed, and clears it if reopened.
    """
    task = update_task(task_id, current_user.id, payload, db)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap task not found",
        )
    return RoadmapTaskOut.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Deletes an owned preparation task."""
    success = delete_task(task_id, current_user.id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap task not found",
        )
    return None

