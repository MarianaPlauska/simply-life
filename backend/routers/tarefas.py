"""
routers/tarefas.py — Kanban, Webhook, Anotações, Notificações
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
RF-2.01: Motor de scoring via logic/scoring.py
RF-2.02: Filtro de keywords ativo no webhook
"""
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

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
)

router = APIRouter(tags=["Tarefas & Domínios"])


# ── Background worker (usa scoring module) ────────────────────
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
    )
    db.add(nova_tarefa)
    db.commit()

    # Notificação pró-ativa: só cria se score ≥ threshold crítico (RF-2.01)
    if urgencia > 120:
        notif = models.Notificacao(
            usuario_id=usuario_id,
            tipo="tarefa",
            titulo=f"⚡ Foco Crítico: {dados.titulo[:55]}",
            mensagem=f"Score {urgencia} — Ação imediata requerida. Origem: {dados.plataforma}",
            urgencia="critica",
            score_urgencia=urgencia,
            criado_em=datetime.now().isoformat(),
        )
        db.add(notif)
        db.commit()
    elif urgencia > 60:
        # Notificação informativa para tarefas de alta prioridade
        notif = models.Notificacao(
            usuario_id=usuario_id,
            tipo="tarefa",
            titulo=f"Nova tarefa triada: {dados.titulo[:60]}",
            mensagem=f"Score {urgencia} — Origem: {dados.plataforma}",
            urgencia="alta" if urgencia > 80 else "normal",
            score_urgencia=urgencia,
            criado_em=datetime.now().isoformat(),
        )
        db.add(notif)
        db.commit()

    print(f"✅ Tarefa Triada! Score Final: {urgencia} | Keywords: {keywords}")


# ── Endpoints ─────────────────────────────────────────────────

@router.get("/tarefas")
def listar_tarefas(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefas = (
        db.query(models.TarefaUnificada)
        .filter(models.TarefaUnificada.usuario_id == current_user.id)
        .order_by(models.TarefaUnificada.score_urgencia.desc())
        .all()
    )
    return {"total": len(tarefas), "tarefas": tarefas}


@router.post("/webhook/ingestao")
def receber_webhook(
    dados: WebhookPayload,
    background_tasks: BackgroundTasks,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    background_tasks.add_task(motor_de_score_worker, current_user.id, dados, db)
    return {"status": "Recebido com sucesso. Triagem iniciada."}


# ── CRUD Tarefas ──────────────────────────────────────────────

@router.post("/tarefas", status_code=201)
def criar_tarefa(
    dados: TarefaCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    nova = models.TarefaUnificada(
        usuario_id=current_user.id,
        titulo=dados.titulo,
        snippet_100_char=dados.titulo[:100],
        status=dados.status,
        notas_locais=dados.notas_locais,
        score_urgencia=0,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return {"tarefa": {
        "id": nova.id, "titulo": nova.titulo, "status": nova.status,
        "notas_locais": nova.notas_locais, "score_urgencia": nova.score_urgencia,
        "snippet_100_char": nova.snippet_100_char,
    }}


@router.patch("/tarefas/{tarefa_id}")
def atualizar_tarefa(
    tarefa_id: int,
    dados: TarefaUpdate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefa = (
        db.query(models.TarefaUnificada)
        .filter(
            models.TarefaUnificada.id == tarefa_id,
            models.TarefaUnificada.usuario_id == current_user.id,
        )
        .first()
    )
    if not tarefa:
        return JSONResponse(status_code=404, content={"erro": "Tarefa não encontrada"})

    if dados.titulo is not None:
        tarefa.titulo = dados.titulo
        tarefa.snippet_100_char = dados.titulo[:100]
    if dados.status is not None:
        tarefa.status = dados.status
    if dados.notas_locais is not None:
        tarefa.notas_locais = dados.notas_locais

    db.commit()
    db.refresh(tarefa)
    return {"tarefa": {
        "id": tarefa.id, "titulo": tarefa.titulo, "status": tarefa.status,
        "notas_locais": tarefa.notas_locais, "score_urgencia": tarefa.score_urgencia,
        "snippet_100_char": tarefa.snippet_100_char,
    }}


@router.delete("/tarefas/{tarefa_id}")
def deletar_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tarefa = (
        db.query(models.TarefaUnificada)
        .filter(
            models.TarefaUnificada.id == tarefa_id,
            models.TarefaUnificada.usuario_id == current_user.id,
        )
        .first()
    )
    if not tarefa:
        return JSONResponse(status_code=404, content={"erro": "Tarefa não encontrada"})

    db.delete(tarefa)
    db.commit()
    return {"status": "sucesso", "id": tarefa_id}


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
        query = query.filter(
            models.TarefaUnificada.titulo.ilike(f"%{q}%")
            | models.TarefaUnificada.notas_locais.ilike(f"%{q}%")
        )
    if status_filter:
        query = query.filter(models.TarefaUnificada.status == status_filter)

    tarefas = query.order_by(models.TarefaUnificada.score_urgencia.desc()).all()
    return {"total": len(tarefas), "tarefas": tarefas}


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
