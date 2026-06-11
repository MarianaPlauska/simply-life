import { urgencyScoreClass } from '../../lib/kanbanVisual'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Fila lateral — ranking de Hoje (densidade Superhuman dentro do board)

interface KanbanFocusQueueProps
{
  tasks: TarefaUnificada[]
  selectedId: number | null
  executingId: number | null
  onSelect: (id: number) => void
  onOpen: (task: TarefaUnificada) => void
}

export function KanbanFocusQueue({
  tasks,
  selectedId,
  executingId,
  onSelect,
  onOpen,
}: KanbanFocusQueueProps)
{
  if (tasks.length === 0)
  {
    return (
      <aside className="hidden xl:flex flex-col w-[220px] shrink-0 border border-line rounded-sl bg-card overflow-hidden">
        <header className="px-3 py-3 border-b border-line">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Fila hoje
          </p>
        </header>
        <p className="px-3 py-6 font-mono text-[11px] text-ink-muted leading-relaxed">
          Sem demandas em Hoje. Recalcule prioridades ou arraste do backlog.
        </p>
      </aside>
    )
  }

  return (
    <aside className="hidden xl:flex flex-col w-[220px] shrink-0 border border-line rounded-sl bg-card overflow-hidden">
      <header className="px-3 py-3 border-b border-line shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Fila hoje
        </p>
        <p className="font-mono text-[10px] text-ink-muted mt-0.5 tabular-nums">
          {tasks.length} ordenada{tasks.length !== 1 ? 's' : ''}
        </p>
      </header>

      <ol className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-line">
        {tasks.map((t, idx) =>
        {
          const score = t.score_urgencia ?? 0
          const selected = selectedId === t.id
          const executing = executingId === t.id

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                onDoubleClick={() => onOpen(t)}
                className={[
                  'w-full text-left px-3 py-2.5 transition-colors',
                  selected
                    ? 'bg-accent-muted border-l-2 border-l-accent'
                    : 'border-l-2 border-l-transparent hover:bg-chrome',
                  executing ? 'ring-1 ring-inset ring-accent/30' : '',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] text-ink-muted tabular-nums w-5 shrink-0 pt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] leading-snug line-clamp-2 text-ink">
                      {cleanTitleForDisplay(t.titulo)}
                    </p>
                    <p className={`font-mono text-[10px] tabular-nums mt-1 ${urgencyScoreClass(score)}`}>
                      {score} pts
                      {executing && (
                        <span className="text-accent ml-1.5 uppercase text-[9px]">foco</span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
