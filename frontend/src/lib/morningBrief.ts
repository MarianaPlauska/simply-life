import { computeMentalLoad } from './energyOrchestration'
import type { TarefaUnificada } from '../types'

export interface MorningBrief
{
  headline: string
  detail: string
  criticalCount: number
  loadPercent: number
  hojeCount: number
}

/** Resumo matinal — tom de assistente, não de dashboard frio */
export function buildMorningBrief(
  hojeTasks: TarefaUnificada[],
  dailyScoreCap: number,
): MorningBrief
{
  const active = hojeTasks.filter((t) => t.status !== 'concluida')
  const criticalCount = active.filter((t) => (t.score_urgencia ?? 0) >= 90).length
  const load = computeMentalLoad(active, dailyScoreCap)
  const loadPercent = Math.round(load.percent)
  const hojeCount = active.length

  let headline: string
  if (hojeCount === 0)
  {
    headline = 'Fila de Hoje vazia — bom momento para planejar a semana.'
  }
  else if (criticalCount >= 3)
  {
    headline = `${criticalCount} críticas em Hoje — comece pela de maior score.`
  }
  else if (load.level === 'overload')
  {
    headline = `Carga em ${loadPercent}% — AXEL pode adiar o excesso para Semana.`
  }
  else
  {
    headline = `${hojeCount} em Hoje · carga ${loadPercent}% — ritmo sustentável.`
  }

  const top = [...active].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]
  let detail = 'Arraste do planejamento ou deixe o AXEL reorganizar.'
  if (top)
  {
    const short = top.titulo.trim().slice(0, 56)
    const generic = short.length < 12 || /^(urgente|teste|tarefa)/i.test(short)
    detail = generic
      ? 'AXEL já ordenou por score — comece pela primeira da fila.'
      : `Foco sugerido: ${short}${top.titulo.length > 56 ? '…' : ''}`
  }

  return { headline, detail, criticalCount, loadPercent, hojeCount }
}
