"""baseline_schema_completo

Revision ID: d1574881dec6
Revises:
Create Date: 2026-04-14 14:21:05.224111

Baseline no-op: todas as tabelas foram criadas diretamente no Supabase via MCP.
Futuras migrações devem usar `down_revision = 'd1574881dec6'`.
"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'd1574881dec6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: schema já existe no Supabase (criado via MCP migrations).
    pass


def downgrade() -> None:
    # Não aplicável para o baseline.
    pass
