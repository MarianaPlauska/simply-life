import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

interface HealthQuickTileProps
{
  icon: LucideIcon
  label: string
  value: string
  sub: string
  done?: boolean
  onClick: () => void
}

/** Linha de cuidado - checklist, cor de saúde, sem rainbow */
export function HealthQuickTile({
  icon: Icon,
  label,
  value,
  sub,
  done = false,
  onClick,
}: HealthQuickTileProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left min-h-12 py-2 border-t-[0.5px] border-line first:border-t-0 hover:bg-chrome/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-health"
    >
      <span
        className={[
          'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
          done
            ? 'border-health bg-health/20 text-health'
            : 'border-line text-transparent',
        ].join(' ')}
        aria-hidden
      >
        {done && <Check size={14} strokeWidth={2.5} />}
      </span>
      <Icon className="w-4 h-4 shrink-0 text-health" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink-muted">
          {label}
        </span>
        <span className="block text-[15px] text-ink truncate">
          {value}
        </span>
        <span className="block text-[13px] text-ink-muted truncate">{sub}</span>
      </span>
    </button>
  )
}
