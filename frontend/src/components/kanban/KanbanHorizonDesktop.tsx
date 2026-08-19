import { AxelKanbanCard } from './AxelKanbanCard'
import { AxelKanbanColumn } from './AxelKanbanColumn'
import { HORIZON_LABELS, type TemporalHorizon } from '../../lib/temporalHorizon'
import type { TarefaUnificada } from '../../types'

const HORIZONS: TemporalHorizon[] = ['hoje', 'semana', 'backlog']

interface KanbanHorizonDesktopProps
{
  columns: Record<TemporalHorizon, TarefaUnificada[]>
  allTasks: TarefaUnificada[]
  activeId: number | null
  onOpen: (task: TarefaUnificada) => void
  onAddTask: (horizon: TemporalHorizon) => void
}

export function KanbanHorizonDesktop({
  columns,
  allTasks,
  activeId,
  onOpen,
  onAddTask,
}: KanbanHorizonDesktopProps)
{
  return (
    <div
      className="hidden lg:flex flex-1 min-h-0 flex-row gap-4 w-full items-stretch overflow-x-auto pb-2 custom-scrollbar custom-scrollbar-x"
      role="region"
      aria-label="Quadro por horizonte"
    >
      {HORIZONS.map((horizon) =>
      {
        const items = columns[horizon].filter((t) => t.status !== 'concluida')
        const scoreSum = items.reduce((acc, t) => acc + (t.score_urgencia ?? 0), 0)

        return (
          <div
            key={horizon}
            className="w-full lg:w-1/3 lg:min-w-[300px] flex flex-col min-h-0 h-full"
          >
            <AxelKanbanColumn
              id={horizon}
              title={HORIZON_LABELS[horizon]}
              count={items.length}
              scoreSum={scoreSum}
              embedded
              emphasized={horizon === 'hoje'}
              isEmpty={items.length === 0}
              onAddTask={() => onAddTask(horizon)}
            >
              {items.map((tarefa) => (
                <AxelKanbanCard
                  key={tarefa.id}
                  tarefa={tarefa}
                  allTasks={allTasks}
                  columnHorizon={horizon}
                  isDragging={activeId === tarefa.id}
                  layout="checklist"
                  onOpen={() => onOpen(tarefa)}
                />
              ))}
            </AxelKanbanColumn>
          </div>
        )
      })}
    </div>
  )
}
