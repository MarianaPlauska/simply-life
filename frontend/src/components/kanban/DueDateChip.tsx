import { Calendar } from 'lucide-react'
import { formatDaysRemaining } from '../../lib/daysRemaining'
import { kanbanDueTextClass } from '../../lib/kanbanCardGrammar'

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

  const toneClass = kanbanDueTextClass(date)

  if (compact)
  {
    return (
      <span
        className={`inline-flex items-center gap-0.5 font-mono tabular-nums ${toneClass}`}
        title={date ? new Date(date).toLocaleString('pt-BR') : undefined}
      >
        {meta.label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tabular-nums ${toneClass}`}
      title={date ? new Date(date).toLocaleString('pt-BR') : undefined}
    >
      <Calendar size={10} strokeWidth={1.5} aria-hidden />
      {meta.label}
    </span>
  )
}
