"""
routers/bem_estar.py — módulo de bem-estar mental.

responsabilidades:
  - crud de humor (mood tracker, 1 registro/dia)
  - crud de journaling (entradas de diário)
  - weekly review automática (cruza humor + hábitos + foco + finanças)
  - correlação ia (humor vs hábitos, sem api externa)

lógica de negócio extraída para:
  - logic/prompts_journaling.py
  - logic/bem_estar_insights.py
"""
from datetime import date, timedelta, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

import database
import models
import schemas
from auth import get_current_user
from logic.prompts_journaling import prompt_do_dia
from logic.bem_estar_insights import gerar_insight, calcular_correlacao

router = APIRouter(prefix="/bem-estar", tags=["bem-estar"])


def _hoje () -> date:
    return datetime.now(timezone.utc).date()


# ── humor ─────────────────────────────────────────────────────

@router.post("/humor", status_code=201)
def registrar_humor (
    body: schemas.HumorCreate,
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """registra ou atualiza o humor do dia (upsert)"""
    if body.humor < 1 or body.humor > 5:
        raise HTTPException(400, "humor deve ser entre 1 e 5")

    hoje = _hoje()
    existente = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data == hoje,
    ).first()

    if existente:
        existente.humor = body.humor
        existente.emoji = body.emoji or existente.emoji
        existente.nota = body.nota or existente.nota
        db.commit()
        db.refresh(existente)
        return {"id": existente.id, "data": str(existente.data), "humor": existente.humor, "emoji": existente.emoji, "nota": existente.nota}

    novo = models.DiarioHumor(
        usuario_id=user.id,
        data=hoje,
        humor=body.humor,
        emoji=body.emoji,
        nota=body.nota,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return {"id": novo.id, "data": str(novo.data), "humor": novo.humor, "emoji": novo.emoji, "nota": novo.nota}


@router.get("/humor/hoje")
def humor_hoje (
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """retorna o humor de hoje, ou null"""
    reg = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data == _hoje(),
    ).first()
    if not reg:
        return None
    return {"id": reg.id, "data": str(reg.data), "humor": reg.humor, "emoji": reg.emoji, "nota": reg.nota}


@router.get("/humor/semana")
def humor_semana (
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """últimos 7 dias de humor"""
    inicio = _hoje() - timedelta(days=6)
    regs = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data >= inicio,
    ).order_by(models.DiarioHumor.data.asc()).all()
    return [{"id": r.id, "data": str(r.data), "humor": r.humor, "emoji": r.emoji, "nota": r.nota} for r in regs]


@router.get("/humor/historico")
def humor_historico (
    dias: int = Query(default=30, le=365),
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """histórico de humor por n dias — usado pelo year-in-pixels"""
    inicio = _hoje() - timedelta(days=dias)
    regs = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data >= inicio,
    ).order_by(models.DiarioHumor.data.asc()).all()
    return [{"id": r.id, "data": str(r.data), "humor": r.humor, "emoji": r.emoji, "nota": r.nota} for r in regs]


# ── journaling ────────────────────────────────────────────────

@router.get("/prompt-do-dia")
def get_prompt_do_dia ():
    """retorna o prompt de journaling do dia"""
    return {"prompt": prompt_do_dia()}


@router.post("/diario", status_code=201)
def criar_entrada (
    body: schemas.EntradaDiarioCreate,
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """cria uma entrada de diário para hoje"""
    entrada = models.EntradaDiario(
        usuario_id=user.id,
        data=_hoje(),
        conteudo=body.conteudo,
        prompt_usado=body.prompt_usado or None,
    )
    db.add(entrada)
    db.commit()
    db.refresh(entrada)
    return {"id": entrada.id, "data": str(entrada.data), "conteudo": entrada.conteudo, "prompt_usado": entrada.prompt_usado}


@router.get("/diario/hoje")
def diario_hoje (
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """retorna a última entrada de hoje"""
    entrada = db.query(models.EntradaDiario).filter(
        models.EntradaDiario.usuario_id == user.id,
        models.EntradaDiario.data == _hoje(),
    ).order_by(models.EntradaDiario.created_at.desc()).first()
    if not entrada:
        return None
    return {"id": entrada.id, "data": str(entrada.data), "conteudo": entrada.conteudo, "prompt_usado": entrada.prompt_usado}


@router.get("/diario")
def listar_entradas (
    dias: int = Query(default=7, le=365),
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """lista entradas recentes"""
    inicio = _hoje() - timedelta(days=dias)
    entradas = db.query(models.EntradaDiario).filter(
        models.EntradaDiario.usuario_id == user.id,
        models.EntradaDiario.data >= inicio,
    ).order_by(models.EntradaDiario.data.desc()).all()
    return [{"id": e.id, "data": str(e.data), "conteudo": e.conteudo, "prompt_usado": e.prompt_usado} for e in entradas]


@router.delete("/diario/{entrada_id}", status_code=204)
def deletar_entrada (
    entrada_id: int,
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    entrada = db.query(models.EntradaDiario).filter(
        models.EntradaDiario.id == entrada_id,
        models.EntradaDiario.usuario_id == user.id,
    ).first()
    if not entrada:
        raise HTTPException(404, "entrada não encontrada")
    db.delete(entrada)
    db.commit()


# ── weekly review ─────────────────────────────────────────────

@router.get("/weekly-review")
def weekly_review (
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """gera a review semanal cruzando humor + tarefas + hábitos + foco + finanças"""
    hoje = _hoje()
    inicio = hoje - timedelta(days=6)

    humor_data = db.query(
        func.avg(models.DiarioHumor.humor),
        func.count(models.DiarioHumor.id),
    ).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data.between(inicio, hoje),
    ).first()
    humor_medio = round(float(humor_data[0] or 0), 1)
    registros_humor = humor_data[1] or 0

    tarefas_criadas = db.query(func.count(models.TarefaUnificada.id)).filter(
        models.TarefaUnificada.usuario_id == user.id,
        func.date(models.TarefaUnificada.created_at) >= inicio,
    ).scalar() or 0

    tarefas_concluidas = db.query(func.count(models.TarefaUnificada.id)).filter(
        models.TarefaUnificada.usuario_id == user.id,
        models.TarefaUnificada.status == "concluida",
        func.date(models.TarefaUnificada.created_at) >= inicio,
    ).scalar() or 0

    habitos_total = db.query(func.count(models.HistoricoHabito.id)).filter(
        models.HistoricoHabito.usuario_id == user.id,
        models.HistoricoHabito.data.between(inicio, hoje),
    ).scalar() or 0

    habitos_concluidos = db.query(func.count(models.HistoricoHabito.id)).filter(
        models.HistoricoHabito.usuario_id == user.id,
        models.HistoricoHabito.data.between(inicio, hoje),
        models.HistoricoHabito.concluido == 1,
    ).scalar() or 0

    habitos_pct = round((habitos_concluidos / habitos_total * 100) if habitos_total > 0 else 0, 1)

    despesas_total = db.query(func.sum(models.Despesa.valor)).filter(
        models.Despesa.usuario_id == user.id,
        models.Despesa.data_gasto >= str(inicio),
        models.Despesa.data_gasto <= str(hoje),
    ).scalar() or 0

    foco_min = db.query(func.sum(models.SessaoFoco.duracao_minutos)).filter(
        models.SessaoFoco.user_id == user.id,
        func.date(models.SessaoFoco.created_at) >= inicio,
    ).scalar() or 0

    insight = gerar_insight(humor_medio, registros_humor, tarefas_concluidas, tarefas_criadas, habitos_pct, foco_min, float(despesas_total))

    return {
        "semana": f"{inicio.isoformat()} a {hoje.isoformat()}",
        "humor_medio": humor_medio,
        "registros_humor": registros_humor,
        "tarefas_concluidas": tarefas_concluidas,
        "tarefas_criadas": tarefas_criadas,
        "habitos_pct": habitos_pct,
        "despesas_total": float(despesas_total),
        "foco_minutos": foco_min,
        "insight_ia": insight,
    }


# ── correlação humor vs hábitos ───────────────────────────────

@router.get("/correlacao")
def correlacao_humor_habitos (
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """delega o cálculo para logic/bem_estar_insights.py"""
    inicio = _hoje() - timedelta(days=30)

    humores = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data >= inicio,
    ).all()
    humor_por_dia = {h.data: h.humor for h in humores}

    historicos = db.query(
        models.HistoricoHabito.data,
        models.HabitoDiario.nome_exibicao,
    ).join(
        models.HabitoDiario,
        models.HistoricoHabito.habito_id == models.HabitoDiario.id,
    ).filter(
        models.HistoricoHabito.usuario_id == user.id,
        models.HistoricoHabito.data >= inicio,
        models.HistoricoHabito.concluido == 1,
    ).all()

    sessoes = db.query(
        func.date(models.SessaoFoco.created_at).label("dia"),
        func.sum(models.SessaoFoco.duracao_minutos).label("total"),
    ).filter(
        models.SessaoFoco.user_id == user.id,
        func.date(models.SessaoFoco.created_at) >= inicio,
    ).group_by(func.date(models.SessaoFoco.created_at)).all()

    return calcular_correlacao(humor_por_dia, list(historicos), list(sessoes))
