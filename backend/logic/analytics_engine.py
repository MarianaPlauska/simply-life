"""
logic/analytics_engine.py — Motor de Relatórios & Rankings (estilo Last.fm)

Computa estatísticas de produtividade do usuário por períodos:
  • Semana atual / anterior
  • Mês atual / anterior
  • All-time

Tudo calculado server-side em Python puro — zero custo de IA.
Inspirado no Last.fm: scrobbles → tarefas concluídas, listening time → minutos de foco.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, and_, extract, case
from sqlalchemy.orm import Session

import models


# ── Data classes para os relatórios ──────────────────────────

@dataclass
class PeriodStats:
    """Estatísticas de um período (semana, mês, etc.)."""
    periodo_label: str
    inicio: str
    fim: str

    # Tarefas
    tarefas_criadas: int = 0
    tarefas_concluidas: int = 0
    tarefas_pendentes: int = 0
    taxa_conclusao_pct: float = 0.0

    # Foco
    sessoes_foco: int = 0
    minutos_foco_total: int = 0
    xp_ganho: int = 0
    media_minutos_por_sessao: float = 0.0

    # Hábitos
    habitos_completados: int = 0
    habitos_total_registros: int = 0
    habitos_taxa_pct: float = 0.0

    # Humor
    humor_medio: float = 0.0
    registros_humor: int = 0

    # Finanças
    despesas_total: float = 0.0
    despesas_count: int = 0

    # Streak
    streak_atual: int = 0
    melhor_streak: int = 0

    # Score composto (0-100) — "Efficiency Score"
    score_eficiencia: int = 0

    # Distribuição por dia da semana (0=seg, 6=dom)
    tarefas_por_dia: dict[str, int] = field(default_factory=dict)
    foco_por_dia: dict[str, int] = field(default_factory=dict)


@dataclass
class TrendPoint:
    """Um ponto no gráfico de tendência (semana ou dia)."""
    label: str
    valor: float


@dataclass
class RankingItem:
    """Item de ranking (top categorias, top dias, etc.)."""
    nome: str
    valor: float
    posicao: int
    cor: str = "#8b5cf6"


@dataclass
class AnalyticsReport:
    """Relatório completo para o frontend."""
    periodo_atual: PeriodStats
    periodo_anterior: PeriodStats | None = None
    variacao_pct: dict[str, float] = field(default_factory=dict)

    # Tendências (últimas 8 semanas ou 30 dias)
    tendencia_tarefas: list[TrendPoint] = field(default_factory=list)
    tendencia_foco: list[TrendPoint] = field(default_factory=list)
    tendencia_score: list[TrendPoint] = field(default_factory=list)

    # Rankings
    ranking_dias_semana: list[RankingItem] = field(default_factory=list)
    top_categorias_tarefa: list[RankingItem] = field(default_factory=list)

    # All-time stats
    total_tarefas_concluidas: int = 0
    total_minutos_foco: int = 0
    total_xp: int = 0
    membro_desde: str = ""


# ── Helpers ──────────────────────────────────────────────────

DIAS_SEMANA = {
    0: "Seg", 1: "Ter", 2: "Qua", 3: "Qui",
    4: "Sex", 5: "Sab", 6: "Dom",
}

CORES_RANKING = ["#10b981", "#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]


def _inicio_semana(d: date) -> date:
    """Retorna a segunda-feira da semana de `d`."""
    return d - timedelta(days=d.weekday())


def _fim_semana(d: date) -> date:
    """Retorna o domingo da semana de `d`."""
    return d + timedelta(days=6 - d.weekday())


def _inicio_mes(d: date) -> date:
    return d.replace(day=1)


def _fim_mes(d: date) -> date:
    if d.month == 12:
        return d.replace(year=d.year + 1, month=1, day=1) - timedelta(days=1)
    return d.replace(month=d.month + 1, day=1) - timedelta(days=1)


def _calcular_score_eficiencia(stats: PeriodStats) -> int:
    """
    Score composto 0-100:
      40% — taxa de conclusão de tarefas
      30% — minutos de foco (normalizado, 300min/semana = 100%)
      15% — hábitos
      15% — humor (normalizado 1-5 → 0-100)
    """
    task_score = min(stats.taxa_conclusao_pct, 100)
    foco_norm = min(stats.minutos_foco_total / 300 * 100, 100) if stats.minutos_foco_total else 0
    habito_score = min(stats.habitos_taxa_pct, 100)
    humor_score = ((stats.humor_medio - 1) / 4 * 100) if stats.registros_humor > 0 else 50

    score = (
        task_score * 0.40
        + foco_norm * 0.30
        + habito_score * 0.15
        + humor_score * 0.15
    )
    return max(0, min(100, round(score)))


def _variacao(atual: float, anterior: float) -> float:
    """Calcula variação percentual."""
    if anterior == 0:
        return 100.0 if atual > 0 else 0.0
    return round((atual - anterior) / anterior * 100, 1)


# ── Queries por período ──────────────────────────────────────

def _stats_periodo(
    db: Session,
    uid: int,
    inicio: date,
    fim: date,
    label: str,
    streak_atual: int = 0,
) -> PeriodStats:
    """Computa todas as métricas de um período."""
    inicio_dt = datetime.combine(inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
    fim_dt = datetime.combine(fim, datetime.max.time()).replace(tzinfo=timezone.utc)

    # — Tarefas —
    tarefas_criadas = (
        db.query(func.count(models.TarefaUnificada.id))
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.created_at >= inicio_dt,
            models.TarefaUnificada.created_at <= fim_dt,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .scalar()
    ) or 0

    tarefas_concluidas = (
        db.query(func.count(models.TarefaUnificada.id))
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.status == "concluida",
            models.TarefaUnificada.created_at >= inicio_dt,
            models.TarefaUnificada.created_at <= fim_dt,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .scalar()
    ) or 0

    # — Sessões de foco —
    foco_agg = (
        db.query(
            func.count(models.SessaoFoco.id),
            func.coalesce(func.sum(models.SessaoFoco.duracao_minutos), 0),
            func.coalesce(func.sum(models.SessaoFoco.xp_ganho), 0),
        )
        .filter(
            models.SessaoFoco.user_id == uid,
            models.SessaoFoco.created_at >= inicio_dt,
            models.SessaoFoco.created_at <= fim_dt,
        )
        .one()
    )
    sessoes_foco = foco_agg[0] or 0
    minutos_foco = int(foco_agg[1])
    xp_ganho = int(foco_agg[2])

    # — Hábitos —
    habitos_completados = (
        db.query(func.count(models.HistoricoHabito.id))
        .filter(
            models.HistoricoHabito.usuario_id == uid,
            models.HistoricoHabito.data >= inicio,
            models.HistoricoHabito.data <= fim,
            models.HistoricoHabito.concluido == 1,
        )
        .scalar()
    ) or 0

    habitos_total = (
        db.query(func.count(models.HabitoDiario.id))
        .filter(models.HabitoDiario.usuario_id == uid)
        .scalar()
    ) or 0

    dias_periodo = (fim - inicio).days + 1
    habitos_possiveis = habitos_total * dias_periodo

    # — Humor —
    humor_agg = (
        db.query(
            func.avg(models.DiarioHumor.humor),
            func.count(models.DiarioHumor.id),
        )
        .filter(
            models.DiarioHumor.usuario_id == uid,
            models.DiarioHumor.data >= inicio,
            models.DiarioHumor.data <= fim,
        )
        .one()
    )
    humor_medio = round(float(humor_agg[0] or 0), 1)
    registros_humor = humor_agg[1] or 0

    # — Finanças (despesas) —
    # despesas usam campo data_gasto como string "YYYY-MM-DD"
    despesas_agg = (
        db.query(
            func.coalesce(func.sum(models.Despesa.valor), 0),
            func.count(models.Despesa.id),
        )
        .filter(
            models.Despesa.usuario_id == uid,
            models.Despesa.data_gasto >= inicio.isoformat(),
            models.Despesa.data_gasto <= fim.isoformat(),
        )
        .one()
    )
    despesas_total = float(despesas_agg[0])
    despesas_count = despesas_agg[1] or 0

    # — Distribuição por dia da semana —
    tarefas_por_dia: dict[str, int] = {v: 0 for v in DIAS_SEMANA.values()}
    foco_por_dia: dict[str, int] = {v: 0 for v in DIAS_SEMANA.values()}

    # tarefas concluídas por dia (via created_at)
    tarefas_dia_q = (
        db.query(models.TarefaUnificada.created_at)
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.status == "concluida",
            models.TarefaUnificada.created_at >= inicio_dt,
            models.TarefaUnificada.created_at <= fim_dt,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .all()
    )
    for (ts,) in tarefas_dia_q:
        if ts:
            dia_idx = ts.weekday() if hasattr(ts, 'weekday') else 0
            dia_nome = DIAS_SEMANA.get(dia_idx, "Seg")
            tarefas_por_dia[dia_nome] = tarefas_por_dia.get(dia_nome, 0) + 1

    # foco por dia
    foco_dia_q = (
        db.query(models.SessaoFoco.created_at, models.SessaoFoco.duracao_minutos)
        .filter(
            models.SessaoFoco.user_id == uid,
            models.SessaoFoco.created_at >= inicio_dt,
            models.SessaoFoco.created_at <= fim_dt,
        )
        .all()
    )
    for ts, mins in foco_dia_q:
        if ts:
            dia_idx = ts.weekday() if hasattr(ts, 'weekday') else 0
            dia_nome = DIAS_SEMANA.get(dia_idx, "Seg")
            foco_por_dia[dia_nome] = foco_por_dia.get(dia_nome, 0) + (mins or 0)

    # — Montar stats —
    taxa_conclusao = (tarefas_concluidas / tarefas_criadas * 100) if tarefas_criadas > 0 else 0
    habitos_taxa = (habitos_completados / habitos_possiveis * 100) if habitos_possiveis > 0 else 0

    stats = PeriodStats(
        periodo_label=label,
        inicio=inicio.isoformat(),
        fim=fim.isoformat(),
        tarefas_criadas=tarefas_criadas,
        tarefas_concluidas=tarefas_concluidas,
        tarefas_pendentes=tarefas_criadas - tarefas_concluidas,
        taxa_conclusao_pct=round(taxa_conclusao, 1),
        sessoes_foco=sessoes_foco,
        minutos_foco_total=minutos_foco,
        xp_ganho=xp_ganho,
        media_minutos_por_sessao=round(minutos_foco / sessoes_foco, 1) if sessoes_foco > 0 else 0,
        habitos_completados=habitos_completados,
        habitos_total_registros=habitos_possiveis,
        habitos_taxa_pct=round(habitos_taxa, 1),
        humor_medio=humor_medio,
        registros_humor=registros_humor,
        despesas_total=despesas_total,
        despesas_count=despesas_count,
        streak_atual=streak_atual,
        tarefas_por_dia=tarefas_por_dia,
        foco_por_dia=foco_por_dia,
    )
    stats.score_eficiencia = _calcular_score_eficiencia(stats)
    return stats


# ── Tendências (últimas 8 semanas) ───────────────────────────

def _tendencia_semanal(
    db: Session,
    uid: int,
    semanas: int = 8,
) -> tuple[list[TrendPoint], list[TrendPoint], list[TrendPoint]]:
    """Retorna tendências de tarefas, foco e score para N semanas."""
    hoje = date.today()
    tarefas_trend: list[TrendPoint] = []
    foco_trend: list[TrendPoint] = []
    score_trend: list[TrendPoint] = []

    for i in range(semanas - 1, -1, -1):
        d = hoje - timedelta(weeks=i)
        ini = _inicio_semana(d)
        fim = _fim_semana(d)
        label = f"Sem {semanas - i}"

        stats = _stats_periodo(db, uid, ini, fim, label)
        tarefas_trend.append(TrendPoint(label=label, valor=stats.tarefas_concluidas))
        foco_trend.append(TrendPoint(label=label, valor=stats.minutos_foco_total))
        score_trend.append(TrendPoint(label=label, valor=stats.score_eficiencia))

    return tarefas_trend, foco_trend, score_trend


# ── Rankings ─────────────────────────────────────────────────

def _ranking_dias_semana(db: Session, uid: int, inicio: date, fim: date) -> list[RankingItem]:
    """Ranking de dias mais produtivos (tarefas concluídas)."""
    inicio_dt = datetime.combine(inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
    fim_dt = datetime.combine(fim, datetime.max.time()).replace(tzinfo=timezone.utc)

    tarefas_q = (
        db.query(models.TarefaUnificada.created_at)
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.status == "concluida",
            models.TarefaUnificada.created_at >= inicio_dt,
            models.TarefaUnificada.created_at <= fim_dt,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .all()
    )
    contagem: dict[int, int] = defaultdict(int)
    for (ts,) in tarefas_q:
        if ts and hasattr(ts, 'weekday'):
            contagem[ts.weekday()] += 1

    items = sorted(contagem.items(), key=lambda x: x[1], reverse=True)
    return [
        RankingItem(
            nome=DIAS_SEMANA.get(dia, "?"),
            valor=count,
            posicao=i + 1,
            cor=CORES_RANKING[i % len(CORES_RANKING)],
        )
        for i, (dia, count) in enumerate(items)
    ]


def _top_origens_tarefa(db: Session, uid: int, inicio: date, fim: date) -> list[RankingItem]:
    """Top origens de tarefas (manual, gmail, webhook, etc.)."""
    inicio_dt = datetime.combine(inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
    fim_dt = datetime.combine(fim, datetime.max.time()).replace(tzinfo=timezone.utc)

    origens = (
        db.query(
            models.TarefaUnificada.origem,
            func.count(models.TarefaUnificada.id),
        )
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.created_at >= inicio_dt,
            models.TarefaUnificada.created_at <= fim_dt,
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .group_by(models.TarefaUnificada.origem)
        .order_by(func.count(models.TarefaUnificada.id).desc())
        .limit(5)
        .all()
    )

    NOMES_ORIGEM = {
        "manual": "Manual",
        "gmail_triage": "Gmail (IA)",
        "webhook": "Webhook",
    }

    return [
        RankingItem(
            nome=NOMES_ORIGEM.get(origem, origem or "Outros"),
            valor=count,
            posicao=i + 1,
            cor=CORES_RANKING[i % len(CORES_RANKING)],
        )
        for i, (origem, count) in enumerate(origens)
    ]


# ── API pública: gerar relatório ─────────────────────────────

# Limites de janela histórica para evitar queries ilimitadas com usuários antigos
_MAX_SEMANAS_HISTORICO = 52   # ~1 ano
_MAX_MESES_HISTORICO = 24     # 2 anos


def gerar_relatorio_semanal(
    db: Session,
    uid: int,
    streak_atual: int = 0,
    semanas_historico: int = 8,
) -> AnalyticsReport:
    """Gera relatório semanal completo (estilo Last.fm weekly report).

    Args:
        semanas_historico: janela de tendência — padrão 8, máximo 52.
    """
    semanas_historico = max(1, min(semanas_historico, _MAX_SEMANAS_HISTORICO))

    hoje = date.today()
    sem_ini = _inicio_semana(hoje)
    sem_fim = _fim_semana(hoje)
    sem_ant_ini = sem_ini - timedelta(days=7)
    sem_ant_fim = sem_ini - timedelta(days=1)

    atual = _stats_periodo(db, uid, sem_ini, sem_fim, "Esta Semana", streak_atual)
    anterior = _stats_periodo(db, uid, sem_ant_ini, sem_ant_fim, "Semana Anterior")

    # Variações
    variacao = {
        "tarefas_concluidas": _variacao(atual.tarefas_concluidas, anterior.tarefas_concluidas),
        "minutos_foco": _variacao(atual.minutos_foco_total, anterior.minutos_foco_total),
        "xp_ganho": _variacao(atual.xp_ganho, anterior.xp_ganho),
        "score_eficiencia": _variacao(atual.score_eficiencia, anterior.score_eficiencia),
        "habitos_taxa": _variacao(atual.habitos_taxa_pct, anterior.habitos_taxa_pct),
    }

    # Tendências — limitadas por semanas_historico
    tarefas_t, foco_t, score_t = _tendencia_semanal(db, uid, semanas_historico)

    # Rankings
    ranking_dias = _ranking_dias_semana(db, uid, sem_ini, sem_fim)
    top_origens = _top_origens_tarefa(db, uid, sem_ini, sem_fim)

    # All-time
    total_concluidas = (
        db.query(func.count(models.TarefaUnificada.id))
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.status == "concluida",
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .scalar()
    ) or 0

    total_foco = (
        db.query(func.coalesce(func.sum(models.SessaoFoco.duracao_minutos), 0))
        .filter(models.SessaoFoco.user_id == uid)
        .scalar()
    ) or 0

    return AnalyticsReport(
        periodo_atual=atual,
        periodo_anterior=anterior,
        variacao_pct=variacao,
        tendencia_tarefas=tarefas_t,
        tendencia_foco=foco_t,
        tendencia_score=score_t,
        ranking_dias_semana=ranking_dias,
        top_categorias_tarefa=top_origens,
        total_tarefas_concluidas=total_concluidas,
        total_minutos_foco=int(total_foco),
        total_xp=streak_atual,  # será substituído abaixo
        membro_desde="",
    )


def gerar_relatorio_mensal(
    db: Session,
    uid: int,
    streak_atual: int = 0,
    semanas_historico: int = 8,
) -> AnalyticsReport:
    """Gera relatório mensal completo.

    Args:
        semanas_historico: semanas de tendência no sparkline — padrão 8, máximo 52.
    """
    semanas_historico = max(1, min(semanas_historico, _MAX_SEMANAS_HISTORICO))

    hoje = date.today()
    mes_ini = _inicio_mes(hoje)
    mes_fim = _fim_mes(hoje)

    # Mês anterior
    mes_ant_fim = mes_ini - timedelta(days=1)
    mes_ant_ini = _inicio_mes(mes_ant_fim)

    atual = _stats_periodo(db, uid, mes_ini, mes_fim, "Este Mês", streak_atual)
    anterior = _stats_periodo(db, uid, mes_ant_ini, mes_ant_fim, "Mês Anterior")

    variacao = {
        "tarefas_concluidas": _variacao(atual.tarefas_concluidas, anterior.tarefas_concluidas),
        "minutos_foco": _variacao(atual.minutos_foco_total, anterior.minutos_foco_total),
        "xp_ganho": _variacao(atual.xp_ganho, anterior.xp_ganho),
        "score_eficiencia": _variacao(atual.score_eficiencia, anterior.score_eficiencia),
        "habitos_taxa": _variacao(atual.habitos_taxa_pct, anterior.habitos_taxa_pct),
    }

    # Tendências — limitadas por semanas_historico
    tarefas_t, foco_t, score_t = _tendencia_semanal(db, uid, semanas_historico)

    ranking_dias = _ranking_dias_semana(db, uid, mes_ini, mes_fim)
    top_origens = _top_origens_tarefa(db, uid, mes_ini, mes_fim)

    total_concluidas = (
        db.query(func.count(models.TarefaUnificada.id))
        .filter(
            models.TarefaUnificada.usuario_id == uid,
            models.TarefaUnificada.status == "concluida",
            models.TarefaUnificada.deletado_em.is_(None),
        )
        .scalar()
    ) or 0

    total_foco = (
        db.query(func.coalesce(func.sum(models.SessaoFoco.duracao_minutos), 0))
        .filter(models.SessaoFoco.user_id == uid)
        .scalar()
    ) or 0

    return AnalyticsReport(
        periodo_atual=atual,
        periodo_anterior=anterior,
        variacao_pct=variacao,
        tendencia_tarefas=tarefas_t,
        tendencia_foco=foco_t,
        tendencia_score=score_t,
        ranking_dias_semana=ranking_dias,
        top_categorias_tarefa=top_origens,
        total_tarefas_concluidas=total_concluidas,
        total_minutos_foco=int(total_foco),
        total_xp=0,
        membro_desde="",
    )
