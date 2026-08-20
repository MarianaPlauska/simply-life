import { buildMorningBrief, type MorningBrief } from './morningBrief'
import type { TarefaUnificada } from '../types'

export interface MorningBriefContext
{
  hojeTasks: TarefaUnificada[]
  dueToday: number
  overdue: number
  dailyScoreCap: number
}

export async function fetchMorningBrief(
  ctx: MorningBriefContext,
): Promise<MorningBrief & { source?: string }>
{
  const active = ctx.hojeTasks.filter((t) => t.status !== 'concluida')
  const criticalCount = active.filter((t) => (t.score_urgencia ?? 0) >= 90).length
  const local = buildMorningBrief(ctx.hojeTasks, ctx.dailyScoreCap)
  const top = [...active].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]

  const params = new URLSearchParams({
    hojeCount: String(local.hojeCount),
    dueToday: String(ctx.dueToday),
    overdue: String(ctx.overdue),
    loadPercent: String(local.loadPercent),
    criticalCount: String(criticalCount),
    topTaskTitle: top?.titulo ?? '',
    dailyScoreCap: String(ctx.dailyScoreCap),
  })

  try
  {
    const res = await fetch(`/api/morning-brief?${params.toString()}`)
    if (!res.ok) return local
    const data = await res.json()
    return {
      headline: data.headline ?? local.headline,
      loadLine: data.loadLine ?? local.loadLine,
      detail: data.detail ?? local.detail,
      criticalCount: data.criticalCount ?? local.criticalCount,
      loadPercent: data.loadPercent ?? local.loadPercent,
      hojeCount: data.hojeCount ?? local.hojeCount,
      source: data.source,
    }
  }
  catch
  {
    return local
  }
}
