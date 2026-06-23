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
  DUE_BUCKET_LABELS,
  DUE_BUCKET_META,
  dueBucketDropId,
  isDueBucketDropTarget,
  type DueBucket,
} from '../../lib/dueBucket'
import { AXEL_KANBAN_DROPZONE } from '../../constants/axelKanbanTheme'
import { AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

interface DueBucketSectionProps
{
  bucket: DueBucket
  count: number
  children: ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const TONE_CLASS: Record<string, string> = {
  urgente: 'text-red-300/90 border-white/[0.04] bg-zinc-900/40',
  atencao: 'text-amber-300/90 border-white/[0.04] bg-zinc-900/40',
  accent: 'text-zinc-300 border-white/[0.04] bg-zinc-900/40',
  muted: 'text-zinc-500 border-white/[0.04] bg-zinc-900/30',
}

const BUCKET_ICON: Record<DueBucket, typeof Sun> = {
  vencido: AlertTriangle,
  hoje: Sun,
  esta_semana: CalendarDays,
  proxima_semana: CalendarRange,
  sem_prazo: CircleDashed,
  concluido: CheckCircle2,
}

const SECTION_SHELL: Record<string, string> = {
  urgente: 'bg-zinc-900/20',
  atencao: 'bg-zinc-900/15',
  accent: 'bg-zinc-900/10',
  muted: 'bg-chrome/20',
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
  const shell = SECTION_SHELL[meta.tone] ?? SECTION_SHELL.muted
  const BucketIcon = BUCKET_ICON[bucket]
  const hidden = collapsible && collapsed

  return (
    <section
      id={`due-section-${bucket}`}
      ref={droppable ? setNodeRef : undefined}
      aria-labelledby={`due-bucket-${bucket}`}
      className={[
        'border-b border-white/[0.04] last:border-b-0 scroll-mt-12',
        shell,
        droppable && isOver ? 'ring-2 ring-inset ring-accent/30' : '',
      ].join(' ')}
    >
      <header
        id={`due-bucket-${bucket}`}
        className={`shrink-0 px-2.5 py-2 border-b border-white/[0.04] ${tone}`}
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
          <BucketIcon className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
          <h3 className={`flex-1 min-w-0 font-mono text-[11px] uppercase tracking-[0.1em] truncate ${AXEL_TEXT_PRIMARY}`}>
            {DUE_BUCKET_LABELS[bucket]}
          </h3>
          <span className={`font-display text-base tabular-nums shrink-0 ${AXEL_TEXT_PRIMARY}`}>
            {count}
          </span>
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
