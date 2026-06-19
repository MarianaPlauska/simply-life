import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ListOrdered, Minus, Plus, X } from 'lucide-react'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

interface ExecutionQueueEditorSheetProps
{
  open: boolean
  onClose: () => void
  queue: TarefaUnificada[]
  executingId: number | null
  candidates: TarefaUnificada[]
  onReorder: (orderedIds: number[]) => void
  onAdd: (task: TarefaUnificada) => void
  onRemove: (task: TarefaUnificada) => void
}

const WIP_LIMIT = 8

export function ExecutionQueueEditorSheet({
  open,
  onClose,
  queue,
  executingId,
  candidates,
  onReorder,
  onAdd,
  onRemove,
}: ExecutionQueueEditorSheetProps)
{
  const [localIds, setLocalIds] = useState<number[]>([])

  useEffect(() =>
  {
    if (open)
    {
      setLocalIds(queue.map((t) => t.id))
    }
    else
    {
      setLocalIds([])
    }
  }, [open, queue])

  const displayIds = localIds

  const ordered = useMemo(
    () => displayIds
      .map((id) => queue.find((t) => t.id === id) ?? candidates.find((t) => t.id === id))
      .filter((t): t is TarefaUnificada => !!t),
    [displayIds, queue, candidates],
  )

  if (!open)
  {
    return null
  }

  const syncClose = () =>
  {
    onClose()
  }

  const move = (taskId: number, direction: 'up' | 'down') =>
  {
    const ids = [...displayIds]
    const idx = ids.indexOf(taskId)
    if (idx < 0) return
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= ids.length) return
    ;[ids[idx], ids[swap]] = [ids[swap], ids[idx]]
    setLocalIds(ids)
    onReorder(ids)
  }

  const addTask = (task: TarefaUnificada) =>
  {
    if (displayIds.includes(task.id)) return
    if (displayIds.length >= WIP_LIMIT) return
    const ids = [...displayIds, task.id]
    setLocalIds(ids)
    onAdd(task)
    onReorder(ids)
  }

  const removeTask = (task: TarefaUnificada) =>
  {
    const ids = displayIds.filter((id) => id !== task.id)
    setLocalIds(ids)
    onRemove(task)
    onReorder(ids)
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Editar fila Executar agora"
    >
      <button type="button" className="absolute inset-0 bg-black/50" onClick={syncClose} aria-label="Fechar" />
      <div className="relative w-full sm:max-w-md max-h-[85dvh] overflow-hidden rounded-t-sl sm:rounded-sl border border-line bg-card shadow-xl flex flex-col">
        <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2 min-w-0">
            <ListOrdered size={16} className="text-accent shrink-0" />
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink truncate">
              Editar Executar agora
            </h2>
          </div>
          <button type="button" onClick={syncClose} className="p-2 rounded-sl text-ink-muted hover:text-ink" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <p className="text-[12px] text-ink-muted leading-relaxed">
            Reordene, remova ou adicione tarefas. Máximo {WIP_LIMIT} na fila.
          </p>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">
              Na fila ({ordered.length}/{WIP_LIMIT})
            </h3>
            {ordered.length === 0 ? (
              <p className="text-sm text-ink-muted py-2">Nenhuma tarefa — adicione abaixo.</p>
            ) : (
              <ul className="space-y-1.5">
                {ordered.map((t, idx) =>
                {
                  const executing = executingId === t.id
                  return (
                    <li
                      key={t.id}
                      className={`flex items-center gap-2 rounded-sl border px-2 py-2 ${
                        executing
                          ? 'border-accent bg-accent/15 ring-1 ring-accent/35'
                          : 'border-line bg-chrome/20'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-accent w-5 shrink-0 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-ink truncate">{cleanTitleForDisplay(t.titulo)}</p>
                        {executing && (
                          <p className="font-mono text-[9px] uppercase text-accent mt-0.5">Em foco agora</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => move(t.id, 'up')}
                          className="p-1.5 rounded-sl text-ink-muted hover:text-ink disabled:opacity-30"
                          aria-label="Subir"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === ordered.length - 1}
                          onClick={() => move(t.id, 'down')}
                          className="p-1.5 rounded-sl text-ink-muted hover:text-ink disabled:opacity-30"
                          aria-label="Descer"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTask(t)}
                          className="p-1.5 rounded-sl text-ink-muted hover:text-urgente"
                          aria-label="Remover da fila"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {candidates.length > 0 && ordered.length < WIP_LIMIT && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-2">
                Adicionar à fila
              </h3>
              <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {candidates.slice(0, 12).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => addTask(t)}
                      className="w-full flex items-center gap-2 text-left px-2 py-2 rounded-sl border border-line hover:bg-chrome/40 transition-colors"
                    >
                      <Plus size={14} className="text-accent shrink-0" />
                      <span className="text-[12px] text-ink truncate">{cleanTitleForDisplay(t.titulo)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
