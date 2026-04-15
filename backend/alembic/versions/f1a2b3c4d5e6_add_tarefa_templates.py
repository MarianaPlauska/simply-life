"""add_tarefa_templates

Revision ID: f1a2b3c4d5e6
Revises: e5a8b3c7d2f1
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'e5a8b3c7d2f1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tarefa_templates',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('nome', sa.String(200), nullable=False),
        sa.Column('prioridade', sa.String(), nullable=True, server_default='media'),
        sa.Column('subtarefas_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('tarefa_templates')
