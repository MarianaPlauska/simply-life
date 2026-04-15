"""
routers/bem_estar.py — Módulo de Bem-Estar Mental (Sprint 4).

Responsabilidades:
  • CRUD de humor (mood tracker, 1 registro/dia)
  • CRUD de journaling (entradas de diário)
  • Weekly Review automática (cruza humor + hábitos + foco + finanças)
  • Correlação IA (humor vs hábitos, sem API externa)
"""
from datetime import date, timedelta, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, and_, case
from sqlalchemy.orm import Session

import database
import models
import schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/bem-estar", tags=["bem-estar"])


# ── Prompts de Journaling ────────────────────────────────────
PROMPTS_DIARIOS = [
    "Como você está se sentindo agora?",
    "O que te deixou grato hoje?",
    "Qual foi o momento mais difícil de hoje?",
    "O que você aprendeu hoje?",
    "Descreva um momento que te fez sorrir.",
    "O que você faria diferente hoje?",
    "Qual meta você quer focar amanhã?",
    "Como está sua energia neste momento?",
    "O que te preocupa agora? Escreva para liberar.",
    "Liste 3 coisas boas que aconteceram hoje.",
    "O que te motivou a levantar hoje?",
    "Qual hábito você mais quer manter?",
    "Quem te inspirou recentemente?",
    "O que você precisa deixar ir?",
    "Como você cuidou de si hoje?",
    "Descreva seu dia em uma palavra. Por quê?",
    "O que você quer que amanhã traga?",
    "Qual conquista pequena te orgulha hoje?",
    "Como você pode ser mais gentil consigo?",
    "O que te deu paz hoje?",
    "Se hoje fosse perfeito, como seria?",
    "O que te fez rir?",
    "Qual desafio te fortaleceu recentemente?",
    "O que você agradece no seu corpo?",
    "Qual conversa marcou seu dia?",
    "O que te deixou frustrado e como lidou?",
    "Se pudesse enviar uma mensagem para si do passado, o que diria?",
    "Qual é o seu maior sonho agora?",
    "Como foi sua qualidade de sono?",
    "O que te faz se sentir vivo?",
]


# ── helpers ──────────────────────────────────────────────────
def _hoje() -> date:
    return datetime.now(timezone.utc).date()


def _prompt_do_dia() -> str:
    """retorna um prompt diferente a cada dia do ano"""
    dia = _hoje().timetuple().tm_yday
    return PROMPTS_DIARIOS[dia % len(PROMPTS_DIARIOS)]


# ══════════════════════════════════════════════════════════════
# HUMOR (Mood Tracker)
# ══════════════════════════════════════════════════════════════

