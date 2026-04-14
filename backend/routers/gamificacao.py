"""
routers/gamificacao.py — Gamificação & XP do Focus Mode.
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import database
import models
from auth import get_current_user

router = APIRouter(prefix="/gamificacao", tags=["gamificacao"])


class CompletarSessaoRequest(BaseModel):
    minutos: int = Field(..., gt=0, le=240, description="Duração da sessão em minutos")
    tarefa_id: int | None = Field(None, description="ID da tarefa associada (opcional)")


class GamificacaoResponse(BaseModel):
    xp_ganho: int
    xp_total: int
    streak_days: int
    streak_bonus: bool


@router.post("/completar-sessao", response_model=GamificacaoResponse, status_code=200)
def completar_sessao(
    dados: CompletarSessaoRequest,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    # XP: 10 por cada 25 minutos completos
    blocos = dados.minutos // 25
    if blocos < 1:
        raise HTTPException(status_code=400, detail="Sessão muito curta para ganhar XP (mínimo 25min)")

    xp_base = blocos * 10
    hoje = date.today().isoformat()

    # Streak
    streak_bonus = False
    ultima = usuario.ultima_sessao_foco
    streak = usuario.streak_days or 0

    if ultima != hoje:
       
        ontem = (date.today() - timedelta(days=1)).isoformat()
        if ultima == ontem:
            streak += 1
            streak_bonus = True
        else:
            streak = 1

    multiplicador = 1 + (streak // 7) * 0.1
    xp_ganho = int(xp_base * multiplicador)

    usuario.xp = (usuario.xp or 0) + xp_ganho
    usuario.streak_days = streak
    usuario.ultima_sessao_foco = hoje
    db.commit()
    db.refresh(usuario)

    return GamificacaoResponse(
        xp_ganho=xp_ganho,
        xp_total=usuario.xp,
        streak_days=usuario.streak_days,
        streak_bonus=streak_bonus,
    )


@router.get("/perfil", status_code=200)
def perfil_gamificacao(
    usuario: models.Usuario = Depends(get_current_user),
):
    return {
        "xp": usuario.xp or 0,
        "streak_days": usuario.streak_days or 0,
        "ultima_sessao_foco": usuario.ultima_sessao_foco,
        "nivel": (usuario.xp or 0) // 100,
    }
