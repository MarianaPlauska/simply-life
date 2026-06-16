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

const SECTION_SHELL: Record<string, string> = {
  urgente: 'bg-urgente/[0.04]',
  atencao: 'bg-atencao/[0.04]',
  accent: 'bg-sky-500/[0.04]',
  muted: 'bg-chrome/30',
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
        'border-b border-line last:border-b-0 scroll-mt-12',
        shell,
        droppable && isOver ? 'ring-2 ring-inset ring-accent/30' : '',
      ].join(' ')}
    >
      <header
        id={`due-bucket-${bucket}`}
        className={`shrink-0 px-3 py-2.5 border-b border-line/60 ${tone}`}
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
