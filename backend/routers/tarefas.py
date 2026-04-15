"""
routers/tarefas.py — Kanban, Webhook, Anotações, Notificações, Labels, Subtarefas
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
RF-2.01: Motor de scoring via logic/scoring.py
RF-2.02: Filtro de keywords ativo no webhook
B5:  Paginação no GET /tarefas (limit/offset, default 50)
B11: Soft delete (deletado_em em vez de hard delete)
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload

import database
import models
from auth import get_current_user
from logic.scoring import calcular_prioridade
from schemas import (
    WebhookPayload,
    AnotacaoCreate,
    NotificacaoCreate,
    TarefaCreate,
    TarefaUpdate,
    TarefaResponse,
    LabelCreate,
    LabelResponse,
    SubtarefaCreate,
    SubtarefaUpdate,
    SubtarefaResponse,
    TemplateCreate,
    TemplateResponse,
)

logger = logging.getLogger("simply-life")
router = APIRouter(tags=["Tarefas & Domínios"])

VALID_STATUS = {"pendente", "em_progresso", "concluida"}
VALID_PRIORIDADE = {"baixa", "media", "alta", "critica"}


# ── Helpers ───────────────────────────────────────────────────

def _get_tarefa_or_404(
    tarefa_id: int,
    user_id: int,
    db: Session,
) -> models.TarefaUnificada:
    tarefa = (
        db.query(models.TarefaUnificada)
        .options(joinedload(models.TarefaUnificada.subtarefas), joinedload(models.TarefaUnificada.labels))
        .filter(
            models.TarefaUnificada.id == tarefa_id,
            models.TarefaUnificada.usuario_id == user_id,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .first()
    )
    if not tarefa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    return tarefa


def _tarefa_to_response(t: models.TarefaUnificada) -> dict:
    return TarefaResponse(
        id=t.id,
        titulo=t.titulo,
        descricao=t.descricao,
        status=t.status,
        prioridade=t.prioridade,
        origem=t.origem,
        score_urgencia=t.score_urgencia,
        notas_locais=t.notas_locais,
        data_vencimento=t.data_vencimento,
        created_at=t.created_at,
        subtarefas=[SubtarefaResponse(
            id=s.id, titulo=s.titulo, concluida=bool(s.concluida), ordem=s.ordem
        ) for s in (t.subtarefas or [])],
        labels=[LabelResponse(id=l.id, nome=l.nome, cor=l.cor) for l in (t.labels or [])],
    ).model_dump(mode="json")


def motor_de_score_worker(usuario_id: int, dados: WebhookPayload, db: Session):
    prefs = db.query(models.PreferenciasUsuario).filter(
        models.PreferenciasUsuario.usuario_id == usuario_id
    ).first()
    keywords = prefs.palavras_chave_email if prefs else ""

    urgencia = calcular_prioridade(dados.titulo, dados.conteudo, keywords, dados.plataforma)
    snippet_seguro = dados.conteudo[:100]

    nova_tarefa = models.TarefaUnificada(
        usuario_id=usuario_id,
        titulo=dados.titulo,
        snippet_100_char=snippet_seguro,
        score_urgencia=urgencia,
        status="pendente",
        prioridade="media",
        origem=dados.plataforma,
        created_at=datetime.now(timezone.utc),
    )
    db.add(nova_tarefa)
    db.commit()

    if urgencia > 120:
        notif = models.Notificacao(
            usuario_id=usuario_id,
            tipo="tarefa",
            titulo=f"⚡ Foco Crítico: {dados.titulo[:55]}",
            mensagem=f"Score {urgencia} — Ação imediata requerida. Origem: {dados.plataforma}",
            urgencia="critica",
            score_urgencia=urgencia,
            criado_em=datetime.now(timezone.utc).isoformat(),
        )
        db.add(notif)
        db.commit()
    elif urgencia > 60:
        notif = models.Notificacao(
            usuario_id=usuario_id,
            tipo="tarefa",
            titulo=f"Nova tarefa triada: {dados.titulo[:60]}",
            mensagem=f"Score {urgencia} — Origem: {dados.plataforma}",
            urgencia="alta" if urgencia > 80 else "normal",
            score_urgencia=urgencia,
            criado_em=datetime.now(timezone.utc).isoformat(),
        )
        db.add(notif)
        db.commit()

    logger.info("tarefa triada: score=%s keywords=%s", urgencia, keywords)


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
        .options(joinedload(models.TarefaUnificada.subtarefas), joinedload(models.TarefaUnificada.labels))
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

    # Deduplicate (joinedload may cause duplicates with multiple relationships)
    seen = set()
    unique = []
    for t in tarefas:
        if t.id not in seen:
            seen.add(t.id)
            unique.append(t)
    return {"total": total, "limit": limit, "offset": offset, "tarefas": [_tarefa_to_response(t) for t in unique]}


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
    return {"tarefa": _tarefa_to_response(nova)}


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

    if dados.titulo is not None:
        tarefa.titulo = dados.titulo
        tarefa.snippet_100_char = dados.titulo[:100]
    if dados.descricao is not None:
        tarefa.descricao = dados.descricao
    if dados.status is not None:
        if dados.status not in VALID_STATUS:
            raise HTTPException(status_code=422, detail=f"Status inválido. Use: {VALID_STATUS}")
        tarefa.status = dados.status
    if dados.prioridade is not None:
        if dados.prioridade not in VALID_PRIORIDADE:
            raise HTTPException(status_code=422, detail=f"Prioridade inválida. Use: {VALID_PRIORIDADE}")
        tarefa.prioridade = dados.prioridade
    if dados.notas_locais is not None:
        tarefa.notas_locais = dados.notas_locais
    if dados.data_vencimento is not None:
        tarefa.data_vencimento = dados.data_vencimento

    db.commit()
    db.refresh(tarefa)
    return {"tarefa": _tarefa_to_response(tarefa)}


@router.delete("/tarefas/{tarefa_id}")
def deletar_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """B11: soft delete — marca deletado_em em vez de remover do banco."""
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)
    tarefa.deletado_em = datetime.now(timezone.utc)
    db.commit()
    logger.info("tarefa soft-deleted: id=%s user=%s", tarefa_id, current_user.id)
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
        .options(joinedload(models.TarefaUnificada.subtarefas), joinedload(models.TarefaUnificada.labels))
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


# ── Labels ────────────────────────────────────────────────────

@router.get("/labels")
def listar_labels(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    labels = (
        db.query(models.Label)
        .filter(models.Label.usuario_id == current_user.id)
        .order_by(models.Label.nome)
        .all()
    )
    return [LabelResponse.model_validate(l).model_dump() for l in labels]


@router.post("/labels", status_code=201)
def criar_label(
    dados: LabelCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    # Verificar duplicata
    existe = (
        db.query(models.Label)
        .filter(models.Label.usuario_id == current_user.id, models.Label.nome == dados.nome)
        .first()
    )
    if existe:
        raise HTTPException(status_code=409, detail=f"Label '{dados.nome}' já existe.")

    nova = models.Label(
        usuario_id=current_user.id,
        nome=dados.nome,
        cor=dados.cor,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return LabelResponse.model_validate(nova).model_dump()


@router.delete("/labels/{label_id}")
def deletar_label(
    label_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    label = (
        db.query(models.Label)
        .filter(models.Label.id == label_id, models.Label.usuario_id == current_user.id)
        .first()
    )
    if not label:
        raise HTTPException(status_code=404, detail="Label não encontrada")
    db.delete(label)
    db.commit()
    return {"status": "sucesso", "id": label_id}


# ── Subtarefas ────────────────────────────────────────────────

@router.post("/tarefas/{tarefa_id}/subtarefas", status_code=201)
def criar_subtarefa(
    tarefa_id: int,
    dados: SubtarefaCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)
    nova = models.Subtarefa(
        tarefa_id=tarefa.id,
        titulo=dados.titulo,
        ordem=dados.ordem,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return SubtarefaResponse(id=nova.id, titulo=nova.titulo, concluida=bool(nova.concluida), ordem=nova.ordem).model_dump()


@router.patch("/subtarefas/{subtarefa_id}")
def atualizar_subtarefa(
    subtarefa_id: int,
    dados: SubtarefaUpdate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    sub = db.query(models.Subtarefa).filter(models.Subtarefa.id == subtarefa_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subtarefa não encontrada")
    # Verifica ownership via tarefa pai
    tarefa = (
        db.query(models.TarefaUnificada)
        .filter(models.TarefaUnificada.id == sub.tarefa_id, models.TarefaUnificada.usuario_id == current_user.id)
        .first()
    )
    if not tarefa:
        raise HTTPException(status_code=404, detail="Subtarefa não encontrada")

    if dados.titulo is not None:
        sub.titulo = dados.titulo
    if dados.concluida is not None:
        sub.concluida = 1 if dados.concluida else 0
    if dados.ordem is not None:
        sub.ordem = dados.ordem

    db.commit()
    db.refresh(sub)
    return SubtarefaResponse(id=sub.id, titulo=sub.titulo, concluida=bool(sub.concluida), ordem=sub.ordem).model_dump()


@router.delete("/subtarefas/{subtarefa_id}")
def deletar_subtarefa(
    subtarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    sub = db.query(models.Subtarefa).filter(models.Subtarefa.id == subtarefa_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subtarefa não encontrada")
    tarefa = (
        db.query(models.TarefaUnificada)
        .filter(models.TarefaUnificada.id == sub.tarefa_id, models.TarefaUnificada.usuario_id == current_user.id)
        .first()
    )
    if not tarefa:
        raise HTTPException(status_code=404, detail="Subtarefa não encontrada")

    db.delete(sub)
    db.commit()
    return {"status": "sucesso", "id": subtarefa_id}


# ── Labels em Tarefas (associar / remover) ────────────────────

@router.post("/tarefas/{tarefa_id}/labels/{label_id}", status_code=201)
def adicionar_label_tarefa(
    tarefa_id: int,
    label_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)
    label = (
        db.query(models.Label)
        .filter(models.Label.id == label_id, models.Label.usuario_id == current_user.id)
        .first()
    )
    if not label:
        raise HTTPException(status_code=404, detail="Label não encontrada")

    # Verificar se já está associada
    existe = (
        db.query(models.TarefaLabel)
        .filter(models.TarefaLabel.tarefa_id == tarefa.id, models.TarefaLabel.label_id == label.id)
        .first()
    )
    if existe:
        return {"status": "já associada"}

    assoc = models.TarefaLabel(tarefa_id=tarefa.id, label_id=label.id)
    db.add(assoc)
    db.commit()
    return {"status": "sucesso", "tarefa_id": tarefa.id, "label_id": label.id}


@router.delete("/tarefas/{tarefa_id}/labels/{label_id}")
def remover_label_tarefa(
    tarefa_id: int,
    label_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefa = _get_tarefa_or_404(tarefa_id, current_user.id, db)
    assoc = (
        db.query(models.TarefaLabel)
        .filter(models.TarefaLabel.tarefa_id == tarefa.id, models.TarefaLabel.label_id == label_id)
        .first()
    )
    if not assoc:
        raise HTTPException(status_code=404, detail="Label não associada a esta tarefa")
    db.delete(assoc)
    db.commit()
    return {"status": "sucesso"}


# ── Anotações ─────────────────────────────────────────────────

@router.get("/anotacoes")
def listar_anotacoes(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    anotacoes = (
        db.query(models.Anotacao)
        .filter(models.Anotacao.usuario_id == current_user.id)
        .order_by(models.Anotacao.fixado.desc(), models.Anotacao.id.desc())
        .all()
    )
    return {"anotacoes": [{
        "id": a.id, "titulo": a.titulo, "conteudo": a.conteudo,
        "fixado": a.fixado, "categoria": a.categoria or "pessoal",
    } for a in anotacoes]}


@router.post("/anotacoes")
def criar_anotacao(
    dados: AnotacaoCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    nova = models.Anotacao(
        usuario_id=current_user.id,
        titulo=dados.titulo,
        conteudo=dados.conteudo,
        categoria=dados.categoria,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return {"anotacao": {
        "id": nova.id, "titulo": nova.titulo, "conteudo": nova.conteudo,
        "fixado": nova.fixado, "categoria": nova.categoria,
    }}


# ── Notificações ──────────────────────────────────────────────

@router.get("/notificacoes")
def listar_notificacoes(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    rows = (
        db.query(models.Notificacao)
        .filter(models.Notificacao.usuario_id == current_user.id)
        .order_by(models.Notificacao.id.desc())
        .limit(30)
        .all()
    )
    return [{
        "id": n.id, "tipo": n.tipo, "titulo": n.titulo,
        "mensagem": n.mensagem, "lida": bool(n.lida),
        "urgencia": n.urgencia, "score_urgencia": n.score_urgencia,
        "criado_em": n.criado_em,
    } for n in rows]


@router.patch("/notificacoes/{notif_id}/lida")
def marcar_notificacao_lida(
    notif_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    n = (
        db.query(models.Notificacao)
        .filter(models.Notificacao.id == notif_id, models.Notificacao.usuario_id == current_user.id)
        .first()
    )
    if not n:
        return JSONResponse(status_code=404, content={"erro": "Notificação não encontrada"})
    n.lida = 1
    db.commit()
    return {"status": "sucesso"}


@router.patch("/notificacoes/marcar-todas-lidas")
def marcar_todas_lidas(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    db.query(models.Notificacao).filter(
        models.Notificacao.usuario_id == current_user.id,
        models.Notificacao.lida == 0,
    ).update({"lida": 1})
    db.commit()
    return {"status": "sucesso"}


# ── C7: Templates de Tarefa ──────────────────────────────────

@router.get("/templates")
def listar_templates(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    import json
    rows = (
        db.query(models.TarefaTemplate)
        .filter(models.TarefaTemplate.usuario_id == current_user.id)
        .order_by(models.TarefaTemplate.nome)
        .all()
    )
    result = []
    for t in rows:
        subs = []
        if t.subtarefas_json:
            try:
                subs = json.loads(t.subtarefas_json)
            except Exception:
                pass
        result.append({
            "id": t.id, "nome": t.nome, "prioridade": t.prioridade,
            "subtarefas": subs, "created_at": t.created_at,
        })
    return result


@router.post("/templates", status_code=201)
def criar_template(
    dados: TemplateCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    import json
    novo = models.TarefaTemplate(
        usuario_id=current_user.id,
        nome=dados.nome[:200].strip(),
        prioridade=dados.prioridade if dados.prioridade in VALID_PRIORIDADE else "media",
        subtarefas_json=json.dumps(dados.subtarefas[:20]) if dados.subtarefas else None,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    subs = json.loads(novo.subtarefas_json) if novo.subtarefas_json else []
    logger.info("template criado: id=%s user=%s", novo.id, current_user.id)
    return {"id": novo.id, "nome": novo.nome, "prioridade": novo.prioridade, "subtarefas": subs, "created_at": novo.created_at}


@router.delete("/templates/{template_id}")
def deletar_template(
    template_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tmpl = (
        db.query(models.TarefaTemplate)
        .filter(models.TarefaTemplate.id == template_id, models.TarefaTemplate.usuario_id == current_user.id)
        .first()
    )
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    db.delete(tmpl)
    db.commit()
    return {"status": "sucesso", "id": template_id}


@router.post("/templates/{template_id}/aplicar", status_code=201)
def aplicar_template(
    template_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    import json
    tmpl = (
        db.query(models.TarefaTemplate)
        .filter(models.TarefaTemplate.id == template_id, models.TarefaTemplate.usuario_id == current_user.id)
        .first()
    )
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template não encontrado")

    tarefa = models.TarefaUnificada(
        usuario_id=current_user.id,
        titulo=tmpl.nome,
        descricao=None,
        snippet_100_char=tmpl.nome[:100],
        score_urgencia=0,
        status="pendente",
        prioridade=tmpl.prioridade,
        origem="manual",
        created_at=datetime.now(timezone.utc),
    )
    db.add(tarefa)
    db.flush()

    subs = []
    if tmpl.subtarefas_json:
        try:
            subs = json.loads(tmpl.subtarefas_json)
        except Exception:
            pass
    for i, titulo_sub in enumerate(subs):
        sub = models.Subtarefa(tarefa_id=tarefa.id, titulo=str(titulo_sub)[:200], ordem=i)
        db.add(sub)

    db.commit()
    db.refresh(tarefa)
    logger.info("template aplicado: template=%s tarefa=%s user=%s", template_id, tarefa.id, current_user.id)
    return {"tarefa": _tarefa_to_response(tarefa)}
