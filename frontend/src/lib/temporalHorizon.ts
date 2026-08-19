import type { TarefaUnificada } from '../types'
import { parseCalendarDate } from './dueBucket'

// Horizonte temporal Bitrix — HOJE / ESTA SEMANA / BACKLOG

export type TemporalHorizon = 'hoje' | 'semana' | 'backlog'

export const HORIZON_LABELS: Record<TemporalHorizon, string> = {
  hoje: 'Hoje',
  semana: 'Esta Semana',
  backlog: 'Backlog',
}

function startOfDay(d: Date): Date
{
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isDueToday(dataVencimento: string | null | undefined): boolean
{
  if (!dataVencimento) return false
  const due = parseCalendarDate(dataVencimento)
  if (!due) return false
  const now = new Date()
  return startOfDay(due).getTime() === startOfDay(now).getTime()
}

function isDueThisWeek(dataVencimento: string | null | undefined): boolean
{
  if (!dataVencimento) return false
  const due = parseCalendarDate(dataVencimento)
  if (!due) return false
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  return due >= startOfDay(now) && due <= end
}

/** Patch persistido quando o usuário arrasta para um horizonte */
export function horizonPersistPatch(horizon: TemporalHorizon): {
  horizon_override: TemporalHorizon
  score_urgencia: number
  status: TarefaUnificada['status']
}
{
  if (horizon === 'hoje')
  {
    return { horizon_override: 'hoje', score_urgencia: 92, status: 'em_progresso' }
  }
  if (horizon === 'semana')
  {
    return { horizon_override: 'semana', score_urgencia: 75, status: 'em_progresso' }
  }
  return { horizon_override: 'backlog', score_urgencia: 40, status: 'pendente' }
}

/** Resolve horizonte com override manual (drag) — persistido vence o score */
export function resolveTemporalHorizon(
  tarefa: TarefaUnificada,
  override?: TemporalHorizon,
): TemporalHorizon
{
  const pinned = override ?? tarefa.horizon_override ?? undefined
  if (pinned) return pinned

  const score = tarefa.score_urgencia ?? 0

  if (score > 90 || isDueToday(tarefa.data_vencimento))
  {
    return 'hoje'
  }

  if (
    score > 70
    || tarefa.status === 'em_progresso'
    || isDueThisWeek(tarefa.data_vencimento)
  )
  {
    return 'semana'
  }

  return 'backlog'
}

export function bucketByTemporalHorizon(
  tarefas: TarefaUnificada[],
  overrides: Record<number, TemporalHorizon> = {},
): Record<TemporalHorizon, TarefaUnificada[]>
{
  const sortDesc = (a: TarefaUnificada, b: TarefaUnificada) =>
    (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0)

  const active = tarefas.filter((t) => t.status !== 'concluida')
  const buckets: Record<TemporalHorizon, TarefaUnificada[]> = {
    hoje: [],
    semana: [],
    backlog: [],
  }

  for (const t of active)
  {
    const horizon = resolveTemporalHorizon(t, overrides[t.id])
    buckets[horizon].push(t)
  }

  buckets.hoje.sort(sortDesc)
  buckets.semana.sort(sortDesc)
  buckets.backlog.sort(sortDesc)

  return buckets
}

/** Explicação "Por que está em HOJE?" */
export function getTemporalPlacementRationale(
  tarefa: TarefaUnificada,
  horizon: TemporalHorizon,
  engineRationale?: string,
): string
{
  const score = tarefa.score_urgencia ?? 0

  if (horizon === 'hoje')
  {
    if (isDueToday(tarefa.data_vencimento))
    {
      return 'Esta demanda está em HOJE porque o prazo vence hoje — execução imediata obrigatória no ciclo atual.'
    }
    if (score > 90)
    {
      return `Esta demanda está em HOJE porque o Motor de Contexto atribuiu score crítico (${score}) — foco máximo nas próximas horas.`
    }
    return 'Esta demanda está em HOJE por decisão de orquestração manual ou sinais combinados de urgência.'
  }

  if (horizon === 'semana')
  {
    if (engineRationale?.trim())
    {
      return `Orquestração ativa para esta semana: ${engineRationale.replace(/;/g, ' · ')}.`
    }
    if (tarefa.status === 'em_progresso')
    {
      return 'Esta demanda está em ESTA SEMANA porque já está em progresso — sprint curto com entrega planejada nos próximos dias.'
    }
    return `Esta demanda está em ESTA SEMANA (score ${score}) — médio prazo com orquestração ativa antes do backlog.`
  }

  return 'Esta demanda está no BACKLOG porque a IA ainda não a priorizou para o ciclo atual — aguarda sinais de prazo, score ou dependências.'
}

export function formatDueMeta(dataVencimento: string | null | undefined): string | null
{
  if (!dataVencimento) return null
  const due = parseCalendarDate(dataVencimento)
  if (!due) return null

  if (isDueToday(dataVencimento))
  {
    const hasTime = dataVencimento.includes('T') && !dataVencimento.endsWith('T12:00:00')
    if (hasTime)
    {
      return `Hoje ${due.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return 'Hoje'
  }

  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
