import { CalendarDays, CalendarRange, CircleDashed, Sun } from 'lucide-react'
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
  vencido: 'Passou',
  hoje: 'Hoje',
  esta_semana: 'Semana',
  proxima_semana: 'Próx.',
  sem_prazo: 'Sem data',
}

const BUCKET_CHIP: Record<DueBucket, { Icon: typeof Sun; active: string; idle: string }> = {
  vencido: {
    Icon: CalendarDays,
    active: 'border-white/10 bg-zinc-800/70 text-zinc-300',
    idle: 'border-white/[0.04] bg-zinc-900/30 text-zinc-500',
  },
  hoje: {
    Icon: Sun,
    active: 'border-white/10 bg-zinc-800/70 text-amber-300/90',
    idle: 'border-white/[0.04] bg-zinc-900/30 text-zinc-500',
  },
  esta_semana: {
    Icon: CalendarDays,
    active: 'border-white/10 bg-zinc-800/70 text-zinc-300',
    idle: 'border-white/[0.04] bg-zinc-900/30 text-zinc-500',
  },
  proxima_semana: {
    Icon: CalendarRange,
    active: 'border-white/10 bg-zinc-800/70 text-zinc-300',
    idle: 'border-white/[0.04] bg-zinc-900/30 text-zinc-500',
  },
  sem_prazo: {
    Icon: CircleDashed,
    active: 'border-white/10 bg-zinc-800/70 text-zinc-300',
    idle: 'border-white/[0.04] bg-zinc-900/30 text-zinc-500',
  },
  concluido: {
    Icon: CircleDashed,
    active: 'border-white/10 bg-zinc-800/70 text-zinc-300',
    idle: 'border-white/[0.04] bg-zinc-900/30 text-zinc-500',
  },
}

function scrollToBucket(bucket: DueBucket)
{
  document.getElementById(`due-section-${bucket}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function DueBucketMap({ counts }: DueBucketMapProps)
{
  // mostra somente faixas que realmente têm tarefas: evita transformar a navegação em um painel de status
  const visible = NAV_BUCKETS.filter((bucket) => counts[bucket] > 0)

  if (visible.length === 0)
  {
    return null
  }

  return (
    <nav
      className="sticky top-0 z-10 px-2 py-1.5 border-b border-white/[0.04] bg-card/95 backdrop-blur-sm"
      aria-label="Ir para faixa de prazo"
    >
      <div className="flex gap-1 overflow-x-auto pb-px custom-scrollbar-x">
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
              className={`inline-flex shrink-0 items-center justify-between gap-1 min-w-[5.5rem] px-2 py-1.5 rounded-md border font-mono text-ui-caption uppercase tracking-wide transition-colors hover:opacity-90 ${
                hasItems ? ui.active : ui.idle
              }`}
            >
              <span className="inline-flex items-center gap-1 min-w-0">
                <Icon className="w-3 h-3 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{label}</span>
              </span>
              <span className="font-mono text-xs tabular-nums leading-none shrink-0">{count}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
