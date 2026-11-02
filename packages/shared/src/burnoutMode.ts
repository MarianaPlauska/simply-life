/**
 * Modo burnout: um intervalo de dias em que falhar o Elo não quebra a sequência.
 * Não encolhe o plano do dia. Isso continua no ritual da noite, se a pessoa quiser.
 */

export type BurnoutSpan = { from: string; until: string }

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export function addIsoDays(iso: string, days: number): string
{
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days, 12, 0, 0)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

export function burnoutSpan(today: string, days: 3 | 7): BurnoutSpan
{
  return { from: today, until: addIsoDays(today, days - 1) }
}

export function spanCovers(span: BurnoutSpan, iso: string): boolean
{
  return iso >= span.from && iso <= span.until
}

export function burnoutActive(span: BurnoutSpan | null, today: string): boolean
{
  if (!span) return false
  return spanCovers(span, today)
}

/** Dias do intervalo, inclusive as pontas. Ignora texto inválido. */
export function datesInSpan(span: BurnoutSpan): string[]
{
  if (!ISO_RE.test(span.from) || !ISO_RE.test(span.until) || span.until < span.from) return []
  const out: string[] = []
  for (let iso = span.from; iso <= span.until && out.length < 40; iso = addIsoDays(iso, 1))
  {
    out.push(iso)
  }
  return out
}

/** Dias que o Elo trata como descanso extra, sem gastar o descanso da semana. */
export function protectedIsoDates(active: BurnoutSpan | null, history: BurnoutSpan[]): string[]
{
  const set = new Set<string>()
  for (const span of [...history, ...(active ? [active] : [])])
  {
    for (const iso of datesInSpan(span)) set.add(iso)
  }
  return [...set]
}
