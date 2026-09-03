import type { TarefaUnificada } from '../types'

// Razão do contexto - explicação legível da priorização AXEL

const TAG_FROM_TITLE = /\[(AXEL|FRONTEND|CORE|HUB|API|UX|BACKEND)\]/i

export function getProjectTag(tarefa: TarefaUnificada): string
{
  const fromLabel = tarefa.labels?.[0]?.nome
  if (fromLabel) return fromLabel.toUpperCase()

  const match = tarefa.titulo.match(TAG_FROM_TITLE)
  return match ? match[1].toUpperCase() : 'GERAL'
}

/** Gera texto curto para UI a partir da tarefa e rationale opcional do motor */
export function getContextRationale(
  tarefa: TarefaUnificada,
  engineRationale?: string,
): string
{
  if (engineRationale?.trim())
  {
    return formatEngineRationale(engineRationale, tarefa)
  }

  const tag = getProjectTag(tarefa)
  const score = tarefa.score_urgencia ?? 0
  const origem = tarefa.origem || 'manual'
  const title = tarefa.titulo.toLowerCase()

  if (score > 90)
  {
    return `Priorizado: score ${score} - prazo crítico e alto impacto no módulo ${tag}.`
  }

  if (origem.includes('gmail') || origem.includes('webhook'))
  {
    return 'Priorizado: demanda ingerida automaticamente com sinais de urgência no canal externo.'
  }

  if (title.includes('drawer') || title.includes('kanban'))
  {
    return 'Reordenado: entrega de UX no fluxo principal do board - desbloqueia uso diário do AXEL.'
  }

  if (title.includes('score') || title.includes('urgência') || title.includes('urgencia'))
  {
    return 'Reordenado: evolução do motor de priorização - transparência para o gestor.'
  }

  if (score > 70)
  {
    return `Priorizado: score ${score} - contexto ativo com prazo ou prioridade elevada em ${tag}.`
  }

  return `Na fila: score ${score} - aguardando orquestração; critérios de produtividade do AXEL.`
}

function formatEngineRationale(raw: string, tarefa: TarefaUnificada): string
{
  const parts = raw.split(';').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return getContextRationale(tarefa)

  const lead = (tarefa.score_urgencia ?? 0) > 90 ? 'Priorizado' : 'Reordenado'
  return `${lead}: ${parts.join(' · ')}.`
}

export function recordOrchestrationMetrics(taskCount: number): void
{
  const minutesSaved = Math.max(3, taskCount * 2.5)
  const payload = {
    at: new Date().toISOString(),
    tasksTriaged: taskCount,
    minutesSaved: Math.round(minutesSaved),
  }
  sessionStorage.setItem('axel-last-orchestration', JSON.stringify(payload))
}

export function readOrchestrationMetrics(): {
  at: string | null
  tasksTriaged: number
  minutesSaved: number
}
{
  try
  {
    const raw = sessionStorage.getItem('axel-last-orchestration')
    if (!raw) return { at: null, tasksTriaged: 0, minutesSaved: 0 }
    const parsed = JSON.parse(raw) as { at?: string; tasksTriaged?: number; minutesSaved?: number }
    return {
      at: parsed.at ?? null,
      tasksTriaged: parsed.tasksTriaged ?? 0,
      minutesSaved: parsed.minutesSaved ?? 0,
    }
  }
  catch
  {
    return { at: null, tasksTriaged: 0, minutesSaved: 0 }
  }
}
