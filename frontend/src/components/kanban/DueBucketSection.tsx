import { useDroppable } from '@dnd-kit/core'
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Sun,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  DUE_BUCKET_HINTS,
  DUE_BUCKET_LABELS,
  DUE_BUCKET_META,
  dueBucketDropId,
  isDueBucketDropTarget,
  type DueBucket,
} from '../../lib/dueBucket'
import { AXEL_KANBAN_DROPZONE } from '../../constants/axelKanbanTheme'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface DueBucketSectionProps
{
  bucket: DueBucket
  count: number
  children: ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const TONE_CLASS: Record<string, string> = {
  urgente: 'text-urgente border-urgente/40 bg-urgente/5',
  atencao: 'text-atencao border-atencao/40 bg-atencao/5',
  accent: 'text-sky-400 border-sky-500/30 bg-sky-500/5',
  muted: 'text-ink-muted border-line bg-chrome/15',
}

const BUCKET_ICON: Record<DueBucket, typeof Sun> = {
  vencido: AlertTriangle,
  hoje: Sun,
  esta_semana: CalendarDays,
  proxima_semana: CalendarRange,
  sem_prazo: CircleDashed,
  concluido: CheckCircle2,
}

const STRIPE_CLASS: Record<string, string> = {
  urgente: 'border-l-urgente',
  atencao: 'border-l-atencao',
  accent: 'border-l-sky-500',
  muted: 'border-l-line',
}

export function DueBucketSection({
  bucket,
  count,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: DueBucketSectionProps)
{
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const droppable = isDueBucketDropTarget(bucket)
  const { setNodeRef, isOver } = useDroppable({
    id: dueBucketDropId(bucket),
    disabled: !droppable,
  })

  const meta = DUE_BUCKET_META[bucket]
  const tone = TONE_CLASS[meta.tone] ?? TONE_CLASS.muted
  const stripe = STRIPE_CLASS[meta.tone] ?? STRIPE_CLASS.muted
  const BucketIcon = BUCKET_ICON[bucket]
  const hidden = collapsible && collapsed

  return (
    <section
      id={`due-section-${bucket}`}
      ref={droppable ? setNodeRef : undefined}
      aria-labelledby={`due-bucket-${bucket}`}
      className={[
        'border-b border-line last:border-b-0 scroll-mt-2 border-l-4',
        stripe,
        droppable && isOver ? 'bg-accent-muted/20 ring-1 ring-inset ring-accent/25' : '',
      ].join(' ')}
    >
      <header
        id={`due-bucket-${bucket}`}
        className={`shrink-0 px-3 py-2 border-b border-line/70 ${tone}`}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-0.5 rounded hover:bg-chrome/60 text-ink-muted shrink-0"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expandir seção' : 'Recolher seção'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <BucketIcon className="w-4 h-4 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink-muted/80 shrink-0">
                {meta.index}
              </span>
              <h3 className={`font-mono text-[11px] uppercase tracking-[0.12em] truncate ${AXEL_TEXT_PRIMARY}`}>
                {DUE_BUCKET_LABELS[bucket]}
              </h3>
              <span className={`font-mono text-[11px] tabular-nums shrink-0 ml-auto ${AXEL_TEXT_SECONDARY}`}>
                {count}
              </span>
            </div>
            {!hidden && count > 0 && (
              <p className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${AXEL_TEXT_SECONDARY}`}>
                {DUE_BUCKET_HINTS[bucket]}
              </p>
            )}
          </div>
        </div>
      </header>

      {!hidden && (
        <div
          className={[
            'px-3 py-2 space-y-2 min-h-[48px]',
            count === 0 ? AXEL_KANBAN_DROPZONE : '',
          ].join(' ')}
        >
          {children}
        </div>
      )}
    </section>
  )
}
