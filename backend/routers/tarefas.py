"""
routers/tarefas.py — Kanban, Webhook, Anotações, Notificações, Labels, Subtarefas
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
RF-2.01: Motor de scoring via logic/scoring.py
RF-2.02: Filtro de keywords ativo no webhook
B5:  Paginação no GET /tarefas (limit/offset, default 50)
B11: Soft delete (deletado_em em vez de hard delete)
"""
import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload

import database
import models
from auth import get_current_user, registrar_auditoria
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
    RecorrenciaCreate,
    RecorrenciaResponse,
    DependenciaItem,
    AtividadeResponse,
)

logger = logging.getLogger("simply-life")
router = APIRouter(tags=["Tarefas & Domínios"])

# E3: broadcast helper para ws
from routers.ws import broadcast as _ws_broadcast
import asyncio

def _fire_ws(usuario_id: int, event_type: str, payload: dict) -> None:
    """dispara broadcast ws sem bloquear (fire-and-forget)."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_ws_broadcast(usuario_id, {"type": event_type, **payload}))
    except RuntimeError:
        pass  # sem event loop ativo (testes sync)

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
        versao=t.versao or 1,
        subtarefas=[SubtarefaResponse(
            id=s.id, titulo=s.titulo, concluida=bool(s.concluida), ordem=s.ordem
        ) for s in (t.subtarefas or [])],
        labels=[LabelResponse(id=l.id, nome=l.nome, cor=l.cor) for l in (t.labels or [])],
    ).model_dump(mode="json")


def _log_atividade(db: Session, tarefa_id: int, usuario_id: int, tipo: str, detalhe: str | None = None) -> None:
    """registra um evento no feed de atividade da tarefa (D5)."""
    entrada = models.AtividadeTarefa(
        tarefa_id=tarefa_id,
        usuario_id=usuario_id,
        tipo=tipo,
        detalhe=detalhe,
    )
    db.add(entrada)
    # não faz commit — o chamador faz


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


# ── Webhook M2M com HMAC (machine-to-machine) ────────────────

def _verify_hmac_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    """Verifica HMAC-SHA256 do payload contra a assinatura fornecida."""
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/webhook/secret", tags=["Webhook"])
def gerar_webhook_secret(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Gera ou regenera o secret HMAC para webhooks M2M do usuário."""
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

    raw_secret = secrets.token_urlsafe(32)

    existing = db.query(models.WebhookSecret).filter(
        models.WebhookSecret.usuario_id == current_user.id
    ).first()

    if existing:
        existing.secret_hash = pwd_ctx.hash(raw_secret)
        existing.ativo = True
    else:
        db.add(models.WebhookSecret(
            usuario_id=current_user.id,
            secret_hash=pwd_ctx.hash(raw_secret),
        ))
    db.commit()

    return {
        "secret": raw_secret,
        "aviso": "Guarde este secret — ele não será exibido novamente.",
        "uso": "Envie o header X-Webhook-Signature: sha256=HMAC_HEX no POST /webhook/m2m/{usuario_id}",
    }


