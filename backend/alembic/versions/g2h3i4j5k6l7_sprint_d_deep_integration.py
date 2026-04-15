"""sprint_d: tarefa_recorrencias, tarefa_dependencias, atividades_tarefa

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2024-01-01 00:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = 'g2h3i4j5k6l7'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # tabela de recorrências (D3)
    op.create_table(
        'tarefa_recorrencias',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('tarefa_id', sa.Integer, sa.ForeignKey('tarefas_unificadas.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('usuario_id', sa.Integer, sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('frequencia', sa.String, nullable=False),
        sa.Column('ativa', sa.Boolean, default=True),
        sa.Column('proximo_em', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
    )

    # tabela de dependências entre tarefas (D4)
    op.create_table(
        'tarefa_dependencias',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('tarefa_id', sa.Integer, sa.ForeignKey('tarefas_unificadas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('depende_de_id', sa.Integer, sa.ForeignKey('tarefas_unificadas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('usuario_id', sa.Integer, sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=True),
        sa.UniqueConstraint('tarefa_id', 'depende_de_id', name='uq_tarefa_dependencia'),
    )

    # tabela de feed de atividade (D5)
    op.create_table(
        'atividades_tarefa',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('tarefa_id', sa.Integer, sa.ForeignKey('tarefas_unificadas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('usuario_id', sa.Integer, sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('tipo', sa.String, nullable=False),
        sa.Column('detalhe', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
    )
    op.create_index('ix_atividades_tarefa_tarefa_id', 'atividades_tarefa', ['tarefa_id'])


def downgrade() -> None:
    op.drop_table('atividades_tarefa')
    op.drop_table('tarefa_dependencias')
    op.drop_table('tarefa_recorrencias')
