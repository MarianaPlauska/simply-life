"""
routers/relatorios.py — Relatórios de Produtividade (estilo Last.fm)

Endpoints:
  GET /relatorios/semanal — relatório da semana atual vs anterior
  GET /relatorios/mensal  — relatório do mês atual vs anterior
  GET /relatorios/resumo  — card resumido para o dashboard home
"""
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

import database
import models
from auth import get_current_user
from logic.analytics_engine import (
    gerar_relatorio_semanal,
    gerar_relatorio_mensal,
    TrendPoint,
    RankingItem,
    PeriodStats,
)

router = APIRouter(prefix="/relatorios", tags=["Relatorios"])


# ── Pydantic Response Models ─────────────────────────────────

class TrendPointResponse(BaseModel):
    label: str
    valor: float


class RankingItemResponse(BaseModel):
    nome: str
    valor: float
    posicao: int
    cor: str = "#8b5cf6"


class PeriodStatsResponse(BaseModel):
    periodo_label: str
    inicio: str
    fim: str
    tarefas_criadas: int
    tarefas_concluidas: int
    tarefas_pendentes: int
    taxa_conclusao_pct: float
    sessoes_foco: int
    minutos_foco_total: int
    xp_ganho: int
    media_minutos_por_sessao: float
    habitos_completados: int
    habitos_total_registros: int
    habitos_taxa_pct: float
    humor_medio: float
    registros_humor: int
    despesas_total: float
    despesas_count: int
    streak_atual: int
    score_eficiencia: int
    tarefas_por_dia: dict[str, int]
    foco_por_dia: dict[str, int]


class AnalyticsReportResponse(BaseModel):
    periodo_atual: PeriodStatsResponse
    periodo_anterior: Optional[PeriodStatsResponse] = None
    variacao_pct: dict[str, float]
    tendencia_tarefas: list[TrendPointResponse]
    tendencia_foco: list[TrendPointResponse]
    tendencia_score: list[TrendPointResponse]
    ranking_dias_semana: list[RankingItemResponse]
    top_categorias_tarefa: list[RankingItemResponse]
    total_tarefas_concluidas: int
    total_minutos_foco: int
    total_xp: int
    membro_desde: str


class DashboardReportCardResponse(BaseModel):
    """Versão resumida para o card no dashboard."""
    score_semana: int
    score_mes: int
    variacao_score_semana: float
    tarefas_concluidas_semana: int
    minutos_foco_semana: int
    xp_semana: int
    streak_atual: int
    tendencia_score: list[TrendPointResponse]
    top_dia: Optional[RankingItemResponse] = None


# ── Helpers ───────────────────────────────────────────────────

def _period_to_response(stats: PeriodStats) -> PeriodStatsResponse:
    return PeriodStatsResponse(
        periodo_label=stats.periodo_label,
        inicio=stats.inicio,
        fim=stats.fim,
        tarefas_criadas=stats.tarefas_criadas,
        tarefas_concluidas=stats.tarefas_concluidas,
        tarefas_pendentes=stats.tarefas_pendentes,
        taxa_conclusao_pct=stats.taxa_conclusao_pct,
        sessoes_foco=stats.sessoes_foco,
        minutos_foco_total=stats.minutos_foco_total,
        xp_ganho=stats.xp_ganho,
        media_minutos_por_sessao=stats.media_minutos_por_sessao,
        habitos_completados=stats.habitos_completados,
        habitos_total_registros=stats.habitos_total_registros,
        habitos_taxa_pct=stats.habitos_taxa_pct,
        humor_medio=stats.humor_medio,
        registros_humor=stats.registros_humor,
        despesas_total=stats.despesas_total,
        despesas_count=stats.despesas_count,
        streak_atual=stats.streak_atual,
        score_eficiencia=stats.score_eficiencia,
        tarefas_por_dia=stats.tarefas_por_dia,
        foco_por_dia=stats.foco_por_dia,
    )


def _report_to_response(report) -> AnalyticsReportResponse:
    return AnalyticsReportResponse(
        periodo_atual=_period_to_response(report.periodo_atual),
        periodo_anterior=_period_to_response(report.periodo_anterior) if report.periodo_anterior else None,
        variacao_pct=report.variacao_pct,
        tendencia_tarefas=[TrendPointResponse(label=t.label, valor=t.valor) for t in report.tendencia_tarefas],
        tendencia_foco=[TrendPointResponse(label=t.label, valor=t.valor) for t in report.tendencia_foco],
        tendencia_score=[TrendPointResponse(label=t.label, valor=t.valor) for t in report.tendencia_score],
        ranking_dias_semana=[
            RankingItemResponse(nome=r.nome, valor=r.valor, posicao=r.posicao, cor=r.cor)
            for r in report.ranking_dias_semana
        ],
        top_categorias_tarefa=[
            RankingItemResponse(nome=r.nome, valor=r.valor, posicao=r.posicao, cor=r.cor)
            for r in report.top_categorias_tarefa
        ],
        total_tarefas_concluidas=report.total_tarefas_concluidas,
        total_minutos_foco=report.total_minutos_foco,
        total_xp=report.total_xp,
        membro_desde=report.membro_desde,
    )


# ── Endpoints ─────────────────────────────────────────────────

@router.get("/semanal", response_model=AnalyticsReportResponse)
def relatorio_semanal(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Relatório completo da semana atual com comparação à anterior."""
    report = gerar_relatorio_semanal(db, current_user.id, current_user.streak_atual or 0)
    report.total_xp = current_user.xp_total or 0
    report.membro_desde = current_user.criado_em or ""
    return _report_to_response(report)


@router.get("/mensal", response_model=AnalyticsReportResponse)
def relatorio_mensal(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Relatório completo do mês atual com comparação ao anterior."""
    report = gerar_relatorio_mensal(db, current_user.id, current_user.streak_atual or 0)
    report.total_xp = current_user.xp_total or 0
    report.membro_desde = current_user.criado_em or ""
    return _report_to_response(report)


@router.get("/resumo", response_model=DashboardReportCardResponse)
def resumo_relatorio(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Card resumido para exibir no dashboard principal."""
    uid = current_user.id
    streak = current_user.streak_atual or 0

    report_sem = gerar_relatorio_semanal(db, uid, streak)
    report_mes = gerar_relatorio_mensal(db, uid, streak)

    top_dia = None
    if report_sem.ranking_dias_semana:
        r = report_sem.ranking_dias_semana[0]
        top_dia = RankingItemResponse(nome=r.nome, valor=r.valor, posicao=r.posicao, cor=r.cor)

    return DashboardReportCardResponse(
        score_semana=report_sem.periodo_atual.score_eficiencia,
        score_mes=report_mes.periodo_atual.score_eficiencia,
        variacao_score_semana=report_sem.variacao_pct.get("score_eficiencia", 0),
        tarefas_concluidas_semana=report_sem.periodo_atual.tarefas_concluidas,
        minutos_foco_semana=report_sem.periodo_atual.minutos_foco_total,
        xp_semana=report_sem.periodo_atual.xp_ganho,
        streak_atual=streak,
        tendencia_score=[
            TrendPointResponse(label=t.label, valor=t.valor)
            for t in report_sem.tendencia_score
        ],
        top_dia=top_dia,
    )
