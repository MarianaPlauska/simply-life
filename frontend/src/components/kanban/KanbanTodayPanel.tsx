import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { LoadBalanceEntry } from '../../lib/adaptiveOrchestration'
import { COLUMN_META, urgencyScoreClass } from '../../lib/kanbanVisual'
import { ORION_KANBAN_DROPZONE } from '../../constants/orionKanbanTheme'
import { ORION_TEXT_PRIMARY, ORION_TEXT_SECONDARY } from '../../constants/orionSurfaces'
import { KanbanTaskDetailStrip } from './KanbanTaskDetailStrip'
import { cleanTitleForDisplay } from './orionKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Painel Hoje — fila + detalhe (sem duplicar coluna no board)

interface KanbanTodayPanelProps
{
  tasks: TarefaUnificada[]
  totalCount: number
  selectedId: number | null
  selectedTask: TarefaUnificada | null
  executingId: number | null
  loadBalance?: Map<number, LoadBalanceEntry>
  isExecuting: boolean
  onSelect: (id: number) => void
  onOpen: (task: TarefaUnificada) => void
  onExecute: () => void
  onAddTask: () => void
}

const WIP_LIMIT = 8

export function KanbanTodayPanel({
  tasks,
  totalCount,
  selectedId,
  selectedTask,
  executingId,
  loadBalance,
  isExecuting,
  onSelect,
  onOpen,
  onExecute,
  onAddTask,
}: KanbanTodayPanelProps)
{
  const { setNodeRef, isOver } = useDroppable({ id: 'hoje' })
  const meta = COLUMN_META.hoje
  const overWip = totalCount > WIP_LIMIT
  const scoreSum = tasks.reduce((s, t) => s + (t.score_urgencia ?? 0), 0)

  return (
    <section
      ref={setNodeRef}
      aria-labelledby="kanban-today-panel"
      className={[
        'flex flex-col w-full lg:w-[min(100%,340px)] lg:shrink-0 lg:max-w-[360px]',
        'border-b lg:border-b-0 lg:border-r border-line bg-chrome/20 min-h-[280px] lg:min-h-0',
        isOver ? 'bg-accent-muted/25 ring-1 ring-inset ring-accent/30' : '',
      ].join(' ')}
    >
      <header
        id="kanban-today-panel"
        className="shrink-0 px-4 pt-4 pb-3 border-b border-line border-t-2 border-t-accent"
      >
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] text-accent tabular-nums pt-0.5">{meta.index}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className={`font-mono text-[10px] uppercase tracking-[0.14em] ${ORION_TEXT_PRIMARY}`}>
                Hoje
              </h2>
              <span className={`font-mono text-[11px] tabular-nums ml-auto ${overWip ? 'text-atencao' : ORION_TEXT_SECONDARY}`}>
                {totalCount} / {WIP_LIMIT}
              </span>
              <button
                type="button"
                onClick={onAddTask}
                className="p-1 rounded-sl text-ink-muted hover:text-accent hover:bg-chrome shrink-0 transition-colors"
                aria-label="Nova tarefa em Hoje"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <p className={`font-mono text-[10px] mt-1 ${ORION_TEXT_SECONDARY}`}>{meta.subtitle}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-[160px] max-h-[320px] lg:max-h-none overflow-y-auto custom-scrollbar">
        {tasks.length === 0 ? (
          <div className={`mx-3 my-3 px-4 py-8 text-center ${ORION_KANBAN_DROPZONE} ${isOver ? 'border-accent/50 text-accent' : ''}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em]">
              {isOver ? 'Soltar em Hoje' : 'Fila vazia'}
            </p>
            <p className={`text-[11px] mt-2 ${ORION_TEXT_SECONDARY}`}>
              Arraste de Semana ou Backlog
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-line">
            {tasks.map((t, idx) =>
            {
              const score = t.score_urgencia ?? 0
              const selected = selectedId === t.id
              const executing = executingId === t.id
              const snoozed = loadBalance?.get(t.id)?.snoozed

              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(t.id)}
                    onDoubleClick={() => onOpen(t)}
                    className={[
                      'w-full text-left px-4 py-3 transition-colors',
                      selected
                        ? 'bg-accent-muted/50 border-l-[3px] border-l-accent'
                        : 'border-l-[3px] border-l-transparent hover:bg-chrome/60',
                      snoozed ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] text-accent tabular-nums w-5 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] leading-snug line-clamp-2 text-ink">
                          {cleanTitleForDisplay(t.titulo)}
                        </p>
                        <p className={`font-mono text-[10px] tabular-nums mt-1 ${urgencyScoreClass(score)}`}>
                          {score} pts
                          {executing && (
                            <span className="text-accent ml-2 uppercase text-[9px]">em foco</span>
                          )}
                          {snoozed && (
                            <span className="text-ink-muted ml-2 uppercase text-[9px]">adiada</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {tasks.length > 0 && (
        <p className={`shrink-0 px-4 py-1.5 font-mono text-[10px] tabular-nums border-t border-line ${ORION_TEXT_SECONDARY}`}>
          Σ {scoreSum} pts na fila ativa
        </p>
      )}

      <KanbanTaskDetailStrip
        task={selectedTask}
        isExecuting={isExecuting}
        onExecute={onExecute}
        onOpen={() => selectedTask && onOpen(selectedTask)}
      />
    </section>
  )
}
