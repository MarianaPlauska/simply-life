"""sprint_e: add versao column to tarefas_unificadas (optimistic locking)

Revision ID: h3i4j5k6l7m8
Revises: g2h3i4j5k6l7
Create Date: 2026-04-15 00:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = 'h3i4j5k6l7m8'
down_revision = 'g2h3i4j5k6l7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'tarefas_unificadas',
        sa.Column('versao', sa.Integer(), nullable=False, server_default='1'),
    )


def downgrade() -> None:
    op.drop_column('tarefas_unificadas', 'versao')
