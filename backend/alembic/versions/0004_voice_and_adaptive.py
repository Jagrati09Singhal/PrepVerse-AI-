"""0004_voice_and_adaptive

Phase 4 schema extension: adds voice interview mode, speech analytics metrics, and adaptive difficulty tracking.

Revision ID: 0004_voice_and_adaptive
Revises: 0003_interview_engine
Create Date: 2026-10-29 01:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_voice_and_adaptive"
down_revision: Union[str, None] = "0003_interview_engine"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    # 1. Add voice mode and adaptive tracking to sessions table
    op.add_column("sessions", sa.Column("interview_mode", sa.String(length=50), server_default="text", nullable=False))
    op.add_column("sessions", sa.Column("is_adaptive", sa.Boolean(), server_default=sa.true(), nullable=False))

    # 2. Add adaptation reason to questions table
    op.add_column("questions", sa.Column("adaptation_reason", sa.Text(), nullable=True))

    # 3. Add audio duration and speech analytics to answers table
    op.add_column("answers", sa.Column("audio_duration_seconds", sa.Float(), nullable=True))
    op.add_column("answers", sa.Column("speech_analytics", json_type, nullable=True))


def downgrade() -> None:
    op.drop_column("answers", "speech_analytics")
    op.drop_column("answers", "audio_duration_seconds")
    op.drop_column("questions", "adaptation_reason")
    op.drop_column("sessions", "is_adaptive")
    op.drop_column("sessions", "interview_mode")

