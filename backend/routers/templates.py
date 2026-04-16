"""
routers/templates.py — Templates de Tarefa (C7).

Separado de tarefas.py para manter routers focados e abaixo de ~300 linhas.
"""
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from routers.tarefas_helpers import VALID_PRIORIDADE, _tarefa_to_response
from schemas import TemplateCreate, TemplateResponse  # noqa: F401

logger = logging.getLogger("simply-life")

router = APIRouter(tags=["Templates"])


@router.get("/templates")
def listar_templates(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
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
            "id": t.id,
            "nome": t.nome,
            "prioridade": t.prioridade,
            "subtarefas": subs,
            "created_at": t.created_at,
        })
    return result


@router.post("/templates", status_code=201)
def criar_template(
    dados: TemplateCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
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
    return {
        "id": novo.id,
        "nome": novo.nome,
        "prioridade": novo.prioridade,
        "subtarefas": subs,
        "created_at": novo.created_at,
    }


@router.delete("/templates/{template_id}")
def deletar_template(
    template_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    tmpl = (
        db.query(models.TarefaTemplate)
        .filter(
            models.TarefaTemplate.id == template_id,
            models.TarefaTemplate.usuario_id == current_user.id,
        )
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
    from datetime import datetime, timezone

    tmpl = (
        db.query(models.TarefaTemplate)
        .filter(
            models.TarefaTemplate.id == template_id,
            models.TarefaTemplate.usuario_id == current_user.id,
        )
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
        db.add(models.Subtarefa(tarefa_id=tarefa.id, titulo=str(titulo_sub)[:200], ordem=i))

    db.commit()
    db.refresh(tarefa)
    logger.info("template aplicado: template=%s tarefa=%s user=%s", template_id, tarefa.id, current_user.id)
    return {"tarefa": _tarefa_to_response(tarefa)}
