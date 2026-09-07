export function todayIso(ref = new Date()): string
{
  return ref.toISOString().slice(0, 10)
}

/** Dia civil no fuso do aparelho — check-in e água não mudam à meia-noite UTC. */
export function localTodayIso(ref = new Date()): string
{
  const y = ref.getFullYear()
  const m = String(ref.getMonth() + 1).padStart(2, '0')
  const d = String(ref.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isoDaysAgo(days: number, ref = new Date()): string
{
  const d = new Date(ref)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Soma/subtrai dias no calendário local (ofensiva e água). */
export function localIsoDaysAgo(days: number, ref = new Date()): string
{
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - days)
  return localTodayIso(d)
}

/** Segunda-feira da semana civil local. */
export function mondayOfLocalWeek(ref = new Date()): Date
{
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  const dow = d.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + offset)
  return d
}

export function isoDaysFromNow(days: number, ref = new Date()): string
{
  const d = new Date(ref)
  d.setDate(d.getDate() + days)
  return localTodayIso(d)
}

/** Soma meses no calendário civil (parcelas de cartão). */
export function isoMonthsFrom(iso: string, months: number): string
{
  const parts = iso.slice(0, 10).split('-').map(Number)
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const day = parts[2] ?? 1
  const d = new Date(y, m - 1 + months, 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return localTodayIso(d)
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
