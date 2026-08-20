import { useDroppable } from '@dnd-kit/core'
import { ListOrdered } from 'lucide-react'
import type { LoadBalanceEntry } from '../../lib/adaptiveOrchestration'
import { AXEL_KANBAN_EXEC_COLUMN } from '../../constants/axelKanbanTheme'
import { WIP_HOJE_EXEC, checklistRingClass, urgencyHairlineClass } from '../../lib/kanbanVisual'
import { KanbanTaskDetailStrip } from './KanbanTaskDetailStrip'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Painel Hoje — fila + detalhe (sem duplicar coluna no board)

interface KanbanTodayPanelProps
{
  tasks: TarefaUnificada[]
  totalCount: number
  isOrganizing?: boolean
  selectedId: number | null
  selectedTask: TarefaUnificada | null
  executingId: number | null
  loadBalance?: Map<number, LoadBalanceEntry>
  isExecuting: boolean
  onSelect: (id: number) => void
  onOpen: (task: TarefaUnificada) => void
  onExecute: () => void
  onEditQueue: () => void
  onReorganize?: () => void
}

const WIP_LIMIT = WIP_HOJE_EXEC

export function KanbanTodayPanel({
  tasks,
  totalCount,
  isOrganizing = false,
  selectedId,
  selectedTask,
  executingId,
  loadBalance,
  isExecuting,
  onSelect,
  onOpen,
  onExecute,
  onEditQueue,
  onReorganize,
}: KanbanTodayPanelProps)
{
  const { setNodeRef, isOver } = useDroppable({ id: 'hoje' })
  const overWip = totalCount > WIP_LIMIT

  return (
    <section
      ref={setNodeRef}
      aria-labelledby="kanban-today-panel"
      className={[
        'flex flex-col w-full min-h-0 overflow-hidden lg:flex-1 lg:min-h-0 lg:h-full',
        AXEL_KANBAN_EXEC_COLUMN,
        isOver ? 'bg-accent-muted/20' : '',
      ].join(' ')}
    >
      <header
        id="kanban-today-panel"
        className="shrink-0 px-3 pt-3 pb-2 border-b border-line"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-[15px] font-semibold tracking-tight text-ink">
                Hoje
              </h2>
              <span className={`text-[13px] tabular-nums font-medium ml-auto ${overWip ? 'text-atencao' : 'text-ink-muted'}`}>
                {totalCount} / {WIP_LIMIT}
              </span>
              <button
                type="button"
                onClick={onEditQueue}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] -mr-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome shrink-0 transition-colors"
                aria-label="Editar lista de hoje"
                title="Editar fila"
              >
                <ListOrdered size={16} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-[12px] mt-0.5 leading-snug text-ink-muted">
              O que você faz agora
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {isOrganizing ? (
          <div className="mx-2 my-1.5 px-2.5 py-4 text-center">
            <p className="text-[13px] font-medium text-ink-muted animate-pulse">
              Organizando prioridades…
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="mx-2 my-1.5 px-2.5 py-3 text-center text-ink-muted">
            <p className="text-[13px] font-medium">
              {isOver ? 'Soltar aqui' : 'Nada para hoje'}
            </p>
            <p className="text-[12px] mt-1.5 leading-relaxed">
              Toque em Nova tarefa ou abra Todas
            </p>
            {onReorganize && !isOver && (
              <button
                type="button"
                onClick={onReorganize}
                className="mt-2 min-h-[44px] px-3 text-[13px] font-semibold text-ink hover:bg-chrome rounded-sl"
              >
                AXEL montar fila
              </button>
            )}
          </div>
        ) : (
          <ol>
            {tasks.map((t) =>
            {
              const selected = selectedId === t.id
              const executing = executingId === t.id
              const snoozed = loadBalance?.get(t.id)?.snoozed
              const score = t.score_urgencia ?? 0

              return (
                <li key={t.id}>
                  <div
                    className={[
                      'relative flex items-center gap-2.5 w-full px-3 py-2 min-h-12',
                      executing || selected ? 'bg-chrome/60' : '',
                      snoozed ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    {score > 70 && (
                      <span
                        aria-hidden
                        className={`absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full ${urgencyHairlineClass(score)}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => void axelCompleteTask(t)}
                      className={`shrink-0 w-6 h-6 rounded-full border-2 ${checklistRingClass(score)}`}
                      aria-label="Concluir tarefa"
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(t.id)}
                      onDoubleClick={() => onOpen(t)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-[14px] leading-snug line-clamp-2 text-ink font-medium">
                        {cleanTitleForDisplay(t.titulo)}
                      </p>
                      <p className="text-[12px] mt-0.5 text-ink-muted">
                        {executing ? 'Foco' : snoozed ? 'Adiada' : 'Na fila'}
                      </p>
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {tasks.length > 0 && (
        <p className="shrink-0 px-3 py-2 text-[12px] text-ink-muted tabular-nums border-t border-line">
          {tasks.length} na fila ativa
        </p>
      )}

      {tasks.length > 0 && selectedTask && (
        <KanbanTaskDetailStrip
          task={selectedTask}
          isExecuting={isExecuting}
          onExecute={onExecute}
          onOpen={() => onOpen(selectedTask)}
          compact
        />
      )}
    </section>
  )
}
