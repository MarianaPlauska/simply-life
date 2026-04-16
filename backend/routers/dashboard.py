"""
routers/dashboard.py — Painel de Controle e Agregação de Telemetria
RF-4.01: Endpoint de agregação GET /dashboard/resumo
RF-4.02: Motor de resumo contextual (saudacao_ia)
RNF-4.01: JWT obrigatório, performance otimizada
Cache: resultado por usuário com TTL de 30 s (evita recalcular em rafagas)
"""
from datetime import datetime, date
from time import monotonic
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

import database
import models
from auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# ── Cache simples por usuário ─────────────────────────────────
# dict[usuario_id, (timestamp_monotonic, DashboardResumo)]
_CACHE_TTL_SECONDS = 30
_dashboard_cache: dict[int, tuple[float, Any]] = {}


def _cache_get(uid: int) -> Any | None:
    entry = _dashboard_cache.get(uid)
    if entry and (monotonic() - entry[0]) < _CACHE_TTL_SECONDS:
        return entry[1]
    return None


def _cache_set(uid: int, value: Any) -> None:
    _dashboard_cache[uid] = (monotonic(), value)


# ── Pydantic Response ─────────────────────────────────────────

class HabitoResumo(BaseModel):
    id: int
    nome_exibicao: str
    progresso_atual: int
    meta_diaria: int
    unidade: str

class DashboardResumo(BaseModel):
    saudacao_ia: str
    tarefas_total: int
    tarefas_pendentes: int
    tarefas_criticas: int
    tarefas_concluidas: int
    despesas_dia: float
    despesas_mes: float
    receita_mes: float
    saldo_mes: float
    medicamentos_total: int
    medicamentos_tomados: int
    habitos: list[HabitoResumo]
    habitos_progresso_pct: float
    notificacoes_nao_lidas: int


# ── Helpers ───────────────────────────────────────────────────

SCORE_CRITICO = 100


def _saudacao(hora: int) -> str:
    if hora < 12:
        return "Bom dia"
    if hora < 18:
        return "Boa tarde"
    return "Boa noite"


def _gerar_saudacao_ia(
    nome: str,
    tarefas_criticas: int,
    despesas_dia: float,
    habitos_pct: float,
    meds_tomados: int,
    meds_total: int,
) -> str:
    """RF-4.02: Monta string contextual a partir dos dados agregados."""
    hora = datetime.now().hour
    partes = [f"{_saudacao(hora)}, {nome}."]

    if tarefas_criticas > 0:
        partes.append(
            f"{tarefas_criticas} tarefa{'s' if tarefas_criticas > 1 else ''} "
            f"critica{'s' if tarefas_criticas > 1 else ''} pendente{'s' if tarefas_criticas > 1 else ''}."
        )
    else:
        partes.append("Nenhuma tarefa critica no momento.")

    if despesas_dia > 0:
        partes.append(f"Gastos hoje: R$ {despesas_dia:,.2f}.")

    if habitos_pct >= 100:
        partes.append("Habitos diarios 100% concluidos!")
    elif habitos_pct > 0:
        partes.append(f"Habitos diarios em {habitos_pct:.0f}%.")

    if meds_total > 0:
        if meds_tomados == meds_total:
            partes.append("Todos os medicamentos tomados.")
        else:
            restam = meds_total - meds_tomados
            partes.append(f"{restam} medicamento{'s' if restam > 1 else ''} pendente{'s' if restam > 1 else ''}.")

    return " ".join(partes)


# ── Endpoint ──────────────────────────────────────────────────

