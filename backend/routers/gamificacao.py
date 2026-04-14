"""
routers/gamificacao.py — Gamificação & XP do Focus Mode.
Persiste sessões de foco no banco e atualiza XP/streak do usuário.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/gamificacao", tags=["gamificacao"])


def _calcular_xp(minutos: int) -> int:
    """XP = minutos * 10."""
    return minutos * 10


def _atualizar_streak(usuario: models.Usuario, agora: datetime) -> tuple[int, bool]:
    """
    Atualiza o streak_atual do usuário.
    - Se última sessão foi ontem: streak + 1 (bonus)
    - Se última sessão foi hoje: mantém streak
    - Se > 24h: reseta para 1
    Retorna (novo_streak, streak_bonus).
    """
    ultima = usuario.ultima_sessao_data
    streak = usuario.streak_atual or 0
    streak_bonus = False

    if ultima is None:
        return 1, False

    # Garante timezone-aware comparison
    if ultima.tzinfo is None:
        ultima = ultima.replace(tzinfo=timezone.utc)

    diff = agora - ultima

    if diff < timedelta(hours=24) and ultima.date() == agora.date():
        # Mesma data: mantém streak
        return streak, False
    elif diff < timedelta(hours=48) and ultima.date() == (agora - timedelta(days=1)).date():
        # Ontem: incrementa streak
        return streak + 1, True
    else:
        # Mais de 24h: reseta
        return 1, False


@router.post("/finalizar-sessao", response_model=schemas.GamificacaoProfileResponse, status_code=200)
def finalizar_sessao(
    dados: schemas.FinalizarSessaoRequest,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Finaliza uma sessão de foco:
    1. Calcula XP (minutos * 10)
    2. Atualiza streak_atual
    3. Persiste SessaoFoco no banco
    4. Atualiza xp_total e streak_atual do usuário
    """
    if dados.minutos <= 0:
        raise HTTPException(status_code=400, detail="Duração deve ser positiva.")

    agora = datetime.now(timezone.utc)

    # Calcula XP
    xp_base = _calcular_xp(dados.minutos)

    # Atualiza streak
    novo_streak, streak_bonus = _atualizar_streak(usuario, agora)

    # Multiplicador de streak: +10% a cada 7 dias consecutivos
    multiplicador = 1 + (novo_streak // 7) * 0.1
    xp_ganho = int(xp_base * multiplicador)

    # Persiste SessaoFoco
    sessao = models.SessaoFoco(
        user_id=usuario.id,
        tarefa_id=dados.tarefa_id,
        duracao_minutos=dados.minutos,
        xp_ganho=xp_ganho,
        created_at=agora,
    )
    db.add(sessao)

    # Atualiza usuário (campos novos)
    usuario.xp_total = (usuario.xp_total or 0) + xp_ganho
    usuario.streak_atual = novo_streak
    usuario.ultima_sessao_data = agora
    # Mantém campos antigos sincronizados (backward compat)
    usuario.xp = usuario.xp_total
    usuario.streak_days = usuario.streak_atual
    usuario.ultima_sessao_foco = agora.date().isoformat()

    db.commit()
    db.refresh(usuario)
    db.refresh(sessao)

    return schemas.GamificacaoProfileResponse(
        xp_total=usuario.xp_total,
        streak_atual=usuario.streak_atual,
        nivel=(usuario.xp_total or 0) // 100,
        ultima_sessao_data=usuario.ultima_sessao_data,
        xp_ganho=xp_ganho,
        streak_bonus=streak_bonus,
    )


# Manter a rota antiga para backward compatibility
@router.post("/completar-sessao", response_model=schemas.GamificacaoProfileResponse, status_code=200)
def completar_sessao(
    dados: schemas.FinalizarSessaoRequest,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Alias para finalizar-sessao (backward compat)."""
    return finalizar_sessao(dados, usuario, db)


@router.get("/perfil", status_code=200)
def perfil_gamificacao(
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    # Sprint 1: calcular maior streak de hábitos
    from routers.saude import _calcular_streak
    habitos = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.usuario_id == usuario.id)
        .all()
    )
    max_habito_streak = max((_calcular_streak(db, h.id) for h in habitos), default=0)

    return {
        "xp": usuario.xp_total or usuario.xp or 0,
        "xp_total": usuario.xp_total or usuario.xp or 0,
        "streak_days": usuario.streak_atual or usuario.streak_days or 0,
        "streak_atual": usuario.streak_atual or usuario.streak_days or 0,
        "ultima_sessao_foco": usuario.ultima_sessao_foco,
        "ultima_sessao_data": usuario.ultima_sessao_data.isoformat() if usuario.ultima_sessao_data else None,
        "nivel": (usuario.xp_total or usuario.xp or 0) // 100,
        "habitos_streak": max_habito_streak,
    }
