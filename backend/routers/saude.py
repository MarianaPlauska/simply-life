"""
routers/saude.py — Medicamentos e Hábitos Diários
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user
from schemas import MedicamentoCreate, HabitoCreate

router = APIRouter(tags=["Saúde"])


# ── Medicamentos ──────────────────────────────────────────────

@router.get("/medicamentos")
def listar_medicamentos(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    meds = (
        db.query(models.Medicamento)
        .filter(models.Medicamento.usuario_id == current_user.id)
        .all()
    )
    return {"medicamentos": [
        {"id": m.id, "nome": m.nome, "horario": m.horario, "tomado": bool(m.tomado_hoje)}
        for m in meds
    ]}


@router.patch("/medicamentos/{med_id}/toggle")
def toggle_medicamento(
    med_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    med = (
        db.query(models.Medicamento)
        .filter(models.Medicamento.id == med_id, models.Medicamento.usuario_id == current_user.id)
        .first()
    )
    if not med:
        return JSONResponse(status_code=404, content={"erro": "Medicamento não encontrado"})
    med.tomado_hoje = 0 if med.tomado_hoje else 1
    db.commit()
    return {"status": "sucesso", "tomado": bool(med.tomado_hoje)}


@router.post("/medicamentos")
def criar_medicamento(
    dados: MedicamentoCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    novo = models.Medicamento(
        usuario_id=current_user.id,
        nome=dados.nome,
        horario=dados.horario,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return {"medicamento": {"id": novo.id, "nome": novo.nome, "horario": novo.horario, "tomado": False}}


# ── Hábitos ───────────────────────────────────────────────────

@router.get("/habitos")
def listar_habitos(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    habitos = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.usuario_id == current_user.id)
        .all()
    )
    return {"habitos": [{
        "id": h.id, "tipo": h.tipo, "nome_exibicao": h.nome_exibicao,
        "meta_diaria": h.meta_diaria, "progresso_atual": h.progresso_atual, "unidade": h.unidade,
    } for h in habitos]}


@router.post("/habitos")
def criar_habito(
    dados: HabitoCreate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    novo = models.HabitoDiario(
        usuario_id=current_user.id,
        tipo=dados.tipo,
        nome_exibicao=dados.nome_exibicao,
        meta_diaria=dados.meta_diaria,
        unidade=dados.unidade,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return {"habito": {
        "id": novo.id, "tipo": novo.tipo, "nome_exibicao": novo.nome_exibicao,
        "meta_diaria": novo.meta_diaria, "progresso_atual": novo.progresso_atual, "unidade": novo.unidade,
    }}


@router.patch("/habitos/{habito_id}/incrementar")
def incrementar_habito(
    habito_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    h = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.id == habito_id, models.HabitoDiario.usuario_id == current_user.id)
        .first()
    )
    if not h:
        return JSONResponse(status_code=404, content={"erro": "Hábito não encontrado"})
    h.progresso_atual = min(h.progresso_atual + 1, h.meta_diaria)
    db.commit()
    return {"progresso_atual": h.progresso_atual, "meta_diaria": h.meta_diaria}


@router.patch("/habitos/{habito_id}/decrementar")
def decrementar_habito(
    habito_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    h = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.id == habito_id, models.HabitoDiario.usuario_id == current_user.id)
        .first()
    )
    if not h:
        return JSONResponse(status_code=404, content={"erro": "Hábito não encontrado"})
    h.progresso_atual = max(h.progresso_atual - 1, 0)
    db.commit()
    return {"progresso_atual": h.progresso_atual, "meta_diaria": h.meta_diaria}


@router.delete("/habitos/{habito_id}")
def deletar_habito(
    habito_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    h = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.id == habito_id, models.HabitoDiario.usuario_id == current_user.id)
        .first()
    )
    if not h:
        return JSONResponse(status_code=404, content={"erro": "Hábito não encontrado"})
    db.delete(h)
    db.commit()
    return {"status": "sucesso"}
