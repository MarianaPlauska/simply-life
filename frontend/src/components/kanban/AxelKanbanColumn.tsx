import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TemporalHorizon } from '../../lib/temporalHorizon'
import {
  AXEL_KANBAN_COLUMN,
  AXEL_KANBAN_COLUMN_EMBEDDED,
} from '../../constants/axelKanbanTheme'
import { WIP_HOJE_BOARD } from '../../lib/kanbanVisual'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface AxelKanbanColumnProps
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
  hoje: WIP_HOJE_BOARD,
}

export function AxelKanbanColumn({
  id,
  title,
  count,
  children,
  onAddTask,
  embedded = false,
  isEmpty = false,
}: AxelKanbanColumnProps)
{
  const { setNodeRef, isOver } = useDroppable({ id })
  const wip = WIP_HINT[id]
  const overWip = wip != null && count > wip

  const shellClass = embedded
    ? `${AXEL_KANBAN_COLUMN_EMBEDDED} ${isOver ? 'bg-accent-muted/20' : ''}`
    : `${AXEL_KANBAN_COLUMN} ${isOver ? 'bg-accent-muted/30' : ''}`

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`kanban-col-${id}`}
      className={`flex flex-col min-w-0 ${shellClass}`}
    >
      <header
        id={`kanban-col-${id}`}
        className={`shrink-0 ${embedded ? 'px-1 pt-3 pb-2' : 'mb-2 pb-2'} border-b border-line`}
      >
        <div className="flex items-center gap-2">
              <h2 className={`font-sans text-[15px] font-semibold tracking-tight truncate ${AXEL_TEXT_PRIMARY}`}>
                {title}
              </h2>
              <span
                className={`text-[13px] tabular-nums font-medium shrink-0 ml-auto ${
                  overWip ? 'text-atencao' : AXEL_TEXT_SECONDARY
                }`}
              >
                {count}{wip != null ? ` / ${wip}` : ''}
              </span>
            </div>
      </header>

      <div
        className={`flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar ${
          embedded ? 'px-1 py-2' : 'pr-0.5'
        }`}
      >
        {isEmpty ? (
          <div
            className={`px-1 py-2 text-left ${
              isOver ? 'text-ink' : AXEL_TEXT_SECONDARY
            }`}
          >
            <p className="text-[13px] font-medium">
              {isOver ? 'Soltar aqui' : 'Nada aqui'}
            </p>
            <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {onAddTask ? 'Adicione uma tarefa' : 'Arraste para cá'}
            </p>
          </div>
        ) : (
          children
        )}
      </div>

      {onAddTask && (
        <footer className={`shrink-0 ${embedded ? 'px-2 pb-2' : 'pt-1'}`}>
          <button
            type="button"
            onClick={onAddTask}
            className="w-full inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-sl text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-chrome transition-colors"
          >
            <Plus size={15} strokeWidth={1.75} />
            Adicionar tarefa
          </button>
        </footer>
      )}
    </section>
  )
}
