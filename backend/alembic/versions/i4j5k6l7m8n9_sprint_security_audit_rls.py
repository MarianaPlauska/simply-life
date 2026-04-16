"""Sprint Security: audit_log, webhook_secrets, RLS policies

Revision ID: i4j5k6l7m8n9
Revises: h3i4j5k6l7m8
Create Date: 2026-04-16

"""
from alembic import op
import sqlalchemy as sa

revision = 'i4j5k6l7m8n9'
down_revision = 'h3i4j5k6l7m8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Audit Log (LGPD compliance) ────────────────────────
    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
        sa.Column('acao', sa.String(100), nullable=False),
        sa.Column('recurso', sa.String(100), nullable=True),
        sa.Column('recurso_id', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('detalhes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_audit_usuario_acao', 'audit_log', ['usuario_id', 'acao'])
    op.create_index('idx_audit_created', 'audit_log', ['created_at'])

    # ── 2. Webhook Secrets (HMAC M2M) ────────────────────────
    op.create_table(
        'webhook_secrets',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=False, unique=True),
        sa.Column('secret_hash', sa.String(), nullable=False),
        sa.Column('ativo', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ── 3. Row-Level Security (RLS) ──────────────────────────
    # Habilitar RLS em todas as tabelas com dados de usuário
    tables_with_user_id = [
        ('tarefas_unificadas', 'usuario_id'),
        ('anotacoes', 'usuario_id'),
        ('despesas', 'usuario_id'),
        ('medicamentos', 'usuario_id'),
        ('notificacoes', 'usuario_id'),
        ('habitos_diarios', 'usuario_id'),
        ('historico_habitos', 'usuario_id'),
        ('integracoes', 'usuario_id'),
        ('preferencias_usuario', 'usuario_id'),
        ('diario_humor', 'usuario_id'),
        ('entradas_diario', 'usuario_id'),
        ('labels', 'usuario_id'),
        ('tarefa_templates', 'usuario_id'),
        ('tarefa_recorrencias', 'usuario_id'),
        ('tarefa_dependencias', 'usuario_id'),
        ('atividades_tarefa', 'usuario_id'),
        ('palavras_chave', 'user_id'),
        ('sessoes_foco', 'user_id'),
        ('token_blacklist', 'usuario_id'),
        ('audit_log', 'usuario_id'),
        ('webhook_secrets', 'usuario_id'),
    ]

    for table, col in tables_with_user_id:
        # Habilita RLS
        op.execute(f'ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;')

        # FORCE para que o owner da tabela também respeite RLS
        op.execute(f'ALTER TABLE {table} FORCE ROW LEVEL SECURITY;')

        # Policy: usuários só veem/modificam seus próprios dados
        # current_setting('app.current_user_id') é setado pela aplicação via SET LOCAL
        op.execute(f"""
            CREATE POLICY rls_{table}_isolation ON {table}
            USING ({col}::text = current_setting('app.current_user_id', true))
            WITH CHECK ({col}::text = current_setting('app.current_user_id', true));
        """)

    # Policy especial para audit_log: permitir INSERT sem restrição
    # (para logar eventos de usuários não autenticados, ex: login_falhou)
    op.execute("""
        CREATE POLICY rls_audit_log_insert ON audit_log
        FOR INSERT
        WITH CHECK (true);
    """)


def downgrade() -> None:
    # Remover RLS policies
    tables_with_user_id = [
        'tarefas_unificadas', 'anotacoes', 'despesas', 'medicamentos',
        'notificacoes', 'habitos_diarios', 'historico_habitos', 'integracoes',
        'preferencias_usuario', 'diario_humor', 'entradas_diario', 'labels',
        'tarefa_templates', 'tarefa_recorrencias', 'tarefa_dependencias',
        'atividades_tarefa', 'palavras_chave', 'sessoes_foco',
        'token_blacklist', 'audit_log', 'webhook_secrets',
    ]

    for table in tables_with_user_id:
        op.execute(f'DROP POLICY IF EXISTS rls_{table}_isolation ON {table};')
        op.execute(f'ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;')

    op.execute('DROP POLICY IF EXISTS rls_audit_log_insert ON audit_log;')

    op.drop_table('webhook_secrets')
    op.drop_table('audit_log')
