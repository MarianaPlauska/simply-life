"""
routers/tarefas.py — CRUD principal de Tarefas + Webhook de ingestão.

RF-1.04: Todas as queries filtram por usuario_id = current_user.id
RF-2.01: Motor de scoring via logic/scoring.py
RF-2.02: Filtro de keywords ativo no webhook
B5:  Paginação no GET /tarefas (limit/offset, default 50)
B11: Soft delete (deletado_em em vez de hard delete)

Domínios separados em routers próprios:
  • labels.py         — Labels, Subtarefas, associações Label↔Tarefa
  • anotacoes.py      — Anotações e Notificações
  • templates.py      — Templates de Tarefa (C7)
  • relacionamentos.py — Tempo, Recorrência, Dependências, Atividades (Sprint D)
  • webhooks.py       — Webhooks HMAC M2M
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

import database
import models
from auth import get_current_user
from routers.tarefas_helpers import (
    VALID_PRIORIDADE,
    VALID_STATUS,
    _fire_ws,
    _get_tarefa_or_404,
    _log_atividade,
    _tarefa_to_response,
    motor_de_score_worker,
)
from schemas import TarefaCreate, TarefaUpdate, WebhookPayload

logger = logging.getLogger("simply-life")
router = APIRouter(tags=["Tarefas"])


# ── CRUD Tarefas ──────────────────────────────────────────────

@router.get("/tarefas")
def listar_tarefas(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """B5: paginação com limit/offset. B11: exclui soft-deleted."""
    base_query = (
        db.query(models.TarefaUnificada)
        .options(
            selectinload(models.TarefaUnificada.subtarefas),
            selectinload(models.TarefaUnificada.labels),
        )
        .filter(
            models.TarefaUnificada.usuario_id == current_user.id,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .order_by(models.TarefaUnificada.score_urgencia.desc())
    )
    total = db.query(models.TarefaUnificada).filter(
        models.TarefaUnificada.usuario_id == current_user.id,
        models.TarefaUnificada.deletado_em.is_(None),
    ).count()
    tarefas = base_query.offset(offset).limit(limit).all()
    return {"total": total, "limit": limit, "offset": offset, "tarefas": [_tarefa_to_response(t) for t in tarefas]}


@router.post("/tarefas", status_code=201, response_model=dict)
def criar_tarefa(
    dados: TarefaCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    if dados.status not in VALID_STATUS:
        raise HTTPException(status_code=422, detail=f"Status inválido. Use: {VALID_STATUS}")
    if dados.prioridade not in VALID_PRIORIDADE:
        raise HTTPException(status_code=422, detail=f"Prioridade inválida. Use: {VALID_PRIORIDADE}")

    nova = models.TarefaUnificada(
        usuario_id=current_user.id,
        titulo=dados.titulo,
        descricao=dados.descricao,
        snippet_100_char=dados.titulo[:100],
        status=dados.status,
        prioridade=dados.prioridade,
        origem=dados.origem,
        data_vencimento=dados.data_vencimento,
        notas_locais=dados.notas_locais,
        score_urgencia=0,
        created_at=datetime.now(timezone.utc),
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    _log_atividade(db, nova.id, current_user.id, "criou", f"Tarefa '{nova.titulo[:60]}' criada")
    db.commit()
    resp = _tarefa_to_response(nova)
    _fire_ws(current_user.id, "tarefa_criada", {"tarefa": resp})
    return {"tarefa": resp}


@router.put("/tarefas/{tarefa_id}")
def atualizar_tarefa_completa(
    tarefa_id: int,
    dados: TarefaCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """PUT — atualização completa (todos os campos obrigatórios)."""
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)

    if dados.status not in VALID_STATUS:
        raise HTTPException(status_code=422, detail=f"Status inválido. Use: {VALID_STATUS}")
    if dados.prioridade not in VALID_PRIORIDADE:
        raise HTTPException(status_code=422, detail=f"Prioridade inválida. Use: {VALID_PRIORIDADE}")

    tarefa.titulo = dados.titulo
    tarefa.descricao = dados.descricao
    tarefa.snippet_100_char = dados.titulo[:100]
    tarefa.status = dados.status
    tarefa.prioridade = dados.prioridade
    tarefa.origem = dados.origem
    tarefa.data_vencimento = dados.data_vencimento
    tarefa.notas_locais = dados.notas_locais

    db.commit()
    db.refresh(tarefa)
    return {"tarefa": _tarefa_to_response(tarefa)}


@router.patch("/tarefas/{tarefa_id}")
def atualizar_tarefa_parcial(
    tarefa_id: int,
    dados: TarefaUpdate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """PATCH — atualização parcial (apenas campos enviados)."""
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)

    # E2: optimistic locking — rejeita se versão do cliente está desatualizada
    if dados.versao is not None and dados.versao != tarefa.versao:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tarefa foi alterada por outra sessão. Recarregue e tente novamente.",
        )

    detalhes: list[str] = []

    if dados.titulo is not None:
        detalhes.append(f"título → '{dados.titulo[:40]}'")
        tarefa.titulo = dados.titulo
        tarefa.snippet_100_char = dados.titulo[:100]
    if dados.descricao is not None:
        tarefa.descricao = dados.descricao
    if dados.status is not None:
        if dados.status not in VALID_STATUS:
            raise HTTPException(status_code=422, detail=f"Status inválido. Use: {VALID_STATUS}")
        if dados.status != tarefa.status:
            tipo_log = "concluiu" if dados.status == "concluida" else "moveu"
            detalhes.append(f"status → '{dados.status}'")
            tarefa.status = dados.status
    if dados.prioridade is not None:
        if dados.prioridade not in VALID_PRIORIDADE:
            raise HTTPException(status_code=422, detail=f"Prioridade inválida. Use: {VALID_PRIORIDADE}")
        if dados.prioridade != tarefa.prioridade:
            detalhes.append(f"prioridade → '{dados.prioridade}'")
        tarefa.prioridade = dados.prioridade
    if dados.notas_locais is not None:
        tarefa.notas_locais = dados.notas_locais
    if dados.data_vencimento is not None:
        tarefa.data_vencimento = dados.data_vencimento

    if detalhes:
        tipo_log = "concluiu" if dados.status == "concluida" else ("moveu" if dados.status else "editou")
        _log_atividade(db, tarefa.id, current_user.id, tipo_log, "; ".join(detalhes))

    # E2: incrementa versão a cada update
    tarefa.versao = (tarefa.versao or 1) + 1

    db.commit()
    db.refresh(tarefa)
    resp = _tarefa_to_response(tarefa)
    _fire_ws(current_user.id, "tarefa_atualizada", {"tarefa": resp})
    return {"tarefa": resp}


@router.delete("/tarefas/{tarefa_id}")
def deletar_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """B11: soft delete — marca deletado_em em vez de remover do banco."""
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)
    _log_atividade(db, tarefa.id, current_user.id, "arquivou", "Tarefa arquivada")
    tarefa.deletado_em = datetime.now(timezone.utc)
    db.commit()
    logger.info("tarefa soft-deleted: id=%s user=%s", tarefa_id, current_user.id)
    _fire_ws(current_user.id, "tarefa_deletada", {"tarefa_id": tarefa_id})
    return {"status": "sucesso", "id": tarefa_id}


# C6: listar tarefas arquivadas (soft-deleted)
@router.get("/tarefas/arquivo")
def listar_arquivo(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    base = (
        db.query(models.TarefaUnificada)
        .options(
            selectinload(models.TarefaUnificada.subtarefas),
            selectinload(models.TarefaUnificada.labels),
        )
        .filter(
            models.TarefaUnificada.usuario_id == current_user.id,
            models.TarefaUnificada.deletado_em.isnot(None),
        )
        .order_by(models.TarefaUnificada.deletado_em.desc())
    )
    total = db.query(models.TarefaUnificada).filter(
        models.TarefaUnificada.usuario_id == current_user.id,
        models.TarefaUnificada.deletado_em.isnot(None),
    ).count()
    tarefas = base.offset(offset).limit(limit).all()
    seen = set()
    unique = []
    for t in tarefas:
        if t.id not in seen:
            seen.add(t.id)
            unique.append(t)
    return {"total": total, "limit": limit, "offset": offset, "tarefas": [_tarefa_to_response(t) for t in unique]}


# C6: restaurar tarefa arquivada
@router.patch("/tarefas/{tarefa_id}/restaurar")
def restaurar_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefa = (
        db.query(models.TarefaUnificada)
        .filter(
            models.TarefaUnificada.id == tarefa_id,
            models.TarefaUnificada.usuario_id == current_user.id,
            models.TarefaUnificada.deletado_em.isnot(None),
        )
        .first()
    )
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa arquivada não encontrada")
    tarefa.deletado_em = None
    db.commit()
    db.refresh(tarefa)
    logger.info("tarefa restaurada: id=%s user=%s", tarefa_id, current_user.id)
    return {"tarefa": _tarefa_to_response(tarefa)}


# C4: duplicar tarefa (com subtarefas e labels)
@router.post("/tarefas/{tarefa_id}/duplicar", status_code=201)
def duplicar_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    original = _get_tarefa_or_404(tarefa_id, current_user.id, db)
    copia = models.TarefaUnificada(
        usuario_id=current_user.id,
        titulo=f"{original.titulo} (cópia)",
        descricao=original.descricao,
        snippet_100_char=original.snippet_100_char,
        score_urgencia=original.score_urgencia,
        status="pendente",
        prioridade=original.prioridade,
        origem="manual",
        notas_locais=original.notas_locais,
        data_vencimento=original.data_vencimento,
        created_at=datetime.now(timezone.utc),
    )
    db.add(copia)
    db.flush()

    # duplicar subtarefas
    for sub in (original.subtarefas or []):
        nova_sub = models.Subtarefa(
            tarefa_id=copia.id,
            titulo=sub.titulo,
            concluida=False,
            ordem=sub.ordem,
        )
        db.add(nova_sub)

    # copiar labels
    for label in (original.labels or []):
        tl = models.TarefaLabel(tarefa_id=copia.id, label_id=label.id)
        db.add(tl)

    db.commit()
    db.refresh(copia)
    logger.info("tarefa duplicada: original=%s copia=%s user=%s", tarefa_id, copia.id, current_user.id)
    return {"tarefa": _tarefa_to_response(copia)}


@router.get("/tarefas/busca")
def buscar_tarefas(
    q: str = "",
    status_filter: str = "",
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    query = db.query(models.TarefaUnificada).filter(
        models.TarefaUnificada.usuario_id == current_user.id
    )
    if q:
        safe_q = q.replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{safe_q}%"
        query = query.filter(
            models.TarefaUnificada.titulo.ilike(pattern)
            | models.TarefaUnificada.notas_locais.ilike(pattern)
        )
    if status_filter:
        if status_filter not in VALID_STATUS:
            raise HTTPException(status_code=422, detail=f"Status inválido. Use: {VALID_STATUS}")
        query = query.filter(models.TarefaUnificada.status == status_filter)

    tarefas = query.order_by(models.TarefaUnificada.score_urgencia.desc()).all()
    return {"total": len(tarefas), "tarefas": [_tarefa_to_response(t) for t in tarefas]}


@router.post("/webhook/ingestao")
def receber_webhook(
    dados: WebhookPayload,
    background_tasks: BackgroundTasks,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    background_tasks.add_task(motor_de_score_worker, current_user.id, dados, db)
    return {"status": "Recebido com sucesso. Triagem iniciada."}


