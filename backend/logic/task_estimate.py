"""
logic/task_estimate.py — Estimativa de esforço para foco (fallback local).

A rota /api/task-estimate usa Groq/Gemini no servidor; este módulo espelha
o fallback quando IA indisponível (mesma lógica do taskEstimateServer.js).
"""

from __future__ import annotations

MIN_ESTIMATE = 20
MAX_ESTIMATE = 480
WORKDAY_MINUTES = 14 * 60


def infer_local_estimate_minutes(
    titulo: str,
    *,
    subtarefas_total: int = 0,
    subtarefas_pendentes: int = 0,
    activity_entries: int = 0,
    descricao: str = "",
    prioridade: str = "media",
    elapsed_focus_minutes: int = 0,
) -> int:
    mins = 28
    mins += subtarefas_total * 14
    mins += subtarefas_pendentes * 6
    mins += activity_entries * 5
    mins += (len(descricao.strip()) // 100) * 4

    if subtarefas_total > 0:
        done = subtarefas_total - subtarefas_pendentes
        ratio = done / subtarefas_total
        mins = round(mins * (1 - ratio * 0.35))

    if prioridade == "critica":
        mins = round(mins * 1.12)
    elif prioridade == "alta":
        mins = round(mins * 1.06)

    if elapsed_focus_minutes > 0:
        mins = max(mins, elapsed_focus_minutes + 15)

    return max(MIN_ESTIMATE, min(MAX_ESTIMATE, min(mins, WORKDAY_MINUTES)))


def suggest_extension_days(
    estimate_minutes: int,
    elapsed_focus_minutes: int,
    *,
    difficulty_signal: bool = False,
) -> int:
    if difficulty_signal:
        return 2 if estimate_minutes < 90 else 3
    if elapsed_focus_minutes >= estimate_minutes * 0.6:
        return 1
    return 1
