import { buildMonthSlots } from '../../lib/moodInsights'
import type { DiaHumorAgregado } from '../../lib/moodInsights'
import { MOOD_HEX, MOODS } from '../../lib/moodConstants'

interface MoodMonthHeatmapProps
{
  agregados: DiaHumorAgregado[]
  dias?: number
}

export function MoodMonthHeatmap({ agregados, dias = 30 }: MoodMonthHeatmapProps)
{
  const slots = buildMonthSlots(agregados, dias)

  return (
    <div className="pt-3 border-t border-line">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted mb-2">
        Últimos {dias} dias
      </p>
      <div className="flex flex-wrap gap-1">
        {slots.map(({ data, humor, registros }) => (
          <div
            key={data}
            title={
              humor
                ? `${data}: ${humor}/5${registros > 1 ? ` (${registros} registros)` : ''}`
                : data
            }
            className="w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125"
            style={{
              backgroundColor: humor ? MOOD_HEX[Math.round(humor)] || '#71717a' : 'var(--sl-chrome)',
              opacity: humor ? 0.85 + (registros > 1 ? 0.1 : 0) : 0.35,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {MOODS.map((m) => (
          <div key={m.value} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: m.hex }} />
            <span className="text-[9px] text-ink-muted">{m.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
