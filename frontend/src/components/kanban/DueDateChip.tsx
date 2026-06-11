import { Calendar } from 'lucide-react'
import {
  DAYS_REMAINING_TONE_CLASS,
  formatDaysRemaining,
} from '../../lib/daysRemaining'

interface DueDateChipProps
{
  date: string | null | undefined
  compact?: boolean
}

export function DueDateChip({ date, compact = false }: DueDateChipProps)
{
  const meta = formatDaysRemaining(date)

  if (meta.diff === null && !date)
  {
    return null
  }

  const toneClass = DAYS_REMAINING_TONE_CLASS[meta.tone]

  if (compact)
  {
    return (
      <span
        className={`inline-flex items-center gap-0.5 font-mono text-[9px] tabular-nums px-1 py-0.5 rounded-sm border ${toneClass}`}
        title={date ? new Date(date).toLocaleString('pt-BR') : undefined}
      >
        {meta.label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-sl border ${toneClass}`}
      title={date ? new Date(date).toLocaleString('pt-BR') : undefined}
    >
      <Calendar size={10} strokeWidth={1.5} aria-hidden />
      {meta.label}
    </span>
  )
}
