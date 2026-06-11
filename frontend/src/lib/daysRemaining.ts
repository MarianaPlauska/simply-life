import { startOfDay } from './dueBucket'

export interface DaysRemainingMeta
{
  diff: number | null
  label: string
  tone: 'urgente' | 'atencao' | 'proximo' | 'muted'
}

/** Dias até o vencimento (negativo = atrasado). */
export function diffDaysUntilDue(
  dataVencimento: string | null | undefined,
  now: Date = new Date(),
): number | null
{
  if (!dataVencimento) return null
  const due = new Date(dataVencimento)
  if (Number.isNaN(due.getTime())) return null

  const today = startOfDay(now).getTime()
  const dueDay = startOfDay(due).getTime()
  return Math.round((dueDay - today) / 86_400_000)
}

/** Rótulo curto para UI — chip de prazo. */
export function formatDaysRemaining(
  dataVencimento: string | null | undefined,
  now: Date = new Date(),
): DaysRemainingMeta
{
  const diff = diffDaysUntilDue(dataVencimento, now)

  if (diff === null)
  {
    return { diff: null, label: 'Sem prazo', tone: 'muted' }
  }

  if (diff < 0)
  {
    const abs = Math.abs(diff)
    return {
      diff,
      label: abs === 1 ? '1d atraso' : `${abs}d atraso`,
      tone: 'urgente',
    }
  }

  if (diff === 0)
  {
    return { diff, label: 'Hoje', tone: 'atencao' }
  }

  if (diff === 1)
  {
    return { diff, label: 'Amanhã', tone: 'proximo' }
  }

  if (diff <= 7)
  {
    return { diff, label: `${diff}d`, tone: 'proximo' }
  }

  const d = new Date(dataVencimento!)
  const short = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return { diff, label: short, tone: 'muted' }
}

export const DAYS_REMAINING_TONE_CLASS: Record<DaysRemainingMeta['tone'], string> = {
  urgente: 'text-urgente border-urgente/35 bg-urgente/10',
  atencao: 'text-atencao border-atencao/35 bg-atencao/10',
  proximo: 'text-accent border-accent/25 bg-accent-muted/30',
  muted: 'text-ink-muted border-line bg-chrome/20',
}
