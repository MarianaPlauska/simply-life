import type { TarefaUnificada } from '../types'

// Motor de Orquestração de Energia — carga mental e horário nobre

export type EnergyPeriod = 'manha' | 'tarde' | 'noite'
export type MentalLoadLevel = 'ok' | 'warning' | 'overload'

export interface MentalLoadState
{
  sum: number
  cap: number
  percent: number
  level: MentalLoadLevel
  tooltip: string
}

export interface FlowSuggestion
{
  message: string
  taskIds: number[]
  taskTitles: string[]
}

const MAINTENANCE_TERMS = [
  'consulta',
  'alinhamento',
  'fyi',
  'documentar',
  'organizar',
  'revisar leve',
  'email',
  'e-mail',
]

export function getEnergyPeriod(now: Date = new Date()): EnergyPeriod
{
  const hour = now.getHours()
  if (hour < 12) return 'manha'
  if (hour < 18) return 'tarde'
  return 'noite'
}

export function computeMentalLoad(
  hojeTasks: TarefaUnificada[],
  cap: number,
): MentalLoadState
{
  const sum = hojeTasks
    .filter((t) => t.status !== 'concluida')
    .reduce((acc, t) => acc + (t.score_urgencia ?? 0), 0)

  const percent = cap > 0 ? Math.round((sum / cap) * 100) : 0

  let level: MentalLoadLevel = 'ok'
  let tooltip = 'Carga mental equilibrada para hoje.'

  if (percent >= 100)
  {
    level = 'overload'
    tooltip =
      'Sua carga está alta. Recomendo mover tarefas para amanhã.'
  }
  else if (percent >= 80)
  {
    level = 'warning'
    tooltip = 'Atenção: você está perto do limite de carga de hoje.'
  }

  return { sum, cap, percent, level, tooltip }
}

export function shouldHighlightNobleHour(
  task: TarefaUnificada,
  period: EnergyPeriod = getEnergyPeriod(),
): boolean
{
  if (task.status === 'concluida') return false

  const score = task.score_urgencia ?? 0
  const title = task.titulo.toLowerCase()

  if (period === 'manha')
  {
    return score > 90
  }

  if (period === 'tarde')
  {
    if (score <= 55) return true
    return MAINTENANCE_TERMS.some((term) => title.includes(term))
  }

  return false
}

export function buildFlowSuggestion(
  hojeTasks: TarefaUnificada[],
  cap: number,
): FlowSuggestion | null
{
  const active = hojeTasks.filter((t) => t.status !== 'concluida')
  const load = computeMentalLoad(hojeTasks, cap)

  if (load.percent < 80 && active.length <= 3)
  {
    return null
  }

  const candidates = [...active]
    .sort((a, b) => (a.score_urgencia ?? 0) - (b.score_urgencia ?? 0))
    .slice(0, 2)

  if (candidates.length === 0) return null

  const names = candidates.map((t) => t.titulo.replace(/^\[[^\]]+\]\s*/, '').trim())

  return {
    message: `Sua carga de hoje está cheia. Sugiro mover ${names.map((n) => `[${n}]`).join(' e ')} para amanhã para manter seu Score diário saudável.`,
    taskIds: candidates.map((t) => t.id),
    taskTitles: names,
  }
}

export function formatFocusMinutes(totalSeconds: number): string
{
  const mins = Math.max(1, Math.round(totalSeconds / 60))
  if (mins >= 60)
  {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${mins}m`
}
