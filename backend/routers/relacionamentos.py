"""
routers/relacionamentos.py — Tempo, Recorrência, Dependências e Atividades de Tarefa.

Cobre Sprint D (D2–D5): integrações profundas entre entidades.
Separado de tarefas.py para manter routers focados e abaixo de ~300 linhas.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from routers.tarefas_helpers import (
    VALID_FREQUENCIA,
    _get_tarefa_or_404,
    _log_atividade,
)
from schemas import AtividadeResponse, DependenciaItem, RecorrenciaCreate, RecorrenciaResponse

logger = logging.getLogger("simply-life")

router = APIRouter(tags=["Relacionamentos de Tarefa"])


# ── D2: Tempo registrado (sessões de foco) ────────────────────

@router.get("/tarefas/{tarefa_id}/tempo")
def get_tempo_tarefa(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
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
        "sessoes": [
            {"id": s.id, "duracao_minutos": s.duracao_minutos, "created_at": s.created_at}
            for s in sessoes
        ],
    }


# ── D3: Recorrência ───────────────────────────────────────────

@router.get("/tarefas/{tarefa_id}/recorrencia")
def get_recorrencia(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    rec = (
        db.query(models.TarefaRecorrencia)
        .filter(
            models.TarefaRecorrencia.tarefa_id == tarefa_id,
            models.TarefaRecorrencia.usuario_id == current_user.id,
        )
        .first()
    )
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

    rec = (
        db.query(models.TarefaRecorrencia)
        .filter(
            models.TarefaRecorrencia.tarefa_id == tarefa_id,
            models.TarefaRecorrencia.usuario_id == current_user.id,
        )
        .first()
    )

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
    rec = (
        db.query(models.TarefaRecorrencia)
        .filter(
            models.TarefaRecorrencia.tarefa_id == tarefa_id,
            models.TarefaRecorrencia.usuario_id == current_user.id,
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Sem recorrência configurada")
    db.delete(rec)
    db.commit()
    return {"status": "sucesso"}


# ── D4: Dependências entre Tarefas ───────────────────────────

@router.get("/tarefas/{tarefa_id}/dependencias")
def listar_dependencias(
    tarefa_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_tarefa_or_404(tarefa_id, current_user.id, db)
    deps = (
        db.query(models.TarefaDependencia)
        .filter(
            models.TarefaDependencia.tarefa_id == tarefa_id,
            models.TarefaDependencia.usuario_id == current_user.id,
        )
        .all()
    )
    result = []
    for d in deps:
        bloqueio = (
            db.query(models.TarefaUnificada)
            .filter(models.TarefaUnificada.id == d.depende_de_id)
            .first()
        )
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

    existe = (
        db.query(models.TarefaDependencia)
        .filter(
            models.TarefaDependencia.tarefa_id == tarefa_id,
            models.TarefaDependencia.depende_de_id == depende_de_id,
        )
        .first()
    )
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
    bloqueio = (
        db.query(models.TarefaUnificada)
        .filter(models.TarefaUnificada.id == depende_de_id)
        .first()
    )
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
    dep = (
        db.query(models.TarefaDependencia)
        .filter(
            models.TarefaDependencia.id == dep_id,
            models.TarefaDependencia.tarefa_id == tarefa_id,
            models.TarefaDependencia.usuario_id == current_user.id,
        )
        .first()
    )
    if not dep:
        raise HTTPException(status_code=404, detail="Dependência não encontrada")
    db.delete(dep)
    db.commit()
    return {"status": "sucesso", "id": dep_id}


# ── D5: Feed de Atividade por Tarefa ─────────────────────────

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
