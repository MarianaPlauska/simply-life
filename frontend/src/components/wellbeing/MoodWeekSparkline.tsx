import { Smile } from 'lucide-react'
import type { DiaHumorAgregado } from '../../lib/moodInsights'
import { MOOD_HEX } from '../../lib/moodConstants'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import { ModuleEmptyState } from '../ui/ModuleEmptyState'

interface MoodWeekSparklineProps
{
  dias: DiaHumorAgregado[]
}

/** Sparkline de humor - pontos na cor do registro, altura de verdade */
export function MoodWeekSparkline({ dias }: MoodWeekSparklineProps)
{
  if (dias.length === 0)
  {
    return (
      <ModuleEmptyState
        icon={Smile}
        tone="health"
        message={EMPTY_COPY.moodWeek}
      />
    )
  }

  const w = 280
  const h = 72
  const pad = 8
  const values = dias.map((d) => d.humor)
  const min = 1
  const max = 5
  const range = max - min
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0

  const points = values.map((v, i) =>
  {
    const x = values.length > 1 ? pad + i * stepX : w / 2
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return { x, y }
  })

  const last = values[values.length - 1]
  const stroke = MOOD_HEX[Math.round(last)] || '#9A5B1A'
  const line = points.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `${pad},${h - pad} ${line} ${points[points.length - 1].x},${h - pad}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-12 xl:h-[72px]"
      role="img"
      aria-label="Humor nos últimos dias"
    >
      {values.length > 1 && (
        <>
          <polygon points={area} fill={stroke} opacity="0.12" />
          <polyline
            points={line}
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {points.map((p, i) =>
      {
        const color = MOOD_HEX[Math.round(values[i])] || stroke
        return (
          <circle
            key={dias[i]?.data ?? i}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill={color}
            stroke="var(--sl-surface)"
            strokeWidth="2"
          />
        )
      })}
    </svg>
  )
}
