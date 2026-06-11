import { Sunrise } from 'lucide-react'
import { buildMorningBrief } from '../../lib/morningBrief'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

interface KanbanMorningBriefProps
{
  hojeTasks: TarefaUnificada[]
  dailyScoreCap: number
}

export function KanbanMorningBrief({ hojeTasks, dailyScoreCap }: KanbanMorningBriefProps)
{
  const brief = buildMorningBrief(hojeTasks, dailyScoreCap)

  return (
    <section
      className="flex items-start gap-3 px-4 py-3 border border-line rounded-sl bg-chrome/25"
      aria-label="Resumo do dia"
    >
      <Sunrise className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className={`text-[13px] leading-snug ${AXEL_TEXT_PRIMARY}`}>
          {brief.headline}
        </p>
        <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          {brief.detail}
        </p>
      </div>
    </section>
  )
}
