import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { MoodDistributionSlice } from '../../lib/moodDistribution'
import { MOODS } from '../../lib/moodConstants'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface MoodDistributionDonutProps
{
  slices: MoodDistributionSlice[]
  total: number
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: MoodDistributionSlice }>
})
{
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="border border-line rounded-sl bg-card px-3 py-2 shadow-lg">
      <p className={`text-[11px] ${AXEL_TEXT_PRIMARY}`}>{row.name}</p>
      <p className="font-mono text-[12px] text-health tabular-nums">{row.value} registro(s)</p>
    </div>
  )
}

/** Rosca - distribuição de humor no período */
export function MoodDistributionDonut({ slices, total }: MoodDistributionDonutProps)
{
  if (total === 0)
  {
    return (
      <div className="h-[168px] flex flex-col items-center justify-center text-center px-4">
        <p className={`text-[13px] ${AXEL_TEXT_SECONDARY}`}>
          Sem registros de humor neste período.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {MOODS.map((m) => (
            <div key={m.value} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.hex }} />
              <span className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="transparent"
            >
              {slices.map((entry) => (
                <Cell key={entry.mood} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[22px] font-display tabular-nums text-ink">{total}</span>
          <span className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>registros</span>
        </div>
      </div>

      <ul className="flex-1 min-w-0 space-y-2 w-full sm:w-auto">
        {MOODS.map((m) =>
        {
          const slice = slices.find((s) => s.mood === m.value)
          const count = slice?.value ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <li key={m.value} className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-1 ring-line/40"
                style={{ backgroundColor: m.hex }}
                aria-hidden
              />
              <span className={`text-[12px] flex-1 truncate ${AXEL_TEXT_PRIMARY}`}>{m.label}</span>
              <span className={`font-mono text-[11px] tabular-nums shrink-0 ${AXEL_TEXT_SECONDARY}`}>
                {count > 0 ? `${count} · ${pct}%` : '-'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
