import { useMemo } from 'react'
import {
  buildLast30Days,
  formatHeatmapTooltip,
  levelCellClass,
} from '../../lib/focusHeatmap'

interface ProductivityHeatmapProps
{
  focusMinutesByDate: Record<string, number>
  compact?: boolean
}

// Grid estilo GitHub — últimos 30 dias de foco

export function ProductivityHeatmap({
  focusMinutesByDate,
  compact = false,
}: ProductivityHeatmapProps)
{
  const days = useMemo(
    () => buildLast30Days(focusMinutesByDate),
    [focusMinutesByDate],
  )

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          Foco · 30 dias
        </p>
        <div className="flex items-center gap-1 text-[10px] text-ink-muted font-mono">
          <span className="w-3 h-3 rounded-sm bg-chrome" title="Sem foco" />
          <span className="w-3 h-3 rounded-sm bg-accent/20" title="< 1h" />
          <span className="w-3 h-3 rounded-sm bg-accent/50" title="1–3h" />
          <span
            className="w-3 h-3 rounded-sm bg-accent shadow-[0_0_8px_rgba(193,127,58,0.35)]"
            title="> 3h"
          />
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        role="img"
        aria-label="Heatmap de produtividade dos últimos 30 dias"
      >
        {days.map((day) => (
          <div
            key={day.date}
            className={`w-3 h-3 rounded-sm transition-transform hover:scale-125 cursor-default ${levelCellClass(day.level)}`}
            title={formatHeatmapTooltip(day.date, day.hours)}
          />
        ))}
      </div>
    </div>
  )
}