@router.post("/humor", status_code=201)
def registrar_humor(
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
def humor_hoje(
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
def humor_semana(
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
def humor_historico(
    dias: int = Query(default=30, le=365),
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """histórico de humor por N dias"""
    inicio = _hoje() - timedelta(days=dias)
    regs = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data >= inicio,
    ).order_by(models.DiarioHumor.data.asc()).all()
    return [{"id": r.id, "data": str(r.data), "humor": r.humor, "emoji": r.emoji, "nota": r.nota} for r in regs]


# ══════════════════════════════════════════════════════════════
# JOURNALING (Diário)
# ══════════════════════════════════════════════════════════════

@router.get("/prompt-do-dia")
def get_prompt_do_dia():
    """retorna o prompt de journaling do dia"""
    return {"prompt": _prompt_do_dia()}


@router.post("/diario", status_code=201)
def criar_entrada(
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
def diario_hoje(
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
def listar_entradas(
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
def deletar_entrada(
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


# ══════════════════════════════════════════════════════════════
# WEEKLY REVIEW (Revisão Semanal Automática)
# ══════════════════════════════════════════════════════════════

@router.get("/weekly-review")
def weekly_review(
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """gera a review semanal cruzando humor + tarefas + hábitos + foco + finanças"""
    hoje = _hoje()
    inicio = hoje - timedelta(days=6)
    fim = hoje

    # ── humor médio da semana ────────────────────────────────
    humor_data = db.query(
        func.avg(models.DiarioHumor.humor),
        func.count(models.DiarioHumor.id),
    ).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data.between(inicio, fim),
    ).first()
    humor_medio = round(float(humor_data[0] or 0), 1)
    registros_humor = humor_data[1] or 0

    # ── tarefas da semana ────────────────────────────────────
    tarefas_criadas = db.query(func.count(models.TarefaUnificada.id)).filter(
        models.TarefaUnificada.usuario_id == user.id,
        func.date(models.TarefaUnificada.created_at) >= inicio,
    ).scalar() or 0

    tarefas_concluidas = db.query(func.count(models.TarefaUnificada.id)).filter(
        models.TarefaUnificada.usuario_id == user.id,
        models.TarefaUnificada.status == "concluida",
        func.date(models.TarefaUnificada.created_at) >= inicio,
    ).scalar() or 0

    # ── hábitos concluídos vs total ──────────────────────────
    habitos_total = db.query(func.count(models.HistoricoHabito.id)).filter(
        models.HistoricoHabito.usuario_id == user.id,
        models.HistoricoHabito.data.between(inicio, fim),
    ).scalar() or 0

    habitos_concluidos = db.query(func.count(models.HistoricoHabito.id)).filter(
        models.HistoricoHabito.usuario_id == user.id,
        models.HistoricoHabito.data.between(inicio, fim),
        models.HistoricoHabito.concluido == 1,
    ).scalar() or 0

    habitos_pct = round((habitos_concluidos / habitos_total * 100) if habitos_total > 0 else 0, 1)

    # ── despesas da semana ───────────────────────────────────
    despesas_total = db.query(func.sum(models.Despesa.valor)).filter(
        models.Despesa.usuario_id == user.id,
        models.Despesa.data_gasto >= str(inicio),
        models.Despesa.data_gasto <= str(fim),
    ).scalar() or 0

    # ── minutos de foco ──────────────────────────────────────
    foco_min = db.query(func.sum(models.SessaoFoco.duracao_minutos)).filter(
        models.SessaoFoco.user_id == user.id,
        func.date(models.SessaoFoco.created_at) >= inicio,
    ).scalar() or 0

    # ── insight gerado por regras python ─────────────────────
    insight = _gerar_insight(humor_medio, registros_humor, tarefas_concluidas, tarefas_criadas, habitos_pct, foco_min, despesas_total)

    return {
        "semana": f"{inicio.isoformat()} a {fim.isoformat()}",
        "humor_medio": humor_medio,
        "registros_humor": registros_humor,
        "tarefas_concluidas": tarefas_concluidas,
        "tarefas_criadas": tarefas_criadas,
        "habitos_pct": habitos_pct,
        "despesas_total": float(despesas_total),
        "foco_minutos": foco_min,
        "insight_ia": insight,
    }


def _gerar_insight(humor: float, regs: int, concluidas: int, criadas: int, habitos_pct: float, foco: int, despesas: float) -> str:
    """gera texto de insight usando regras simples em python — sem api externa"""
    partes = []

    # humor
    if regs == 0:
        partes.append("Você ainda não registrou seu humor esta semana. Tente registrar pelo menos 3 dias para eu entender melhor seus padrões.")
    elif humor >= 4:
        partes.append(f"Seu humor médio foi {humor}/5 — excelente! Continue mantendo suas rotinas.")
    elif humor >= 3:
        partes.append(f"Humor médio de {humor}/5 — estável. Pequenos ajustes nos hábitos podem elevar ainda mais.")
    else:
        partes.append(f"Humor médio de {humor}/5. Semana mais pesada. Não se cobre — revise seus hábitos de sono e hidratação.")

    # produtividade
    if criadas > 0:
        taxa = round(concluidas / criadas * 100) if criadas > 0 else 0
        if taxa >= 70:
            partes.append(f"Produtividade alta: {concluidas}/{criadas} tarefas concluídas ({taxa}%).")
        elif taxa >= 40:
            partes.append(f"Taxa de conclusão de {taxa}%. Tente quebrar tarefas grandes em subtarefas menores.")
        else:
            partes.append(f"Apenas {taxa}% das tarefas concluídas. Priorize menos tarefas com mais foco.")

    # hábitos
    if habitos_pct >= 80:
        partes.append(f"Hábitos em {habitos_pct}% — consistência impressionante!")
    elif habitos_pct >= 50:
        partes.append(f"Hábitos em {habitos_pct}%. Bom ritmo, mas tem espaço para melhorar.")
    elif habitos_pct > 0:
        partes.append(f"Hábitos em {habitos_pct}%. Foque em completar ao menos 1 hábito por dia.")

    # foco
    if foco >= 120:
        partes.append(f"Total de foco: {foco} minutos. Ótimo investimento em trabalho profundo!")
    elif foco > 0:
        partes.append(f"Total de foco: {foco} minutos. Tente adicionar mais sessões curtas de 25min.")

    # finanças
    if despesas > 0:
        partes.append(f"Gastos da semana: R$ {despesas/100:.2f}.")

    return " ".join(partes) if partes else "Comece a registrar seu humor e hábitos para receber insights personalizados."


# ══════════════════════════════════════════════════════════════
# CORRELAÇÃO IA (Humor vs Hábitos — Python puro)
# ══════════════════════════════════════════════════════════════

@router.get("/correlacao")
def correlacao_humor_habitos(
    db: Session = Depends(database.get_db),
    user: models.Usuario = Depends(get_current_user),
):
    """
    cruza registros de humor com hábitos concluídos no mesmo dia.
    gera insights como: "nos dias que você completou 'água', seu humor foi 25% maior"
    """
    # busca os últimos 30 dias de humor
    inicio = _hoje() - timedelta(days=30)

    humores = db.query(models.DiarioHumor).filter(
        models.DiarioHumor.usuario_id == user.id,
        models.DiarioHumor.data >= inicio,
    ).all()

    if len(humores) < 3:
        return {
            "insights": ["Registre seu humor por pelo menos 3 dias para eu encontrar padrões."],
            "dados": [],
        }

    # mapa de data -> humor
    humor_por_dia = {h.data: h.humor for h in humores}
    humor_medio_geral = sum(humor_por_dia.values()) / len(humor_por_dia)

    # busca hábitos concluídos no mesmo período
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

    # agrupa: hábito -> lista de humores nos dias que completou
    habito_humores: dict[str, list[int]] = {}
    for data_h, nome in historicos:
        if data_h in humor_por_dia:
            habito_humores.setdefault(nome, []).append(humor_por_dia[data_h])

    # gera insights por hábito
    insights = []
    dados = []
    for nome, lista_humor in habito_humores.items():
        if len(lista_humor) < 2:
            continue
        media_com = sum(lista_humor) / len(lista_humor)
        diff_pct = round((media_com - humor_medio_geral) / humor_medio_geral * 100, 1) if humor_medio_geral > 0 else 0
        dados.append({"habito": nome, "humor_medio_com": round(media_com, 1), "humor_medio_geral": round(humor_medio_geral, 1), "diff_pct": diff_pct, "amostras": len(lista_humor)})
        if diff_pct > 5:
            insights.append(f"Nos dias que você completou \"{nome}\", seu humor foi {diff_pct}% melhor.")
        elif diff_pct < -5:
            insights.append(f"Curioso: nos dias com \"{nome}\" concluído, seu humor foi {abs(diff_pct)}% menor. Vale investigar.")

    # busca foco vs humor
    sessoes = db.query(
        func.date(models.SessaoFoco.created_at).label("dia"),
        func.sum(models.SessaoFoco.duracao_minutos).label("total"),
    ).filter(
        models.SessaoFoco.user_id == user.id,
        func.date(models.SessaoFoco.created_at) >= inicio,
    ).group_by(func.date(models.SessaoFoco.created_at)).all()

    humor_com_foco = [humor_por_dia[s.dia] for s in sessoes if s.dia in humor_por_dia and s.total >= 25]
    if len(humor_com_foco) >= 2:
        media_foco = sum(humor_com_foco) / len(humor_com_foco)
        diff_foco = round((media_foco - humor_medio_geral) / humor_medio_geral * 100, 1) if humor_medio_geral > 0 else 0
        if diff_foco > 5:
            insights.append(f"Nos dias com sessões de foco (25min+), seu humor foi {diff_foco}% maior.")

    if not insights:
        insights.append("Continue registrando — preciso de mais dados para encontrar correlações significativas.")

    return {"insights": insights, "dados": dados}
