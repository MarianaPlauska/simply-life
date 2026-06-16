import { computeMentalLoad } from '../../lib/energyOrchestration'
import type { MoodOrchestrationContext } from '../../lib/moodOrchestration'
import { AXEL_PROGRESS_THICK, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

interface AxelMentalLoadBarProps
{
  hojeTasks: TarefaUnificada[]
  cap: number
  mood?: MoodOrchestrationContext | null
}

export function AxelMentalLoadBar({ hojeTasks, cap, mood = null }: AxelMentalLoadBarProps)
{
  const load = computeMentalLoad(hojeTasks, cap, mood)
  const fillPct = Math.min(100, load.percent)

  const fillClass =
    load.level === 'overload'
      ? 'bg-urgente'
      : load.level === 'warning'
        ? 'bg-atencao'
        : 'bg-accent'

  return (
    <div className="min-w-[140px] max-w-[200px] flex-1" title={load.tooltip}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
          Carga hoje
        </p>
        <p className={`font-mono text-[10px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          {load.sum}/{load.cap}
        </p>
      </div>
      <div className={AXEL_PROGRESS_THICK}>
        <div
          className={`h-full rounded-sl transition-all duration-500 ${fillClass}`}
          style={{ width: `${fillPct}%` }}
          role="progressbar"
          aria-valuenow={load.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={load.tooltip}
        />
      </div>
    </div>
  )
}
