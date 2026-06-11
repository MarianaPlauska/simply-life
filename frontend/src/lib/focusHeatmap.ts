// Heatmap de produtividade — níveis de cor por horas de foco

export type HeatmapLevel = 'none' | 'light' | 'ideal' | 'deep'

export interface HeatmapDay
{
  date: string
  hours: number
  level: HeatmapLevel
}

export function focusHoursToLevel(hours: number): HeatmapLevel
{
  if (hours <= 0) return 'none'
  if (hours < 1) return 'light'
  if (hours <= 3) return 'ideal'
  return 'deep'
}

export function levelCellClass(level: HeatmapLevel): string
{
  switch (level)
  {
    case 'none':
      return 'bg-chrome'
    case 'light':
      return 'bg-accent/20'
    case 'ideal':
      return 'bg-accent/50'
    case 'deep':
      return 'bg-accent shadow-[0_0_8px_rgba(193,127,58,0.35)]'
  }
}

export function buildLast30Days(focusMinutesByDate: Record<string, number>): HeatmapDay[]
{
  const days: HeatmapDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 29; i >= 0; i--)
  {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const minutes = focusMinutesByDate[date] ?? 0
    const hours = minutes / 60
    days.push({
      date,
      hours: Math.round(hours * 10) / 10,
      level: focusHoursToLevel(hours),
    })
  }

  return days
}

export function formatHeatmapTooltip(dateIso: string, hours: number): string
{
  const d = new Date(`${dateIso}T12:00:00`)
  const label = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  if (hours <= 0) return `${label} · sem foco registrado`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  const time = h > 0 ? `${h}h ${m}m` : `${m} min`
  return `${label} · ${time} de foco`
}
