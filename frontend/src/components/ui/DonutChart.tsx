export interface DonutSlice
{
  id: string
  label: string
  value: number
  color: string
}

interface DonutChartProps
{
  items: DonutSlice[]
  size?: number
  centerLabel?: string
}

/** Donut SVG leve — sem Recharts */
export function DonutChart({ items, size = 120, centerLabel }: DonutChartProps)
{
  const filtered = items.filter((i) => i.value > 0)
  const total = filtered.reduce((s, i) => s + i.value, 0) || 1
  const r = size / 2 - 8
  const circumference = 2 * Math.PI * r

  if (filtered.length === 0)
  {
    return (
      <div
        className="rounded-full border border-line bg-chrome flex items-center justify-center text-[11px] text-ink-muted"
        style={{ width: size, height: size }}
      >
        —
      </div>
    )
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden>
        {filtered.map((item, idx) =>
        {
          const pct = item.value / total
          const dashLen = pct * circumference
          const prevSum = filtered.slice(0, idx).reduce((s, i) => s + i.value, 0)
          const currentOffset = (prevSum / total) * circumference
          return (
            <circle
              key={item.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth="16"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-display tabular-nums text-ink">{centerLabel}</span>
        </div>
      )}
    </div>
  )
}
