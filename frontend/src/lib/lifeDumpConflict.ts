import type { TarefaUnificada } from '../types'
import type { DumpCard } from './lifeDumpParse'
import { hasClockTime } from './taskDueTime'

const WINDOW_MS = 30 * 60 * 1000

function dueMs(iso: string | null): number | null
{
  if (!iso || !iso.includes('T')) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

/** Overlap interno: dois compromissos no mesmo intervalo (~30 min) */
export function markDumpConflicts(
  cards: DumpCard[],
  existing: TarefaUnificada[],
): DumpCard[]
{
  const timed = cards.filter((c) => c.kept && c.kind === 'compromisso' && dueMs(c.dataVencimento) != null)

  return cards.map((card) =>
  {
    if (!card.kept || card.kind !== 'compromisso')
    {
      return { ...card, conflict: false }
    }
    const ms = dueMs(card.dataVencimento)
    if (ms == null) return { ...card, conflict: false }

    const vsDump = timed.some((other) =>
    {
      if (other.id === card.id) return false
      const otherMs = dueMs(other.dataVencimento)
      return otherMs != null && Math.abs(otherMs - ms) < WINDOW_MS
    })

    const vsExisting = existing.some((t) =>
    {
      if (t.status === 'concluida' || !hasClockTime(t.data_vencimento)) return false
      const otherMs = dueMs(t.data_vencimento)
      return otherMs != null && Math.abs(otherMs - ms) < WINDOW_MS
    })

    return { ...card, conflict: vsDump || vsExisting }
  })
}

export function conflictHint(card: DumpCard): string | null
{
  if (!card.conflict) return null
  return `Conflito por volta de ${card.hora ?? 'esse horário'}`
}
