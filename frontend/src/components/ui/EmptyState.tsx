// empty state genérico — tokens AXEL (sem violeta legado)
import type { ElementType } from 'react'

type EmptyStateTone = 'accent' | 'teal' | 'amber'

interface EmptyStateProps
{
  icon: ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  tone?: EmptyStateTone
}

const TONE_STYLES: Record<EmptyStateTone, { icon: string; btn: string; glow: string }> = {
  accent: {
    icon: 'text-accent',
    glow: 'shadow-[0_0_24px_rgba(180,120,60,0.08)]',
    btn: 'bg-accent-muted text-ink border border-accent/30 hover:bg-accent/15 hover:border-accent/40',
  },
  teal: {
    icon: 'text-teal-400',
    glow: 'shadow-[0_0_24px_rgba(45,212,191,0.08)]',
    btn: 'bg-teal-500/10 text-teal-100 border border-teal-500/30 hover:bg-teal-500/15 hover:border-teal-500/40',
  },
  amber: {
    icon: 'text-amber-400',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.08)]',
    btn: 'bg-amber-500/10 text-amber-100 border border-amber-500/30 hover:bg-amber-500/15 hover:border-amber-500/40',
  },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'accent',
}: EmptyStateProps)
{
  const s = TONE_STYLES[tone]

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
      <div className={`w-16 h-16 rounded-sl bg-chrome/50 border border-line flex items-center justify-center ${s.glow}`}>
        <Icon className={`w-7 h-7 ${s.icon}`} />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-[13px] text-ink-muted leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`mt-1 px-5 py-2.5 rounded-sl text-[13px] font-semibold transition-colors min-h-[44px] ${s.btn}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
