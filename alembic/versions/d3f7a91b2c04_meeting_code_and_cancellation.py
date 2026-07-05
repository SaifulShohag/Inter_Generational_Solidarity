"""add meeting_code and cancellation_reason

Revision ID: d3f7a91b2c04
Revises: cc87184f7ceb
Create Date: 2026-07-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'd3f7a91b2c04'
down_revision = 'cc87184f7ceb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('volunteer_assignments',
        sa.Column('meeting_code', sa.String(length=8), nullable=True))
    op.add_column('help_requests',
        sa.Column('cancellation_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('volunteer_assignments', 'meeting_code')
    op.drop_column('help_requests', 'cancellation_reason')
