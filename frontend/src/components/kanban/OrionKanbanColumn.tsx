import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TemporalHorizon } from '../../lib/temporalHorizon'
import {
  ORION_KANBAN_COLUMN,
  ORION_KANBAN_COLUMN_DIVIDER,
  ORION_KANBAN_COLUMN_EMBEDDED,
  ORION_KANBAN_DROPZONE,
} from '../../constants/orionKanbanTheme'
import { COLUMN_META } from '../../lib/kanbanVisual'
import { ORION_TEXT_PRIMARY, ORION_TEXT_SECONDARY } from '../../constants/orionSurfaces'

interface OrionKanbanColumnProps
{
  id: TemporalHorizon
  title: string
  count: number
  scoreSum?: number
  children: ReactNode
  onAddTask?: () => void
  embedded?: boolean
  isEmpty?: boolean
  emphasized?: boolean
}

const WIP_HINT: Partial<Record<TemporalHorizon, number>> = {
  hoje: 8,
}

export function OrionKanbanColumn({
  id,
  title,
  count,
  scoreSum = 0,
  children,
  onAddTask,
  embedded = false,
  isEmpty = false,
  emphasized = false,
}: OrionKanbanColumnProps)
{
  const { setNodeRef, isOver } = useDroppable({ id })
  const wip = WIP_HINT[id]
  const overWip = wip != null && count > wip
  const meta = COLUMN_META[id]

  const shellClass = embedded
    ? `${ORION_KANBAN_COLUMN_EMBEDDED} ${ORION_KANBAN_COLUMN_DIVIDER} ${isOver ? 'bg-accent-muted/20' : ''} ${emphasized ? 'bg-chrome/25' : ''}`
    : `${ORION_KANBAN_COLUMN} p-2 min-h-[320px] flex-1 ${isOver ? 'bg-accent-muted/30 border-accent/30' : ''}`

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`kanban-col-${id}`}
      className={`flex flex-col min-w-0 w-full h-full ${shellClass}`}
    >
      <header
        id={`kanban-col-${id}`}
        className={`shrink-0 ${embedded ? 'px-4 pt-4 pb-3' : 'mb-2 pb-2'} border-b border-line ${emphasized ? 'border-t-2 border-t-accent' : ''}`}
      >
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] text-accent tabular-nums pt-0.5 shrink-0">
            {meta.index}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className={`font-mono text-[10px] uppercase tracking-[0.14em] truncate ${ORION_TEXT_PRIMARY}`}>
                {title}
              </h2>
              <span
                className={`font-mono text-[11px] tabular-nums shrink-0 ml-auto ${
                  overWip ? 'text-atencao' : ORION_TEXT_SECONDARY
                }`}
              >
                {count}{wip != null ? ` / ${wip}` : ''}
              </span>
              {onAddTask && (
                <button
                  type="button"
                  onClick={onAddTask}
                  className="p-1 rounded-sl text-ink-muted hover:text-accent hover:bg-chrome shrink-0 transition-colors -mr-1"
                  aria-label={`Nova tarefa em ${title}`}
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
            <p className={`font-mono text-[10px] mt-1 ${ORION_TEXT_SECONDARY}`}>
              {meta.subtitle}
            </p>
          </div>
        </div>
      </header>

      <div
        className={`flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar ${
          embedded ? 'px-3 py-3' : 'pr-0.5'
        }`}
      >
        {isEmpty ? (
          <div
            className={`flex flex-col items-center justify-center flex-1 min-h-[120px] px-4 py-8 text-center ${ORION_KANBAN_DROPZONE} ${
              isOver ? 'border-accent/50 bg-accent-muted/15 text-accent' : ''
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em]">
              {isOver ? 'Soltar aqui' : 'Coluna vazia'}
            </p>
            <p className={`text-[11px] mt-1.5 max-w-[200px] ${ORION_TEXT_SECONDARY}`}>
              Arraste uma demanda ou use + para criar
            </p>
          </div>
        ) : (
          children
        )}
      </div>

      {count > 0 && (
        <footer
          className={`shrink-0 border-t border-line font-mono text-[10px] tabular-nums ${
            embedded ? 'px-4 py-2' : 'pt-2 mt-1'
          } ${ORION_TEXT_SECONDARY}`}
        >
          Σ {scoreSum} pts
        </footer>
      )}
    </section>
  )
}
