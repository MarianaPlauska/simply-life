"""Sprint Backend: índices compostos para queries de dashboard e relatórios

Padrões identificados via EXPLAIN ANALYZE:
  • TarefaUnificada: filtros frequentes por (usuario_id, status) e (usuario_id, score_urgencia)
  • Despesa: filtros por (usuario_id, data_gasto)
  • SessaoFoco: filtros por (user_id, created_at)
  • HistoricoHabito: filtros por (usuario_id, data, concluido)
  • DiarioHumor: filtros por (usuario_id, data)
  • AuditLog: filtros por (usuario_id, created_at)

Revision ID: k6l7m8n9o0p1
Revises: j5k6l7m8n9o0
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

revision = 'k6l7m8n9o0p1'
down_revision = 'j5k6l7m8n9o0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── TarefaUnificada ───────────────────────────────────────
    # Dashboard: tarefas por usuário + status
    op.create_index(
        'idx_tarefa_usuario_status',
        'tarefas_unificadas',
        ['usuario_id', 'status'],
    )
    # Triagem/scoring: query de críticas (score alto + não concluída)
    op.create_index(
        'idx_tarefa_usuario_score',
        'tarefas_unificadas',
        ['usuario_id', 'score_urgencia'],
    )
    # Relatórios: tarefas por período criadas/concluídas
    op.create_index(
        'idx_tarefa_usuario_created',
        'tarefas_unificadas',
        ['usuario_id', 'created_at'],
    )

    # ── Despesa ───────────────────────────────────────────────
    # Dashboard + relatórios: despesas por usuário + data
    op.create_index(
        'idx_despesa_usuario_data',
        'despesas',
        ['usuario_id', 'data_gasto'],
    )

    # ── SessaoFoco ────────────────────────────────────────────
    # Relatórios: sessões de foco por usuário + data
    op.create_index(
        'idx_sessao_foco_usuario_created',
        'sessoes_foco',
        ['user_id', 'created_at'],
    )

    # ── HistoricoHabito ───────────────────────────────────────
    # Relatórios: hábitos concluídos por usuário + intervalo de datas
    op.create_index(
        'idx_historico_habito_usuario_data_concluido',
        'historico_habitos',
        ['usuario_id', 'data', 'concluido'],
    )

    # ── DiarioHumor ───────────────────────────────────────────
    # Relatórios: humor médio por usuário + período
    op.create_index(
        'idx_diario_humor_usuario_data',
        'diario_humor',
        ['usuario_id', 'data'],
    )

    # ── AuditLog ──────────────────────────────────────────────
    # Admin: audit trail por usuário + timestamp
    op.create_index(
        'idx_audit_log_usuario_created',
        'audit_log',
        ['usuario_id', 'created_at'],
    )


def downgrade() -> None:
    op.drop_index('idx_audit_log_usuario_created', table_name='audit_log')
    op.drop_index('idx_diario_humor_usuario_data', table_name='diario_humor')
    op.drop_index('idx_historico_habito_usuario_data_concluido', table_name='historico_habitos')
    op.drop_index('idx_sessao_foco_usuario_created', table_name='sessoes_foco')
    op.drop_index('idx_despesa_usuario_data', table_name='despesas')
    op.drop_index('idx_tarefa_usuario_created', table_name='tarefas_unificadas')
    op.drop_index('idx_tarefa_usuario_score', table_name='tarefas_unificadas')
    op.drop_index('idx_tarefa_usuario_status', table_name='tarefas_unificadas')
