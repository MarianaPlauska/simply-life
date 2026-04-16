"""Sprint Security: add last_active_at to usuarios (session inactivity tracking)

Revision ID: j5k6l7m8n9o0
Revises: i4j5k6l7m8n9
Create Date: 2026-04-16

"""
from alembic import op
import sqlalchemy as sa

revision = 'j5k6l7m8n9o0'
down_revision = 'i4j5k6l7m8n9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Campo para rastrear a última atividade do usuário
    # Usado para invalidar sessões inativas por > INACTIVE_SESSION_TIMEOUT_HOURS horas
    op.add_column(
        'usuarios',
        sa.Column('last_active_at', sa.DateTime(), nullable=True),
    )
    op.create_index('idx_usuarios_last_active', 'usuarios', ['last_active_at'])


def downgrade() -> None:
    op.drop_index('idx_usuarios_last_active', table_name='usuarios')
    op.drop_column('usuarios', 'last_active_at')
