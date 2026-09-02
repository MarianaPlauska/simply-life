export function todayIso(ref = new Date()): string
{
  return ref.toISOString().slice(0, 10)
}

export function isoDaysAgo(days: number, ref = new Date()): string
{
  const d = new Date(ref)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function startOfDay(d: Date): Date
{
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function formatDayPt(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTimePt(iso?: string | null): string
{
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function currentMonthLabel(reference = new Date()): string
{
  return reference.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
