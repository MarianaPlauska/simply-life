import { AlertTriangle, CalendarDays, CalendarRange, CircleDashed, Sun } from 'lucide-react'
import {
  DUE_BUCKET_HINTS,
  DUE_BUCKET_LABELS,
  type DueBucket,
} from '../../lib/dueBucket'

// Mapa visual das faixas de prazo — o usuário entende o quadro antes de rolar

interface DueBucketMapProps
{
  counts: Record<DueBucket, number>
}

const MAP_BUCKETS: DueBucket[] = [
  'vencido',
  'hoje',
  'esta_semana',
  'proxima_semana',
  'sem_prazo',
]

const BUCKET_UI: Record<DueBucket, {
  Icon: typeof Sun
  short: string
  border: string
  bg: string
  iconClass: string
}> = {
  vencido: {
    Icon: AlertTriangle,
    short: 'Atrasadas',
    border: 'border-urgente/50',
    bg: 'bg-urgente/10',
    iconClass: 'text-urgente',
  },
  hoje: {
    Icon: Sun,
    short: 'Hoje',
    border: 'border-atencao/50',
    bg: 'bg-atencao/10',
    iconClass: 'text-atencao',
  },
  esta_semana: {
    Icon: CalendarDays,
    short: 'Esta semana',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    iconClass: 'text-sky-400',
  },
  proxima_semana: {
    Icon: CalendarRange,
    short: 'Depois',
    border: 'border-line',
    bg: 'bg-chrome/30',
    iconClass: 'text-ink-muted',
  },
  sem_prazo: {
    Icon: CircleDashed,
    short: 'Sem prazo',
    border: 'border-line',
    bg: 'bg-chrome/20',
    iconClass: 'text-ink-muted',
  },
  concluido: {
    Icon: CircleDashed,
    short: 'Feitas',
    border: 'border-line',
    bg: 'bg-chrome/20',
    iconClass: 'text-concluido',
  },
}

function scrollToBucket(bucket: DueBucket)
{
  document.getElementById(`due-section-${bucket}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function DueBucketMap({ counts }: DueBucketMapProps)
{
  const visible = MAP_BUCKETS.filter((b) => b !== 'proxima_semana' || counts[b] > 0)

  return (
    <div className="px-4 py-3 border-b border-line bg-gradient-to-b from-chrome/25 to-transparent space-y-3">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
          Mapa de prazos
        </p>
        <p className="text-[11px] text-ink-muted mt-1 leading-relaxed max-w-2xl">
          <strong className="font-medium text-ink">Quando vence</strong> — clique para ir à faixa.
          Faixas vazias ficam só no mapa. Listas longas mostram &quot;ver mais&quot;.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {visible.map((bucket) =>
        {
          const ui = BUCKET_UI[bucket]
          const Icon = ui.Icon
          const count = counts[bucket]

          return (
            <button
              key={bucket}
              type="button"
              onClick={() => scrollToBucket(bucket)}
              className={`text-left p-2.5 rounded-sl border transition-all hover:scale-[1.02] active:scale-[0.98] ${ui.border} ${ui.bg} ${
                count > 0 ? 'ring-1 ring-inset ring-white/5' : 'opacity-80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 shrink-0 ${ui.iconClass}`} strokeWidth={1.75} />
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink truncate">
                  {ui.short}
                </span>
                <span className={`ml-auto font-display text-lg tabular-nums leading-none ${
                  count > 0 && bucket === 'vencido' ? 'text-urgente' : 'text-ink'
                }`}>
                  {count}
                </span>
              </div>
              <p className="text-[10px] text-ink-muted leading-snug line-clamp-2">
                {DUE_BUCKET_HINTS[bucket]}
              </p>
              <p className="font-mono text-[9px] text-ink-muted/70 mt-1 truncate">
                {DUE_BUCKET_LABELS[bucket]}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
