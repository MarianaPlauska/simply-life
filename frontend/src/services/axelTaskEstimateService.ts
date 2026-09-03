import type { TarefaUnificada } from '../types'
import { fetchTaskEstimateIA, type TaskEstimateIAResponse } from './jarvisApi'
import { inferComplexityFromTask } from '../lib/axelTaskEstimate'

export interface ResolvedTaskEstimate extends TaskEstimateIAResponse
{
  estimate_minutes: number
}

function buildPayload(
  task: TarefaUnificada,
  activityEntryCount: number,
  elapsedFocusMinutes: number,
  difficultySignal: boolean,
)
{
  return {
    titulo: task.titulo,
    descricao: task.notas_locais ?? task.descricao ?? '',
    prioridade: task.prioridade,
    status: task.status,
    subtarefas: task.subtarefas ?? [],
    activityEntryCount,
    elapsedFocusMinutes,
    difficultySignal,
    score_urgencia: task.score_urgencia ?? 0,
  }
}

/** Estimativa via /api/task-estimate (Groq/Gemini) com fallback local */
export async function resolveTaskEstimate(
  task: TarefaUnificada,
  activityEntryCount = 0,
  elapsedFocusMinutes = 0,
  difficultySignal = false,
): Promise<ResolvedTaskEstimate>
{
  const localMinutes = inferComplexityFromTask(task, activityEntryCount)

  try
  {
    const ia = await fetchTaskEstimateIA(
      buildPayload(task, activityEntryCount, elapsedFocusMinutes, difficultySignal),
    )
  return {
      ...ia,
      estimate_minutes: Math.max(
        localMinutes,
        ia.estimate_minutes,
      ),
    }
  }
  catch
  {
    return {
      estimate_minutes: localMinutes,
      extension_days: difficultySignal ? 2 : 1,
      reasoning: 'Estimativa local - IA do servidor indisponível (adicione GROQ_API_KEY ou GEMINI_API_KEY no Vercel).',
      confidence: 0.4,
      source: 'local',
      iaDisponivel: false,
    }
  }
}
