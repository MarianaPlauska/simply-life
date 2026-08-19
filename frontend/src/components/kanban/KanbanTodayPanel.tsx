import { useDroppable } from '@dnd-kit/core'
import { ListOrdered } from 'lucide-react'
import type { LoadBalanceEntry } from '../../lib/adaptiveOrchestration'
import { AXEL_KANBAN_DROPZONE, AXEL_KANBAN_EXEC_COLUMN } from '../../constants/axelKanbanTheme'
import { AXEL_STATUS_BADGE, AXEL_STATUS_BADGE_WARN } from '../../constants/axelSurfaces'
import { KanbanTaskDetailStrip } from './KanbanTaskDetailStrip'
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

const WIP_LIMIT = 8

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
        'border-b lg:border-b-0 lg:border-r border-white/[0.04] bg-chrome/20',
        isOver ? 'bg-accent-muted/25 ring-1 ring-inset ring-accent/30' : '',
      ].join(' ')}
    >
      <header
        id="kanban-today-panel"
        className="shrink-0 px-2.5 pt-2 pb-1.5 border-b border-white/[0.04] bg-chrome/30"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-sm font-semibold tracking-tight text-ink">
                Executar agora
              </h2>
              <span className={`font-mono text-[10px] tabular-nums ml-auto ${overWip ? AXEL_STATUS_BADGE_WARN : AXEL_STATUS_BADGE}`}>
                {totalCount} / {WIP_LIMIT}
              </span>
              <button
                type="button"
                onClick={onEditQueue}
                className="p-1 rounded-sl text-ink-muted hover:text-accent hover:bg-chrome shrink-0 transition-colors"
                aria-label="Editar fila Executar agora"
                title="Editar fila"
              >
                <ListOrdered size={14} strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-[11px] mt-0.5 leading-snug text-zinc-500 font-mono">
              Fila curta · máx. {WIP_LIMIT}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {isOrganizing ? (
          <div className="mx-2 my-1.5 px-2.5 py-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted animate-pulse">
              Organizando prioridades…
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className={`mx-2 my-1.5 px-2.5 py-3 text-center ${AXEL_KANBAN_DROPZONE} ${isOver ? 'border-accent/40 text-accent' : ''}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em]">
              {isOver ? 'Soltar aqui' : 'Nada priorizado'}
            </p>
            <p className="text-[11px] mt-1.5 leading-relaxed text-zinc-500 font-mono">
              Arraste da coluna Prazo → ou edite a fila pelo ícone acima
            </p>
            {onReorganize && !isOver && (
              <button
                type="button"
                onClick={onReorganize}
                className="mt-4 font-mono text-[10px] uppercase tracking-wide text-accent hover:underline"
              >
                AXEL montar fila
              </button>
            )}
          </div>
        ) : (
          <ol className="divide-y divide-white/[0.04]">
            {tasks.map((t, idx) =>
            {
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
                      'w-full text-left px-2.5 py-1.5 transition-colors',
                      executing
                        ? 'bg-accent/10 border-l-[2px] border-l-accent'
                        : selected
                          ? 'bg-accent/5 border-l-[2px] border-l-accent/70'
                          : 'border-l-[2px] border-l-transparent hover:bg-chrome/50 dark:hover:bg-zinc-800/30',
                      snoozed ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`font-mono text-[10px] tabular-nums w-5 shrink-0 ${
                        executing ? 'text-accent font-semibold' : 'text-accent'
                      }`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] leading-snug line-clamp-2 ${
                          executing ? 'text-accent font-medium' : 'text-ink'
                        }`}>
                          {cleanTitleForDisplay(t.titulo)}
                        </p>
                        <p className={`font-mono text-[9px] mt-0.5 uppercase tracking-wide ${
                          executing ? 'text-accent' : ''
                        }`}>
                          {executing ? (
                            <span className={AXEL_STATUS_BADGE_WARN}>Em foco</span>
                          ) : snoozed ? (
                            <span className={AXEL_STATUS_BADGE}>Adiada</span>
                          ) : (
                            <span className={AXEL_STATUS_BADGE}>Na fila</span>
                          )}
                        </p>
                        {selected && (t.urgency_reason ?? t.score_reason) && (
                          <p className="text-[10px] mt-1 leading-snug line-clamp-2 text-zinc-500 font-mono">
                            {t.urgency_reason ?? t.score_reason}
                          </p>
                        )}
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
        <p className="shrink-0 px-2.5 py-1 font-mono text-[11px] text-zinc-500 tabular-nums border-t border-white/[0.04]">
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
