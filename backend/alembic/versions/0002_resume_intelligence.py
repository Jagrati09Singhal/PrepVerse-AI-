"""0002_resume_intelligence

Phase 2 schema extension: adds structured metadata columns to resumes and creates job_analyses table.

Revision ID: 0002_resume_intelligence
Revises: 0001_initial_schema
Create Date: 2026-10-29 00:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_resume_intelligence"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    # 1. Add structured metadata columns to resumes table
    op.add_column("resumes", sa.Column("filename", sa.String(length=255), nullable=True))
    op.add_column("resumes", sa.Column("file_size_bytes", sa.Integer(), nullable=True))
    op.add_column("resumes", sa.Column("parsing_status", sa.String(length=50), server_default="completed", nullable=False))
    op.add_column("resumes", sa.Column("error_message", sa.Text(), nullable=True))
    op.add_column("resumes", sa.Column("structured_data", json_type, nullable=True))

    # 2. Create job_analyses table
    op.create_table(
        "job_analyses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("resume_id", sa.Uuid(), nullable=False),
        sa.Column("role_title", sa.String(length=255), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("experience_level", sa.String(length=50), nullable=True),
        sa.Column("job_description_raw", sa.Text(), nullable=False),
        sa.Column("extracted_requirements", json_type, nullable=False),
        sa.Column("match_results", json_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_job_analyses_user_id_users", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], name="fk_job_analyses_resume_id_resumes", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_job_analyses"),
    )
    op.create_index("ix_job_analyses_id", "job_analyses", ["id"], unique=False)
    op.create_index("ix_job_analyses_user_id", "job_analyses", ["user_id"], unique=False)
    op.create_index("ix_job_analyses_resume_id", "job_analyses", ["resume_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_job_analyses_resume_id", table_name="job_analyses")
    op.drop_index("ix_job_analyses_user_id", table_name="job_analyses")
    op.drop_index("ix_job_analyses_id", table_name="job_analyses")
    op.drop_table("job_analyses")

    op.drop_column("resumes", "structured_data")
    op.drop_column("resumes", "error_message")
    op.drop_column("resumes", "parsing_status")
    op.drop_column("resumes", "file_size_bytes")
    op.drop_column("resumes", "filename")