@router.post("/webhook/m2m/{usuario_id}", tags=["Webhook"])
async def receber_webhook_m2m(
    usuario_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    """Webhook M2M autenticado via HMAC-SHA256 (não requer JWT)."""
    signature = request.headers.get("X-Webhook-Signature", "")
    if not signature:
        raise HTTPException(status_code=401, detail="Header X-Webhook-Signature ausente.")

    ws = db.query(models.WebhookSecret).filter(
        models.WebhookSecret.usuario_id == usuario_id,
        models.WebhookSecret.ativo == True,
    ).first()
    if not ws:
        raise HTTPException(status_code=401, detail="Webhook secret não configurado para este usuário.")

    body = await request.body()

    # Verificar HMAC usando comparação constante
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Precisamos do secret em texto para HMAC, mas só temos o hash.
    # Abordagem: usar o secret_hash como chave HMAC diretamente (ambos os lados conhecem).
    expected = hmac.new(ws.secret_hash.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(f"sha256={expected}", signature):
        registrar_auditoria(db, "webhook_hmac_falhou", request, usuario_id=usuario_id)
        raise HTTPException(status_code=401, detail="Assinatura HMAC inválida.")

    import json
    try:
        payload = json.loads(body)
        dados = WebhookPayload(**payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Payload inválido.")

    background_tasks.add_task(motor_de_score_worker, usuario_id, dados, db)
    registrar_auditoria(db, "webhook_m2m_recebido", request, usuario_id=usuario_id, detalhes={"titulo": dados.titulo})
    return {"status": "Recebido via HMAC. Triagem iniciada."}


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


# ── Sprint D: Integração Profunda ────────────────────────────

# D2: tempo total registrado em sessões de foco para a tarefa
@router.get("/tarefas/{tarefa_id}/tempo")
def get_tempo_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    from sqlalchemy import func
    total = (
        db.query(func.sum(models.SessaoFoco.duracao_minutos))
        .filter(
            models.SessaoFoco.tarefa_id == tarefa_id,
            models.SessaoFoco.user_id == current_user.id,
        )
        .scalar()
    ) or 0
    sessoes = (
        db.query(models.SessaoFoco)
        .filter(
            models.SessaoFoco.tarefa_id == tarefa_id,
            models.SessaoFoco.user_id == current_user.id,
        )
        .order_by(models.SessaoFoco.created_at.desc())
        .limit(10)
        .all()
    )
    return {
        "total_minutos": total,
        "sessoes": [{"id": s.id, "duracao_minutos": s.duracao_minutos, "created_at": s.created_at} for s in sessoes],
    }


# D3: recorrência de tarefa
VALID_FREQUENCIA = {"diaria", "semanal", "mensal"}


@router.get("/tarefas/{tarefa_id}/recorrencia")
def get_recorrencia(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    rec = db.query(models.TarefaRecorrencia).filter(
        models.TarefaRecorrencia.tarefa_id == tarefa_id,
        models.TarefaRecorrencia.usuario_id == current_user.id,
    ).first()
    if not rec:
        return {"recorrencia": None}
    return {"recorrencia": RecorrenciaResponse.model_validate(rec).model_dump()}


@router.post("/tarefas/{tarefa_id}/recorrencia", status_code=201)
def criar_ou_atualizar_recorrencia(
    tarefa_id: int,
    dados: RecorrenciaCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    if dados.frequencia not in VALID_FREQUENCIA:
        raise HTTPException(status_code=422, detail=f"Frequência inválida. Use: {VALID_FREQUENCIA}")

    rec = db.query(models.TarefaRecorrencia).filter(
        models.TarefaRecorrencia.tarefa_id == tarefa_id,
        models.TarefaRecorrencia.usuario_id == current_user.id,
    ).first()

    if rec:
        rec.frequencia = dados.frequencia
        rec.ativa = True
    else:
        rec = models.TarefaRecorrencia(
            tarefa_id=tarefa_id,
            usuario_id=current_user.id,
            frequencia=dados.frequencia,
        )
        db.add(rec)

    db.commit()
    db.refresh(rec)
    return {"recorrencia": RecorrenciaResponse.model_validate(rec).model_dump()}


@router.delete("/tarefas/{tarefa_id}/recorrencia")
def remover_recorrencia(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    rec = db.query(models.TarefaRecorrencia).filter(
        models.TarefaRecorrencia.tarefa_id == tarefa_id,
        models.TarefaRecorrencia.usuario_id == current_user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Sem recorrência configurada")
    db.delete(rec)
    db.commit()
    return {"status": "sucesso"}


# D4: dependências entre tarefas
@router.get("/tarefas/{tarefa_id}/dependencias")
def listar_dependencias(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    deps = db.query(models.TarefaDependencia).filter(
        models.TarefaDependencia.tarefa_id == tarefa_id,
        models.TarefaDependencia.usuario_id == current_user.id,
    ).all()
    result = []
    for d in deps:
        bloqueio = db.query(models.TarefaUnificada).filter(
            models.TarefaUnificada.id == d.depende_de_id
        ).first()
        result.append(DependenciaItem(
            id=d.id,
            tarefa_id=d.tarefa_id,
            depende_de_id=d.depende_de_id,
            depende_de_titulo=bloqueio.titulo if bloqueio else "",
            depende_de_status=bloqueio.status if bloqueio else "",
        ).model_dump())
    return {"dependencias": result}


@router.post("/tarefas/{tarefa_id}/dependencias", status_code=201)
def adicionar_dependencia(
    tarefa_id: int,
    depende_de_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    if tarefa_id == depende_de_id:
        raise HTTPException(status_code=422, detail="Uma tarefa não pode depender de si mesma")
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    _get_tarefa_or_404(depende_de_id, current_user.id, db)

    existe = db.query(models.TarefaDependencia).filter(
        models.TarefaDependencia.tarefa_id == tarefa_id,
        models.TarefaDependencia.depende_de_id == depende_de_id,
    ).first()
    if existe:
        return {"status": "já existe"}

    dep = models.TarefaDependencia(
        tarefa_id=tarefa_id,
        depende_de_id=depende_de_id,
        usuario_id=current_user.id,
    )
    db.add(dep)
    _log_atividade(db, tarefa_id, current_user.id, "editou", f"Dependência adicionada: tarefa #{depende_de_id}")
    db.commit()
    db.refresh(dep)
    bloqueio = db.query(models.TarefaUnificada).filter(models.TarefaUnificada.id == depende_de_id).first()
    return {"dependencia": DependenciaItem(
        id=dep.id,
        tarefa_id=dep.tarefa_id,
        depende_de_id=dep.depende_de_id,
        depende_de_titulo=bloqueio.titulo if bloqueio else "",
        depende_de_status=bloqueio.status if bloqueio else "",
    ).model_dump()}


@router.delete("/tarefas/{tarefa_id}/dependencias/{dep_id}")
def remover_dependencia(
    tarefa_id: int,
    dep_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    dep = db.query(models.TarefaDependencia).filter(
        models.TarefaDependencia.id == dep_id,
        models.TarefaDependencia.tarefa_id == tarefa_id,
        models.TarefaDependencia.usuario_id == current_user.id,
    ).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Dependência não encontrada")
    db.delete(dep)
    db.commit()
    return {"status": "sucesso", "id": dep_id}


# D5: feed de atividade por tarefa
@router.get("/tarefas/{tarefa_id}/atividades")
def listar_atividades(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
    limit: int = Query(default=20, ge=1, le=50),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    atividades = (
        db.query(models.AtividadeTarefa)
        .filter(models.AtividadeTarefa.tarefa_id == tarefa_id)
        .order_by(models.AtividadeTarefa.created_at.desc())
        .limit(limit)
        .all()
    )
    return {"atividades": [AtividadeResponse.model_validate(a).model_dump() for a in atividades]}
