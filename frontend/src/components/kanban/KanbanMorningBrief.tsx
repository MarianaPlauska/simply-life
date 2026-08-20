import { Sunrise } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildMorningBrief, type MorningBrief } from '../../lib/morningBrief'
import { fetchMorningBrief } from '../../lib/morningBriefApi'
import type { MoodOrchestrationContext } from '../../lib/moodOrchestration'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

interface KanbanMorningBriefProps
{
  hojeTasks: TarefaUnificada[]
  dueToday: number
  overdue: number
  dailyScoreCap: number
  mood?: MoodOrchestrationContext | null
}

export function KanbanMorningBrief({
  hojeTasks,
  dueToday,
  overdue,
  dailyScoreCap,
  mood = null,
}: KanbanMorningBriefProps)
{
  const [brief, setBrief] = useState<MorningBrief>(() =>
    buildMorningBrief(hojeTasks, dailyScoreCap, mood),
  )
  const [source, setSource] = useState<string>('local')

  useEffect(() =>
  {
    setBrief(buildMorningBrief(hojeTasks, dailyScoreCap, mood))
  }, [hojeTasks, dailyScoreCap, mood])

  useEffect(() =>
  {
    let cancelled = false

    void fetchMorningBrief({ hojeTasks, dueToday, overdue, dailyScoreCap }).then((b) =>
    {
      if (cancelled) return
      setBrief(b)
      setSource(b.source ?? 'local')
    })

    return () =>
    {
      cancelled = true
    }
  }, [hojeTasks, dueToday, overdue, dailyScoreCap, mood])

  return (
    <section
      className="flex items-start gap-3 px-4 py-3 border border-line rounded-sl bg-chrome/25"
      aria-label="Resumo do dia"
    >
      <Sunrise className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-[13px] leading-snug ${AXEL_TEXT_PRIMARY}`}>
            {brief.headline}
          </p>
          {source === 'ai' && (
            <span className="font-mono text-[8px] uppercase tracking-wide text-accent border border-accent/25 px-1 rounded-sm shrink-0">
              AXEL
            </span>
          )}
        </div>
        <p className={`text-[11px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          {brief.loadLine}
          {brief.detail ? ` · ${brief.detail}` : ''}
        </p>
      </div>
    </section>
  )
}
