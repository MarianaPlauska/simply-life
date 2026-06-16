import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

// Tile de atalho — alvo de toque ≥ 52px para uso no celular

type TileTone = 'sky' | 'accent' | 'teal' | 'amber'

const TONE: Record<TileTone, { border: string; icon: string; bg: string }> = {
  sky: { border: 'border-sky-500/25', icon: 'text-sky-400', bg: 'bg-sky-500/8' },
  accent: { border: 'border-accent/25', icon: 'text-accent', bg: 'bg-accent-muted/40' },
  teal: { border: 'border-teal-500/25', icon: 'text-teal-400', bg: 'bg-teal-500/8' },
  amber: { border: 'border-amber-500/25', icon: 'text-amber-400', bg: 'bg-amber-500/8' },
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
  icon: Icon, label, value, sub, tone, done = false, onClick,
}: HealthQuickTileProps)
{
  const t = TONE[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex flex-col items-start text-left rounded-sl border p-3 sm:p-4 min-h-[88px]',
        'transition-all active:scale-[0.98] hover:bg-chrome/30',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        t.border, t.bg,
      ].join(' ')}
    >
      {done && (
        <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-concluido/20 text-concluido">
          <Check size={11} strokeWidth={2.5} />
        </span>
      )}
      <Icon className={`w-4 h-4 mb-2 ${t.icon}`} strokeWidth={1.75} />
      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">{label}</span>
      <span className="text-[15px] sm:text-base font-display tabular-nums text-ink mt-0.5 truncate w-full">
        {value}
      </span>
      <span className="text-[10px] text-ink-muted mt-1 line-clamp-2 leading-snug">{sub}</span>
    </button>
  )
}