@router.get("/resumo", response_model=DashboardResumo)
def resumo_dashboard(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    uid = current_user.id

    # ── Cache hit ─────────────────────────────────────────────
    cached = _cache_get(uid)
    if cached is not None:
        return cached

    hoje = date.today().isoformat()
    mes_prefix = hoje[:7]  # "YYYY-MM"
    nome = (current_user.nome_completo or current_user.email.split("@")[0]).split()[0]

    # ── Tarefas ───────────────────────────────────────────────
    tarefas = (
        db.query(models.TarefaUnificada)
        .filter(models.TarefaUnificada.usuario_id == uid)
        .all()
    )
    tarefas_total = len(tarefas)
    tarefas_concluidas = sum(1 for t in tarefas if t.status == "concluida")
    tarefas_pendentes = tarefas_total - tarefas_concluidas
    tarefas_criticas = sum(
        1 for t in tarefas
        if t.score_urgencia >= SCORE_CRITICO and t.status != "concluida"
    )

    # ── Despesas ──────────────────────────────────────────────
    despesas_dia = (
        db.query(func.coalesce(func.sum(models.Despesa.valor), 0))
        .filter(
            models.Despesa.usuario_id == uid,
            models.Despesa.data_gasto == hoje,
        )
        .scalar()
    ) or 0

    despesas_rows = (
        db.query(models.Despesa)
        .filter(
            models.Despesa.usuario_id == uid,
            models.Despesa.data_gasto.like(f"{mes_prefix}%"),
        )
        .all()
    )
    despesas_mes = sum(d.valor for d in despesas_rows)
    # Receitas são armazenadas como despesas com tipo implícito;
    # O frontend envia tipo mas o modelo não tem coluna tipo.
    # Receita = 0 por enquanto (modelo Despesa não tem campo tipo)
    receita_mes = 0.0
    saldo_mes = receita_mes - despesas_mes

    # ── Medicamentos ──────────────────────────────────────────
    meds = (
        db.query(models.Medicamento)
        .filter(models.Medicamento.usuario_id == uid)
        .all()
    )
    meds_total = len(meds)
    meds_tomados = sum(1 for m in meds if m.tomado_hoje)

    # ── Hábitos ───────────────────────────────────────────────
    habitos = (
        db.query(models.HabitoDiario)
        .filter(models.HabitoDiario.usuario_id == uid)
        .all()
    )
    habitos_resumo = [
        HabitoResumo(
            id=h.id,
            nome_exibicao=h.nome_exibicao,
            progresso_atual=h.progresso_atual,
            meta_diaria=h.meta_diaria,
            unidade=h.unidade,
        )
        for h in habitos
    ]
    habitos_pct = (
        (sum(min(h.progresso_atual / max(h.meta_diaria, 1), 1) for h in habitos) / len(habitos) * 100)
        if habitos
        else 0.0
    )

    # ── Notificações não lidas ────────────────────────────────
    notif_nao_lidas = (
        db.query(func.count(models.Notificacao.id))
        .filter(
            models.Notificacao.usuario_id == uid,
            models.Notificacao.lida == 0,
        )
        .scalar()
    ) or 0

    # ── Saudação IA ───────────────────────────────────────────
    saudacao = _gerar_saudacao_ia(
        nome=nome,
        tarefas_criticas=tarefas_criticas,
        despesas_dia=float(despesas_dia),
        habitos_pct=habitos_pct,
        meds_tomados=meds_tomados,
        meds_total=meds_total,
    )

    resultado = DashboardResumo(
        saudacao_ia=saudacao,
        tarefas_total=tarefas_total,
        tarefas_pendentes=tarefas_pendentes,
        tarefas_criticas=tarefas_criticas,
        tarefas_concluidas=tarefas_concluidas,
        despesas_dia=float(despesas_dia),
        despesas_mes=float(despesas_mes),
        receita_mes=receita_mes,
        saldo_mes=saldo_mes,
        medicamentos_total=meds_total,
        medicamentos_tomados=meds_tomados,
        habitos=habitos_resumo,
        habitos_progresso_pct=round(habitos_pct, 1),
        notificacoes_nao_lidas=notif_nao_lidas,
    )
    _cache_set(uid, resultado)
    return resultado