"""
routers/labels.py — Labels, Subtarefas e associações Label↔Tarefa.

Separado de tarefas.py para manter routers focados e abaixo de ~300 linhas.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from routers.tarefas_helpers import _get_tarefa_or_404
from schemas import (
    LabelCreate,
    LabelResponse,
    SubtarefaCreate,
    SubtarefaResponse,
    SubtarefaUpdate,
)

router = APIRouter(tags=["Labels & Subtarefas"])


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
    existe = (
        db.query(models.Label)
        .filter(
            models.Label.usuario_id == current_user.id,
            models.Label.nome == dados.nome,
        )
        .first()
    )
    if existe:
        raise HTTPException(status_code=409, detail=f"Label '{dados.nome}' já existe.")

    nova = models.Label(usuario_id=current_user.id, nome=dados.nome, cor=dados.cor)
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
    nova = models.Subtarefa(tarefa_id=tarefa.id, titulo=dados.titulo, ordem=dados.ordem)
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return SubtarefaResponse(
        id=nova.id, titulo=nova.titulo, concluida=bool(nova.concluida), ordem=nova.ordem
    ).model_dump()


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
        .filter(
            models.TarefaUnificada.id == sub.tarefa_id,
            models.TarefaUnificada.usuario_id == current_user.id,
        )
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
    return SubtarefaResponse(
        id=sub.id, titulo=sub.titulo, concluida=bool(sub.concluida), ordem=sub.ordem
    ).model_dump()


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
        .filter(
            models.TarefaUnificada.id == sub.tarefa_id,
            models.TarefaUnificada.usuario_id == current_user.id,
        )
        .first()
    )
    if not tarefa:
        raise HTTPException(status_code=404, detail="Subtarefa não encontrada")

    db.delete(sub)
    db.commit()
    return {"status": "sucesso", "id": subtarefa_id}


# ── Associações Label ↔ Tarefa ────────────────────────────────

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

    existe = (
        db.query(models.TarefaLabel)
        .filter(
            models.TarefaLabel.tarefa_id == tarefa.id,
            models.TarefaLabel.label_id == label.id,
        )
        .first()
    )
    if existe:
        return {"status": "já associada"}

    db.add(models.TarefaLabel(tarefa_id=tarefa.id, label_id=label.id))
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
        .filter(
            models.TarefaLabel.tarefa_id == tarefa.id,
            models.TarefaLabel.label_id == label_id,
        )
        .first()
    )
    if not assoc:
        raise HTTPException(status_code=404, detail="Label não associada a esta tarefa")
    db.delete(assoc)
    db.commit()
    return {"status": "sucesso"}
