import { computeMentalLoad } from './energyOrchestration'
import type { MoodOrchestrationContext } from './moodOrchestration'
import type { TarefaUnificada } from '../types'

export interface MorningBrief
{
  headline: string
  /** Carga e ritmo - segunda linha, nunca a primeira */
  loadLine: string
  detail: string
  criticalCount: number
  loadPercent: number
  hojeCount: number
}

function formatLoadLine(hojeCount: number, loadPercent: number, level: string): string
{
  const ritmo = level === 'overload' ? 'dia cheio' : level === 'warning' ? 'ritmo justo' : 'ritmo ok'
  if (hojeCount === 0)
  {
    return `Nada na fila de Hoje · carga ${loadPercent}%`
  }
  const coisa = hojeCount === 1 ? '1 coisa em Hoje' : `${hojeCount} em Hoje`
  return `${coisa} · carga ${loadPercent}% · ${ritmo}`
}

/** Resumo matinal · conversa, não log de sistema */
export function buildMorningBrief(
  hojeTasks: TarefaUnificada[],
  dailyScoreCap: number,
  mood?: MoodOrchestrationContext | null,
): MorningBrief
{
  const active = hojeTasks.filter((t) => t.status !== 'concluida')
  const criticalCount = active.filter((t) => (t.score_urgencia ?? 0) >= 90).length
  const load = computeMentalLoad(active, dailyScoreCap, mood)
  const loadPercent = Math.round(load.percent)
  const hojeCount = active.length
  const loadLine = formatLoadLine(hojeCount, loadPercent, load.level)

  let headline: string
  if (hojeCount === 0)
  {
    headline = 'Como você está hoje? A fila de Hoje está quieta - dá para respirar.'
  }
  else if (mood?.profile === 'recuperacao')
  {
    headline = 'Estou com você no ritmo curto. Uma coisa de cada vez, quando fizer sentido.'
  }
  else if (mood?.profile === 'sem_registro')
  {
    headline = hojeCount === 1
      ? 'Tem uma coisa em Hoje. Como você está?'
      : `Tem ${hojeCount} em Hoje. Como você está?`
  }
  else if (load.level === 'overload')
  {
    headline = 'O dia está cheio. A gente olha o essencial primeiro, sem pressa.'
  }
  else if (hojeCount === 1)
  {
    headline = 'Tem uma coisa em Hoje, no seu ritmo.'
  }
  else
  {
    headline = `Tem ${hojeCount} em Hoje, no seu ritmo.`
  }

  const top = [...active].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]
  let detail = mood?.axelNote ?? 'Quando fizer sentido, dá uma olhada no que está em Hoje.'
  if (top && mood?.profile !== 'recuperacao')
  {
    const short = top.titulo.trim().slice(0, 56)
    const generic = short.length < 12 || /^(urgente|teste|tarefa)/i.test(short)
    if (!generic)
    {
      detail = `Se couber, começa por: ${short}${top.titulo.length > 56 ? '…' : ''}`
    }
  }
  else if (top && mood?.profile === 'recuperacao')
  {
    detail = `Uma de cada vez. Se couber: ${top.titulo.trim().slice(0, 48)}…`
  }

  return { headline, loadLine, detail, criticalCount, loadPercent, hojeCount }
}
