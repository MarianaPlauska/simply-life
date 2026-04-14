"""add tsvector gin indexes para busca global

Revision ID: b3c9f2e1a5d8
Revises: a2f8e3c1b4d7
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'b3c9f2e1a5d8'
down_revision = 'a2f8e3c1b4d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # indices gin pra full-text search no postgres
    # usa to_tsvector com dicionário 'portuguese' pra stemming correto
    # ex: "pagamento" vai encontrar "pagamentos", "pagar", etc.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("""
            CREATE INDEX IF NOT EXISTS idx_tarefas_fts
            ON tarefas_unificadas
            USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')))
        """)
        op.execute("""
            CREATE INDEX IF NOT EXISTS idx_anotacoes_fts
            ON anotacoes
            USING GIN(to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, '')))
        """)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS idx_tarefas_fts")
        op.execute("DROP INDEX IF EXISTS idx_anotacoes_fts")
