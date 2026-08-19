import type { DiaHumorAgregado } from '../../lib/moodInsights'
import { MOOD_HEX } from '../../lib/moodConstants'

interface MoodWeekSparklineProps
{
  dias: DiaHumorAgregado[]
}

export function MoodWeekSparkline({ dias }: MoodWeekSparklineProps)
{
  if (dias.length === 0) return null

  const w = 140
  const h = 36
  const pad = 4
  const values = dias.map((d) => d.humor)
  const min = 1
  const max = 5
  const range = max - min
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0

  const points = values.map((v, i) =>
  {
    const x = values.length > 1 ? pad + i * stepX : w / 2
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })

  const last = values[values.length - 1]
  const stroke = MOOD_HEX[Math.round(last)] || '#9A5B1A'

  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted shrink-0">
        7 dias
      </span>
      <svg width={w} height={h} className="opacity-90">
        {values.length > 1 && (
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {points.map((pt, i) =>
        {
          const [cx, cy] = pt.split(',')
          const color = MOOD_HEX[Math.round(values[i])] || stroke
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fill={color}
              stroke="var(--sl-surface)"
              strokeWidth="1.5"
            />
          )
        })}
      </svg>
    </div>
  )
}
