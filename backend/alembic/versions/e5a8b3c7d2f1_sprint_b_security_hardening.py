"""Sprint B — security hardening: token_blacklist, deletado_em, indexes, titulo limit

Revision ID: e5a8b3c7d2f1
Revises: c4d7f8a2e6b1
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'e5a8b3c7d2f1'
down_revision = 'c4d7f8a2e6b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # B3: tabela de blacklist de tokens (logout + refresh rotation)
    op.create_table(
        'token_blacklist',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('jti', sa.String(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False),
        sa.Column('expira_em', sa.DateTime(), nullable=False),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_token_blacklist_jti', 'token_blacklist', ['jti'], unique=True)

    # B11: soft delete em tarefas_unificadas
    op.add_column('tarefas_unificadas', sa.Column('deletado_em', sa.DateTime(), nullable=True))

    # B10: index usuario_id nas tabelas que faltavam (if_not_exists para evitar conflito)
    op.create_index('ix_integracoes_usuario_id', 'integracoes', ['usuario_id'], if_not_exists=True)
    op.create_index('ix_anotacoes_usuario_id', 'anotacoes', ['usuario_id'], if_not_exists=True)
    op.create_index('ix_despesas_usuario_id', 'despesas', ['usuario_id'], if_not_exists=True)
    op.create_index('ix_notificacoes_usuario_id', 'notificacoes', ['usuario_id'], if_not_exists=True)

    # B9: titulo limit 200 (varchar -> varchar(200))
    op.alter_column('tarefas_unificadas', 'titulo', type_=sa.String(200))


def downgrade() -> None:
    op.alter_column('tarefas_unificadas', 'titulo', type_=sa.String())
    op.drop_index('ix_notificacoes_usuario_id', 'notificacoes')
    op.drop_index('ix_despesas_usuario_id', 'despesas')
    op.drop_index('ix_anotacoes_usuario_id', 'anotacoes')
    op.drop_index('ix_integracoes_usuario_id', 'integracoes')
    op.drop_column('tarefas_unificadas', 'deletado_em')
    op.drop_index('ix_token_blacklist_jti', 'token_blacklist')
    op.drop_table('token_blacklist')
