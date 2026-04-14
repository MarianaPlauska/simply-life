"""
routers/saude.py — Medicamentos, Hábitos Diários e Streaks
RF-1.04: Todas as queries filtram por usuario_id = current_user.id
Sprint 1: Registro automático em historico_habitos + endpoint de streaks
"""
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

import database
import models
from auth import get_current_user
from schemas import MedicamentoCreate, HabitoCreate, HabitoStreakResponse

router = APIRouter(tags=["Saúde"])


# ── Helpers ───────────────────────────────────────────────────

def _registrar_conclusao_habito(db: Session, usuario_id: int, habito_id: int):
    """Registra conclusão do hábito de hoje no historico_habitos (idempotente)."""
    hoje = date.today()
    existe = (
        db.query(models.HistoricoHabito)
        .filter(
            models.HistoricoHabito.habito_id == habito_id,
            models.HistoricoHabito.data == hoje,
        )
        .first()
    )
    if not existe:
        registro = models.HistoricoHabito(
            usuario_id=usuario_id,
            habito_id=habito_id,
            data=hoje,
            concluido=1,
        )
        db.add(registro)
        db.flush()


def _calcular_streak(db: Session, habito_id: int) -> int:
    """Calcula dias consecutivos de conclusão, contando de hoje para trás."""
    registros = (
        db.query(models.HistoricoHabito.data)
        .filter(
            models.HistoricoHabito.habito_id == habito_id,
            models.HistoricoHabito.concluido == 1,
        )
        .order_by(models.HistoricoHabito.data.desc())
        .all()
    )
    if not registros:
        return 0

    datas = [r.data for r in registros]
    hoje = date.today()

    # Se hoje não está nos registros, o streak começa em 0
    if datas[0] != hoje:
        return 0

    streak = 1
    for i in range(1, len(datas)):
        esperado = hoje - timedelta(days=i)
        if datas[i] == esperado:
            streak += 1
        else:
            break

    return streak


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

    # Sprint 1: registra no histórico quando meta é atingida
    if h.progresso_atual >= h.meta_diaria:
        _registrar_conclusao_habito(db, current_user.id, habito_id)

    db.commit()
    streak = _calcular_streak(db, habito_id)
    return {"progresso_atual": h.progresso_atual, "meta_diaria": h.meta_diaria, "streak": streak}


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


# ── Streaks de Hábitos (Sprint 1) ─────────────────────────────

@router.get("/habitos/streaks")
def listar_streaks(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Retorna o streak atual (dias consecutivos) para cada hábito do usuário."""
    habitos = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.usuario_id == current_user.id)
        .all()
    )
    result = []
    for h in habitos:
        streak = _calcular_streak(db, h.id)
        ultimo = (
            db.query(models.HistoricoHabito.data)
            .filter(models.HistoricoHabito.habito_id == h.id)
            .order_by(models.HistoricoHabito.data.desc())
            .first()
        )
        result.append(HabitoStreakResponse(
            habito_id=h.id,
            nome_exibicao=h.nome_exibicao,
            streak_dias=streak,
            ultima_data=str(ultimo.data) if ultimo else None,
        ).model_dump())
    return result
