import type { TarefaUnificada } from '../types'
import type { MoodLoadThresholds, MoodOrchestrationContext } from './moodOrchestration'

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
  mood?: MoodOrchestrationContext | null,
): MentalLoadState
{
  const sum = hojeTasks
    .filter((t) => t.status !== 'concluida')
    .reduce((acc, t) => acc + (t.score_urgencia ?? 0), 0)

  const percent = cap > 0 ? Math.round((sum / cap) * 100) : 0
  const thresholds: MoodLoadThresholds = mood?.thresholds ?? {
    warningPercent: 80,
    overloadPercent: 100,
    flowSuggestMinPercent: 80,
    maxActiveForFlow: 3,
  }

  let level: MentalLoadLevel = 'ok'
  let tooltip = 'Carga mental equilibrada para hoje.'

  if (percent >= thresholds.overloadPercent)
  {
    level = 'overload'
    tooltip = mood?.profile === 'recuperacao' || mood?.profile === 'cuidado'
      ? 'Carga alta para o seu humor de hoje. O AXEL sugere adiar o que não for essencial.'
      : 'Sua carga está alta. Recomendo mover tarefas para amanhã.'
  }
  else if (percent >= thresholds.warningPercent)
  {
    level = 'warning'
    tooltip = mood?.profile === 'recuperacao'
      ? 'Atenção: com humor baixo, vale proteger sua energia — priorize poucas tarefas.'
      : 'Atenção: você está perto do limite de carga de hoje.'
  }

  if (mood?.loadTooltipSuffix)
  {
    tooltip += mood.loadTooltipSuffix
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
  mood?: MoodOrchestrationContext | null,
): FlowSuggestion | null
{
  const active = hojeTasks.filter((t) => t.status !== 'concluida')
  const load = computeMentalLoad(hojeTasks, cap, mood)
  const thresholds = mood?.thresholds ?? {
    warningPercent: 80,
    overloadPercent: 100,
    flowSuggestMinPercent: 80,
    maxActiveForFlow: 3,
  }

  if (load.percent < thresholds.flowSuggestMinPercent && active.length <= thresholds.maxActiveForFlow)
  {
    return null
  }

  const candidates = [...active]
    .sort((a, b) => (a.score_urgencia ?? 0) - (b.score_urgencia ?? 0))
    .slice(0, mood?.profile === 'recuperacao' ? 3 : 2)

  if (candidates.length === 0) return null

  const names = candidates.map((t) => t.titulo.replace(/^\[[^\]]+\]\s*/, '').trim())
  const listed = names.map((n) => `[${n}]`).join(' e ')

  let message: string
  if (mood?.profile === 'recuperacao' || mood?.profile === 'cuidado')
  {
    message = `Seu humor pede leveza hoje. Sugiro mover ${listed} para Esta Semana — cap ajustado para ${cap} pts.`
  }
  else if (mood?.profile === 'sem_registro')
  {
    message = `Carga cheia. Sugiro mover ${listed} para amanhã. Registre seu humor para o AXEL calibrar melhor.`
  }
  else
  {
    message = `Sua carga de hoje está cheia. Sugiro mover ${listed} para amanhã para manter seu score diário saudável.`
  }

  return {
    message,
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
