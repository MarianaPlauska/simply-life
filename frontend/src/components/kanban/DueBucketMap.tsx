import { AlertTriangle, CalendarDays, CalendarRange, CircleDashed, Sun } from 'lucide-react'
import { DUE_BUCKET_LABELS, type DueBucket } from '../../lib/dueBucket'

// Navegação compacta entre faixas de prazo — grade sem scroll horizontal

interface DueBucketMapProps
{
  counts: Record<DueBucket, number>
}

const NAV_BUCKETS: DueBucket[] = [
  'vencido',
  'hoje',
  'esta_semana',
  'proxima_semana',
  'sem_prazo',
]

const BUCKET_SHORT: Partial<Record<DueBucket, string>> = {
  vencido: 'Atraso',
  hoje: 'Hoje',
  esta_semana: 'Semana',
  proxima_semana: 'Próx.',
  sem_prazo: 'Sem data',
}

const BUCKET_CHIP: Record<DueBucket, { Icon: typeof Sun; active: string; idle: string }> = {
  vencido: {
    Icon: AlertTriangle,
    active: 'border-urgente/50 bg-urgente/15 text-urgente',
    idle: 'border-line bg-chrome/20 text-ink-muted',
  },
  hoje: {
    Icon: Sun,
    active: 'border-atencao/50 bg-atencao/15 text-atencao',
    idle: 'border-line bg-chrome/20 text-ink-muted',
  },
  esta_semana: {
    Icon: CalendarDays,
    active: 'border-sky-500/45 bg-sky-500/15 text-sky-400',
    idle: 'border-line bg-chrome/20 text-ink-muted',
  },
  proxima_semana: {
    Icon: CalendarRange,
    active: 'border-accent/40 bg-accent-muted/30 text-accent',
    idle: 'border-line bg-chrome/20 text-ink-muted',
  },
  sem_prazo: {
    Icon: CircleDashed,
    active: 'border-line bg-elevated text-ink',
    idle: 'border-line bg-chrome/20 text-ink-muted',
  },
  concluido: {
    Icon: CircleDashed,
    active: 'border-line bg-elevated text-ink',
    idle: 'border-line bg-chrome/20 text-ink-muted',
  },
}

function scrollToBucket(bucket: DueBucket)
{
  document.getElementById(`due-section-${bucket}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function DueBucketMap({ counts }: DueBucketMapProps)
{
  const visible = NAV_BUCKETS.filter((b) => b !== 'proxima_semana' || counts[b] > 0)

  return (
    <nav
      className="sticky top-0 z-10 px-2 sm:px-3 py-2 border-b border-line bg-card/95 backdrop-blur-sm"
      aria-label="Ir para faixa de prazo"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {visible.map((bucket) =>
        {
          const ui = BUCKET_CHIP[bucket]
          const Icon = ui.Icon
          const count = counts[bucket]
          const hasItems = count > 0
          const label = BUCKET_SHORT[bucket] ?? DUE_BUCKET_LABELS[bucket]

          return (
            <button
              key={bucket}
              type="button"
              onClick={() => scrollToBucket(bucket)}
              className={`inline-flex items-center justify-between gap-1 w-full min-w-0 px-2 py-1.5 rounded-sl border font-mono text-[10px] uppercase tracking-wide transition-colors hover:opacity-90 ${
                hasItems ? ui.active : ui.idle
              }`}
            >
              <span className="inline-flex items-center gap-1 min-w-0">
                <Icon className="w-3 h-3 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{label}</span>
              </span>
              <span className="font-display text-sm tabular-nums leading-none shrink-0">{count}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
