"""
busca.py — endpoint de busca global (full-text search).

usa tsvector no postgres pra busca semântica em português.
em sqlite (ci/testes) faz fallback pra LIKE.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

import database
import models
from auth import get_current_user
from schemas import BuscaTarefaItem, BuscaAnotacaoItem, BuscaResponse

router = APIRouter(prefix="/busca", tags=["busca"])


def _is_postgres(db: Session) -> bool:
    """detecta se o banco é postgres (suporta tsvector) ou sqlite (fallback)"""
    return db.bind.dialect.name == "postgresql"


@router.get("", response_model=BuscaResponse)
def busca_global(
    q: str = Query("", min_length=0, max_length=200),
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(database.get_db),
    user=Depends(get_current_user),
):
    """
    busca unificada em tarefas e anotações do usuário.
    
    no postgres usa to_tsvector('portuguese', ...) com plainto_tsquery
    pra ranquear resultados por relevância.
    
    no sqlite (testes) faz LIKE %q% — funcional mas sem ranking.
    """
    if not q or not q.strip():
        return BuscaResponse(tarefas=[], anotacoes=[], total=0)

    q = q.strip()

    # ── busca em tarefas ──────────────────────────────────────
    if _is_postgres(db):
        # full-text search com ranking por relevância
        tarefas_query = text("""
            SELECT id, titulo, status, prioridade, origem
            FROM tarefas_unificadas
            WHERE usuario_id = :uid
              AND to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, ''))
                  @@ plainto_tsquery('portuguese', :q)
            ORDER BY ts_rank(
                to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')),
                plainto_tsquery('portuguese', :q)
            ) DESC
            LIMIT :limite
        """)
    else:
        # fallback sqlite — busca simples por substring
        tarefas_query = text("""
            SELECT id, titulo, status, prioridade, origem
            FROM tarefas_unificadas
            WHERE usuario_id = :uid
              AND (lower(titulo) LIKE :pattern OR lower(coalesce(descricao, '')) LIKE :pattern)
            LIMIT :limite
        """)

    params = {"uid": user.id, "q": q, "limite": limite, "pattern": f"%{q.lower()}%"}
    tarefas_rows = db.execute(tarefas_query, params).fetchall()

    tarefas_items = [
        BuscaTarefaItem(
            id=row.id,
            titulo=row.titulo,
            status=row.status,
            prioridade=row.prioridade,
            origem=row.origem,
        )
        for row in tarefas_rows
    ]

    # ── busca em anotações ────────────────────────────────────
    if _is_postgres(db):
        notas_query = text("""
            SELECT id, titulo, substr(conteudo, 1, 100) as preview
            FROM anotacoes
            WHERE usuario_id = :uid
              AND to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, ''))
                  @@ plainto_tsquery('portuguese', :q)
            ORDER BY ts_rank(
                to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, '')),
                plainto_tsquery('portuguese', :q)
            ) DESC
            LIMIT :limite
        """)
    else:
        notas_query = text("""
            SELECT id, titulo, substr(conteudo, 1, 100) as preview
            FROM anotacoes
            WHERE usuario_id = :uid
              AND (lower(coalesce(titulo, '')) LIKE :pattern OR lower(conteudo) LIKE :pattern)
            LIMIT :limite
        """)

    notas_rows = db.execute(notas_query, params).fetchall()

    notas_items = [
        BuscaAnotacaoItem(
            id=row.id,
            titulo=row.titulo,
            preview=row.preview or "",
        )
        for row in notas_rows
    ]

    return BuscaResponse(
        tarefas=tarefas_items,
        anotacoes=notas_items,
        total=len(tarefas_items) + len(notas_items),
    )
