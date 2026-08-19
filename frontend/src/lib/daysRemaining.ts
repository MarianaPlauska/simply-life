import { parseCalendarDate, startOfDay } from './dueBucket'

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
  const due = parseCalendarDate(dataVencimento)
  if (!due) return null

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
  urgente:
    'text-[10px] font-medium px-2 py-0.5 rounded border ' +
    'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500/20',
  atencao:
    'text-[10px] font-medium px-2 py-0.5 rounded border ' +
    'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/20',
  proximo:
    'text-[10px] font-medium px-2 py-0.5 rounded border ' +
    'bg-zinc-100 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-white/8',
  muted:
    'text-[10px] font-medium px-2 py-0.5 rounded border ' +
    'bg-zinc-100 text-zinc-500 border-zinc-200/50 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-white/8',
}
