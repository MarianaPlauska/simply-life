import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

// Atalho de cuidado — linha, sem caixa fechada

type TileTone = 'sky' | 'accent' | 'teal' | 'amber'

const TONE_ICON: Record<TileTone, string> = {
  sky: 'text-sky-400',
  accent: 'text-accent',
  teal: 'text-teal-400',
  amber: 'text-amber-400',
}

interface HealthQuickTileProps
{
  icon: LucideIcon
  label: string
  value: string
  sub: string
  tone: TileTone
  done?: boolean
  onClick: () => void
}

export function HealthQuickTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  done = false,
  onClick,
}: HealthQuickTileProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex items-center gap-3 w-full text-left min-h-12 py-2',
        'border-t-[0.5px] border-line first:border-t-0',
        'transition-colors hover:bg-chrome/40',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      ].join(' ')}
    >
      <Icon className={`w-4 h-4 shrink-0 ${TONE_ICON[tone]}`} strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        <span className="block text-[15px] font-display tabular-nums text-ink truncate">
          {value}
        </span>
        <span className="block text-[12px] text-ink-muted truncate">{sub}</span>
      </span>
      {done && (
        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-concluido/20 text-concluido">
          <Check size={11} strokeWidth={2.5} />
        </span>
      )}
    </button>
  )
}
