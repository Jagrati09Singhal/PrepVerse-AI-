"""0001_initial_schema

Initial migration creating users, resumes, sessions, questions, and answers tables.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-28 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# JSON column with PostgreSQL JSONB variant
json_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. Resumes table
    op.create_table(
        "resumes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("parsed_skills", json_type, nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_resumes_user_id_users", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_resumes"),
    )
    op.create_index("ix_resumes_id", "resumes", ["id"], unique=False)
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"], unique=False)

    # 3. Sessions table
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("resume_id", sa.Uuid(), nullable=True),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("created", "in_progress", "completed", "abandoned", name="sessionstatus", native_enum=False, length=50),
            server_default="created",
            nullable=False,
        ),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_sessions_user_id_users", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], name="fk_sessions_resume_id_resumes", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="pk_sessions"),
    )
    op.create_index("ix_sessions_id", "sessions", ["id"], unique=False)
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"], unique=False)
    op.create_index("ix_sessions_resume_id", "sessions", ["resume_id"], unique=False)
    op.create_index("ix_sessions_status", "sessions", ["status"], unique=False)

    # 4. Questions table
    op.create_table(
        "questions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column(
            "type",
            sa.Enum("behavioral", "technical", "situational", name="questiontype", native_enum=False, length=50),
            nullable=False,
        ),
        sa.Column(
            "difficulty",
            sa.Enum("easy", "medium", "hard", name="questiondifficulty", native_enum=False, length=50),
            nullable=False,
        ),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], name="fk_questions_session_id_sessions", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_questions"),
        sa.UniqueConstraint("session_id", "order_index", name="uq_session_question_order"),
    )
    op.create_index("ix_questions_id", "questions", ["id"], unique=False)
    op.create_index("ix_questions_session_id", "questions", ["session_id"], unique=False)

    # 5. Answers table
    op.create_table(
        "answers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("audio_url", sa.String(length=1024), nullable=True),
        sa.Column("content_score", sa.Float(), nullable=True),
        sa.Column("communication_score", sa.Float(), nullable=True),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column("filler_word_count", sa.Integer(), nullable=True),
        sa.Column("star_component_scores", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], name="fk_answers_question_id_questions", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_answers"),
    )
    op.create_index("ix_answers_id", "answers", ["id"], unique=False)
    op.create_index("ix_answers_question_id", "answers", ["question_id"], unique=False)


def downgrade() -> None:
    op.drop_table("answers")
    op.drop_table("questions")
    op.drop_table("sessions")
    op.drop_table("resumes")
    op.drop_table("users")

