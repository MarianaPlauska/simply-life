"""add diario_humor e entradas_diario (sprint 4 — bem-estar mental)

Revision ID: c4d7f8a2e6b1
Revises: b3c9f2e1a5d8
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'c4d7f8a2e6b1'
down_revision = 'b3c9f2e1a5d8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # tabela de humor diário (mood tracker)
    op.create_table(
        'diario_humor',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('usuario_id', sa.Integer, sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('data', sa.Date, nullable=False),
        sa.Column('humor', sa.Integer, nullable=False),
        sa.Column('emoji', sa.String(10), nullable=True),
        sa.Column('nota', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.UniqueConstraint('usuario_id', 'data', name='uq_humor_dia'),
    )
    op.create_index('ix_diario_humor_usuario_id', 'diario_humor', ['usuario_id'])
    op.create_index('ix_diario_humor_data', 'diario_humor', ['data'])

    # tabela de journaling (diário livre)
    op.create_table(
        'entradas_diario',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('usuario_id', sa.Integer, sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('data', sa.Date, nullable=False),
        sa.Column('conteudo', sa.Text, nullable=False),
        sa.Column('prompt_usado', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
    )
    op.create_index('ix_entradas_diario_usuario_id', 'entradas_diario', ['usuario_id'])
    op.create_index('ix_entradas_diario_data', 'entradas_diario', ['data'])


def downgrade() -> None:
    op.drop_table('entradas_diario')
    op.drop_table('diario_humor')
