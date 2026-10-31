"""0005_advanced_practice_and_analytics

Phase 5 schema extension: adds advanced practice modes and targeted focus to interview sessions.

Revision ID: 0005_advanced_practice_and_analytics
Revises: 0004_voice_and_adaptive
Create Date: 2026-10-29 01:31:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0005_advanced_practice_and_analytics"
down_revision: Union[str, None] = "0004_voice_and_adaptive"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add practice_mode and target_focus to sessions table
    op.add_column(
        "sessions",
        sa.Column("practice_mode", sa.String(length=50), server_default="mock_interview", nullable=False),
    )
    op.add_column(
        "sessions",
        sa.Column("target_focus", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("sessions", "target_focus")
    op.drop_column("sessions", "practice_mode")

