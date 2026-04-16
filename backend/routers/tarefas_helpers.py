"""
routers/tarefas_helpers.py — helpers compartilhados entre os routers de tarefas.

Separado do router principal para evitar arquivos >1k linhas e permitir que
labels, subtarefas, templates e relacionamentos importem helpers sem criar
dependências circulares.
"""
import asyncio
import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

import models
from auth import registrar_auditoria  # noqa: F401 – re-exportado para conveniência
from logic.scoring import calcular_prioridade
from schemas import (
    LabelResponse,
    SubtarefaResponse,
    TarefaResponse,
)

logger = logging.getLogger("simply-life")

VALID_STATUS = {"pendente", "em_progresso", "concluida"}
VALID_PRIORIDADE = {"baixa", "media", "alta", "critica"}
VALID_FREQUENCIA = {"diaria", "semanal", "mensal"}


# ── WebSocket helper ──────────────────────────────────────────

def _fire_ws(usuario_id: int, event_type: str, payload: dict) -> None:
    """Dispara broadcast WS sem bloquear (fire-and-forget)."""
    try:
        from routers.ws import broadcast as _ws_broadcast
        loop = asyncio.get_running_loop()
        loop.create_task(_ws_broadcast(usuario_id, {"type": event_type, **payload}))
    except RuntimeError:
        pass  # sem event loop ativo (testes sync)


# ── Query helpers ─────────────────────────────────────────────

def _get_tarefa_or_404(
    tarefa_id: int,
    user_id: int,
    db: Session,
) -> models.TarefaUnificada:
    tarefa = (
        db.query(models.TarefaUnificada)
        .options(
            joinedload(models.TarefaUnificada.subtarefas),
            joinedload(models.TarefaUnificada.labels),
        )
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
        subtarefas=[
            SubtarefaResponse(id=s.id, titulo=s.titulo, concluida=bool(s.concluida), ordem=s.ordem)
            for s in (t.subtarefas or [])
        ],
        labels=[
            LabelResponse(id=l.id, nome=l.nome, cor=l.cor)
            for l in (t.labels or [])
        ],
    ).model_dump(mode="json")


def _log_atividade(
    db: Session,
    tarefa_id: int,
    usuario_id: int,
    tipo: str,
    detalhe: str | None = None,
) -> None:
    """Registra um evento no feed de atividade da tarefa (D5). Não faz commit."""
    entrada = models.AtividadeTarefa(
        tarefa_id=tarefa_id,
        usuario_id=usuario_id,
        tipo=tipo,
        detalhe=detalhe,
    )
    db.add(entrada)


# ── Background worker (motor de score) ───────────────────────

def motor_de_score_worker(usuario_id: int, dados, db: Session) -> None:
    """Processa payload de webhook: cria tarefa triada e notificação se necessário."""
    prefs = (
        db.query(models.PreferenciasUsuario)
        .filter(models.PreferenciasUsuario.usuario_id == usuario_id)
        .first()
    )
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
