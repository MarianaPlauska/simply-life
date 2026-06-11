// Tooltip minimalista — legível em claro e escuro (tokens Instrumento)

interface AxelTooltipPayload
{
  name?: string
  value?: number | string
  dataKey?: string | number
}

export interface AxelTooltipProps
{
  active?: boolean
  payload?: readonly AxelTooltipPayload[]
  label?: string | number
}

export function AxelChartTooltip({ active, payload, label }: AxelTooltipProps)
{
  if (!active || !payload?.length)
  {
    return null
  }

  return (
    <div className="rounded-sl border border-line bg-card px-3 py-2 text-[11px] text-ink shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1.5">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((entry) =>
        {
          if (entry.value == null) return null
          return (
            <li key={String(entry.dataKey)} className="flex items-center justify-between gap-4 tabular-nums">
              <span className="text-ink-muted">{entry.name}</span>
              <span className="font-medium text-ink">{entry.value}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const CHART_HEIGHT = 220
