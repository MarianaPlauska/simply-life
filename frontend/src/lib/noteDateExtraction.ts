// Extrai datas em texto livre (PT-BR) para criar tarefas no Kanban

const MESES: Record<string, number> = {
  janeiro: 1,
  jan: 1,
  fevereiro: 2,
  fev: 2,
  março: 3,
  marco: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  maio: 5,
  mai: 5,
  junho: 6,
  jun: 6,
  julho: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  setembro: 9,
  set: 9,
  outubro: 10,
  out: 10,
  novembro: 11,
  nov: 11,
  dezembro: 12,
  dez: 12,
}

function pad2(n: number): string
{
  return String(n).padStart(2, '0')
}

function toIso(y: number, m: number, d: number): string | null
{
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const probe = new Date(y, m - 1, d)
  if (
    probe.getFullYear() !== y
    || probe.getMonth() !== m - 1
    || probe.getDate() !== d
  )
  {
    return null
  }
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function resolveYear(year: number | undefined, month: number, ref: Date): number
{
  if (year != null)
  {
    return year < 100 ? 2000 + year : year
  }
  const y = ref.getFullYear()
  const refMonth = ref.getMonth() + 1
  if (month < refMonth) return y + 1
  return y
}

/** Varre o texto e devolve datas ISO únicas (futuras ou hoje) */
export function extractDatesFromText(text: string, reference = new Date()): string[]
{
  const found = new Set<string>()
  const today = reference.toISOString().slice(0, 10)

  const add = (iso: string | null) =>
  {
    if (!iso) return
    if (iso >= today) found.add(iso)
  }

  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g))
  {
    add(toIso(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)))
  }

  for (const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g))
  {
    const d = parseInt(m[1], 10)
    const mo = parseInt(m[2], 10)
    const yr = m[3] != null ? parseInt(m[3], 10) : undefined
    add(toIso(resolveYear(yr, mo, reference), mo, d))
  }

  for (const m of text.matchAll(
    /\b(\d{1,2})\s+de\s+([a-záãçéíóú]+)(?:\s+de\s+(\d{4}))?\b/gi,
  ))
  {
    const d = parseInt(m[1], 10)
    const nome = m[2].toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    const mo = MESES[nome]
    if (!mo) continue
    const yr = m[3] != null ? parseInt(m[3], 10) : resolveYear(undefined, mo, reference)
    add(toIso(yr, mo, d))
  }

  for (const m of text.matchAll(/\bdia\s+(\d{1,2})\b/gi))
  {
    const d = parseInt(m[1], 10)
    const mo = reference.getMonth() + 1
    let y = reference.getFullYear()
    if (d < reference.getDate())
    {
      const next = new Date(y, reference.getMonth() + 1, 1)
      y = next.getFullYear()
      add(toIso(y, next.getMonth() + 1, d))
    }
    else
    {
      add(toIso(y, mo, d))
    }
  }

  return [...found].sort()
}

/** Primeira linha útil como título da tarefa */
export function titleFromNoteText(text: string, max = 100): string
{
  const line = text.trim().split('\n').find((l) => l.trim().length > 0)?.trim() ?? 'Lembrete'
  return line.slice(0, max)
}
