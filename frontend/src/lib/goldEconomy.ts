export const GOLD_PER_TASK = 10
export const GOLD_PER_HABIT = 5

const LS_PREFIX = 'axel-ouro:'

export function readLocalOuro(uid: string): number
{
  try
  {
    const n = parseInt(localStorage.getItem(`${LS_PREFIX}${uid}`) || '0', 10)
    return Number.isFinite(n) ? Math.max(0, n) : 0
  }
  catch
  {
    return 0
  }
}

export function writeLocalOuro(uid: string, amount: number): void
{
  try
  {
    localStorage.setItem(`${LS_PREFIX}${uid}`, String(Math.max(0, amount)))
  }
  catch { /* quota */ }
}

/** Medo 0-2 nas notas do dump (`medo:1`) - multiplicador suave */
export function parseMedoNotas(notas: string | null | undefined): 0 | 1 | 2
{
  const m = notas?.match(/medo:([012])/)
  if (!m) return 0
  const n = Number(m[1])
  return n === 1 || n === 2 ? n : 0
}

export function xpWithFear(base: number, medo: 0 | 1 | 2): number
{
  return Math.round(base * (1 + medo * 0.15))
}
