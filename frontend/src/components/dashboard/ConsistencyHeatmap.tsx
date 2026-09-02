import { useMemo } from 'react'
import {
  intensityLevel,
  INTENSITY_MIX,
  type ConsistencyDay,
  type ConsistencyTone,
} from '../../lib/consistencyHeatmap'
import { CalendarCheck, Wallet } from 'lucide-react'
import { AXEL_TEXT_SECONDARY, MODULE_METRIC } from '../../constants/axelSurfaces'
import { ModuleEmptyState } from '../ui/ModuleEmptyState'

interface ConsistencyHeatmapProps
{
  cells: ConsistencyDay[]
  tone: ConsistencyTone
  weeks?: number
  label: string
  emptyHint: string
  formatTooltip: (day: ConsistencyDay) => string
  compact?: boolean
}

const WEEKDAY_LABELS = ['Seg', '', 'Qua', '', 'Sex', '', '']

function cellColor(tone: ConsistencyTone, level: 0 | 1 | 2 | 3 | 4): string
{
  if (level === 0)
  {
    return 'var(--sl-chrome)'
  }
  const token = tone === 'finance' ? 'var(--sl-finance)' : 'var(--sl-health)'
  const mix = INTENSITY_MIX[level]
  return `color-mix(in srgb, ${token} ${mix}%, transparent)`
}

export function ConsistencyHeatmap({
  cells,
  tone,
  weeks = 12,
  label,
  emptyHint,
  formatTooltip,
  compact = false,
}: ConsistencyHeatmapProps)
{
  const maxCount = useMemo(
    () => Math.max(...cells.map((c) => c.count), 1),
    [cells],
  )

  const hasAny = cells.some((c) => c.count > 0)
  const activeDays = useMemo(
    () => cells.filter((c) => c.count > 0).length,
    [cells],
  )
  const metricClass = tone === 'finance' ? MODULE_METRIC.finance : MODULE_METRIC.health
  if (!hasAny)
  {
    return (
      <div>
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <ModuleEmptyState
          icon={tone === 'finance' ? Wallet : CalendarCheck}
          tone={tone === 'finance' ? 'finance' : 'health'}
          message={emptyHint}
        />
      </div>
    )
  }

  const gridClass = compact
    ? 'grid gap-[2px] [grid-auto-flow:column] [grid-template-rows:repeat(7,0.625rem)] [grid-auto-columns:0.625rem]'
    : 'grid gap-[3px] [grid-auto-flow:column] [grid-template-rows:repeat(7,0.875rem)] [grid-auto-columns:0.875rem] sm:[grid-template-rows:repeat(7,1rem)] sm:[grid-auto-columns:1rem]'
  const cellClass = compact
    ? 'w-2.5 h-2.5 rounded-[2px] border border-line/30'
    : 'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] border border-line/40'
  const labelClass = compact
    ? 'h-2.5 text-[9px] leading-none'
    : 'h-3.5 sm:h-4 text-[10px] sm:text-[11px] leading-none flex items-center'

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="sl-section-label mb-1">{label}</p>
        <p className={`${metricClass} text-[16px]`}>
          <span>{activeDays}</span>
          <span className="sl-body-muted ml-1 normal-case tracking-normal">dias</span>
        </p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <div
          className="flex flex-col gap-[3px] shrink-0 text-ink-muted"
          aria-hidden
        >
          {WEEKDAY_LABELS.map((w, i) => (
            <span key={i} className={labelClass}>{w}</span>
          ))}
        </div>
        <div className={gridClass} role="img" aria-label={label}>
          {cells.map((cell) =>
          {
            const level = intensityLevel(cell.count, maxCount)
            return (
              <div
                key={cell.date}
                title={formatTooltip(cell)}
                className={cellClass}
                style={{ backgroundColor: cellColor(tone, level) }}
              />
            )
          })}
        </div>
      </div>
      <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
        Últimas {weeks} semanas
      </p>
    </div>
  )
}
