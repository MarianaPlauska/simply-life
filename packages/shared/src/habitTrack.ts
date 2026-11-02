/** Hábito marcado no dia. Faltar um dia não apaga os dias já marcados. */

export function shiftIso(iso: string, days: number): string
{
  const base = Date.parse(`${iso}T12:00:00`)
  if (Number.isNaN(base)) return iso
  const date = new Date(base + days * 86_400_000)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Sete dias, do mais antigo ao de hoje. */
export function habitWeek(marked: string[], today: string): boolean[]
{
  const set = new Set(marked)
  const out: boolean[] = []
  for (let i = 6; i >= 0; i--) out.push(set.has(shiftIso(today, -i)))
  return out
}

export function habitMarkedCount(marked: string[]): number
{
  return new Set(marked.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))).size
}
