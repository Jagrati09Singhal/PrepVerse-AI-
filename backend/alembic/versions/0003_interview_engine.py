"""0003_interview_engine

Phase 3 schema extension: adds interview session configuration, question rubrics, and answer evaluation tracking.

Revision ID: 0003_interview_engine
Revises: 0002_resume_intelligence
Create Date: 2026-10-29 00:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0003_interview_engine"
down_revision: Union[str, None] = "0002_resume_intelligence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    # 1. Add interview configuration and tracking columns to sessions table
    op.add_column("sessions", sa.Column("job_analysis_id", sa.Uuid(), nullable=True))
    op.add_column("sessions", sa.Column("role_title", sa.String(length=255), nullable=True))
    op.add_column("sessions", sa.Column("question_count", sa.Integer(), server_default="5", nullable=False))
    op.add_column("sessions", sa.Column("difficulty", sa.String(length=50), nullable=True))
    op.add_column("sessions", sa.Column("question_types", json_type, nullable=True))
    op.add_column("sessions", sa.Column("communication_score", sa.Float(), nullable=True))
    op.add_column("sessions", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_foreign_key(
        "fk_sessions_job_analysis_id_job_analyses",
        "sessions",
        "job_analyses",
        ["job_analysis_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_sessions_job_analysis_id", "sessions", ["job_analysis_id"], unique=False)

    # 2. Add private rubric criteria and target skill to questions table
    op.add_column("questions", sa.Column("rubric_criteria", sa.Text(), nullable=True))
    op.add_column("questions", sa.Column("target_skill", sa.String(length=100), nullable=True))

    # 3. Add evaluation tracking and details to answers table
    op.add_column("answers", sa.Column("evaluation_status", sa.String(length=50), server_default="completed", nullable=False))
    op.add_column("answers", sa.Column("evaluation_details", json_type, nullable=True))
    op.add_column("answers", sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("answers", "evaluated_at")
    op.drop_column("answers", "evaluation_details")
    op.drop_column("answers", "evaluation_status")

    op.drop_column("questions", "target_skill")
    op.drop_column("questions", "rubric_criteria")

    op.drop_index("ix_sessions_job_analysis_id", table_name="sessions")
    op.drop_constraint("fk_sessions_job_analysis_id_job_analyses", "sessions", type_="foreignkey")
    op.drop_column("sessions", "completed_at")
    op.drop_column("sessions", "communication_score")
    op.drop_column("sessions", "question_types")
    op.drop_column("sessions", "difficulty")
    op.drop_column("sessions", "question_count")
    op.drop_column("sessions", "role_title")
    op.drop_column("sessions", "job_analysis_id")

