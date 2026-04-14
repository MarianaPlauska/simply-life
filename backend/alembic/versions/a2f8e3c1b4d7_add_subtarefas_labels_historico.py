"""add_subtarefas_labels_historico

Revision ID: a2f8e3c1b4d7
Revises: d1574881dec6
Create Date: 2026-04-14 14:34:00.000000

Adiciona tabelas: labels, tarefa_labels, subtarefas, historico_habitos.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a2f8e3c1b4d7'
down_revision: Union[str, None] = 'd1574881dec6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Labels ────────────────────────────────────────────────
    op.create_table(
        'labels',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('nome', sa.String(50), nullable=False),
        sa.Column('cor', sa.String(7), server_default='#8b5cf6'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index('ix_labels_usuario_id', 'labels', ['usuario_id'])

    # ── Tarefa <-> Label (N:N) ────────────────────────────────
    op.create_table(
        'tarefa_labels',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('tarefa_id', sa.Integer(), sa.ForeignKey('tarefas_unificadas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('label_id', sa.Integer(), sa.ForeignKey('labels.id', ondelete='CASCADE'), nullable=False),
    )
    op.create_index('ix_tarefa_labels_tarefa_id', 'tarefa_labels', ['tarefa_id'])
    op.create_index('ix_tarefa_labels_label_id', 'tarefa_labels', ['label_id'])
    # Unique constraint: uma label só pode ser associada uma vez a cada tarefa
    op.create_unique_constraint('uq_tarefa_label', 'tarefa_labels', ['tarefa_id', 'label_id'])

    # ── Subtarefas ────────────────────────────────────────────
    op.create_table(
        'subtarefas',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('tarefa_id', sa.Integer(), sa.ForeignKey('tarefas_unificadas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('titulo', sa.String(200), nullable=False),
        sa.Column('concluida', sa.Integer(), server_default='0'),
        sa.Column('ordem', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index('ix_subtarefas_tarefa_id', 'subtarefas', ['tarefa_id'])

    # ── Histórico de Hábitos (para streaks reais) ─────────────
    op.create_table(
        'historico_habitos',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('habito_id', sa.Integer(), sa.ForeignKey('habitos_diarios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('data', sa.Date(), nullable=False),
        sa.Column('concluido', sa.Integer(), server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index('ix_historico_habitos_usuario_id', 'historico_habitos', ['usuario_id'])
    op.create_index('ix_historico_habitos_habito_id', 'historico_habitos', ['habito_id'])
    # Unique: um hábito só pode ter um registro por dia
    op.create_unique_constraint('uq_habito_data', 'historico_habitos', ['habito_id', 'data'])


def downgrade() -> None:
    op.drop_table('historico_habitos')
    op.drop_table('subtarefas')
    op.drop_table('tarefa_labels')
    op.drop_table('labels')
