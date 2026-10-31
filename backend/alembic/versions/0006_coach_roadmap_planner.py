"""0006_coach_roadmap_planner

Phase 6 schema extension: creates preparation_plans and roadmap_tasks tables.

Revision ID: 0006_coach_roadmap_planner
Revises: 0005_advanced_practice_and_analytics
Create Date: 2026-10-29 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0006_coach_roadmap_planner"
down_revision: Union[str, None] = "0005_advanced_practice_and_analytics"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. preparation_plans table
    op.create_table(
        "preparation_plans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("target_role", sa.String(length=255), nullable=True),
        sa.Column("target_interview_date", sa.Date(), nullable=True),
        sa.Column("daily_prep_minutes", sa.Integer(), server_default="30", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_preparation_plans_user_id_users", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_preparation_plans"),
    )
    op.create_index("ix_preparation_plans_id", "preparation_plans", ["id"], unique=False)
    op.create_index("ix_preparation_plans_user_id", "preparation_plans", ["user_id"], unique=True)

    # 2. roadmap_tasks table
    op.create_table(
        "roadmap_tasks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("topic", sa.String(length=100), nullable=True),
        sa.Column("category", sa.String(length=50), server_default="technical", nullable=False),
        sa.Column("priority", sa.String(length=20), server_default="medium", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="not_started", nullable=False),
        sa.Column("source", sa.String(length=50), server_default="recommended", nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), server_default="30", nullable=False),
        sa.Column("recommended_mode", sa.String(length=50), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_roadmap_tasks_user_id_users", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["preparation_plans.id"], name="fk_roadmap_tasks_plan_id_plans", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_roadmap_tasks"),
    )
    op.create_index("ix_roadmap_tasks_id", "roadmap_tasks", ["id"], unique=False)
    op.create_index("ix_roadmap_tasks_user_id", "roadmap_tasks", ["user_id"], unique=False)
    op.create_index("ix_roadmap_tasks_plan_id", "roadmap_tasks", ["plan_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_roadmap_tasks_plan_id", table_name="roadmap_tasks")
    op.drop_index("ix_roadmap_tasks_user_id", table_name="roadmap_tasks")
    op.drop_index("ix_roadmap_tasks_id", table_name="roadmap_tasks")
    op.drop_table("roadmap_tasks")

    op.drop_index("ix_preparation_plans_user_id", table_name="preparation_plans")
    op.drop_index("ix_preparation_plans_id", table_name="preparation_plans")
    op.drop_table("preparation_plans")

