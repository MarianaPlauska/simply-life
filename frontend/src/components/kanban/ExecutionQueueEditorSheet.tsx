import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ListOrdered, Minus, Plus, X } from 'lucide-react'
import { AXEL_STATUS_BADGE_WARN } from '../../constants/axelSurfaces'
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
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Editar fila Executar agora"
    >
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={syncClose} aria-label="Fechar" />
      <div
        className="relative w-full sm:max-w-md flex flex-col overflow-hidden rounded-t-xl sm:rounded-xl border border-white/[0.06] bg-card shadow-2xl max-h-[min(72dvh,calc(100dvh-6rem))] sm:max-h-[85dvh] mb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:mb-0"
      >
        <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.04] bg-chrome/30">
          <div className="flex items-center gap-2 min-w-0">
            <ListOrdered size={16} className="text-accent shrink-0" strokeWidth={1.75} />
            <h2 className="font-sans text-sm font-semibold tracking-tight text-ink truncate">
              Editar fila
            </h2>
          </div>
          <button
            type="button"
            onClick={syncClose}
            className="p-2 rounded-md text-zinc-500 hover:text-ink hover:bg-chrome min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3 space-y-4">
          <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
            Reordene, remova ou adicione tarefas. Máximo {WIP_LIMIT} na fila.
          </p>

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Na fila ({ordered.length}/{WIP_LIMIT})
            </h3>
            {ordered.length === 0 ? (
              <p className="text-sm text-zinc-500 py-2">Nenhuma tarefa - adicione abaixo.</p>
            ) : (
              <ul className="space-y-2">
                {ordered.map((t, idx) =>
                {
                  const executing = executingId === t.id
                  return (
                    <li
                      key={t.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2.5 ${
                        executing
                          ? 'border-accent/30 bg-accent/10'
                          : 'border-white/[0.05] bg-chrome/30'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-zinc-500 w-5 shrink-0 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-ink leading-snug line-clamp-2">
                          {cleanTitleForDisplay(t.titulo)}
                        </p>
                        {executing && (
                          <span className={`${AXEL_STATUS_BADGE_WARN} mt-1`}>Em foco</span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => move(t.id, 'up')}
                          className="p-2 rounded-md text-zinc-500 hover:text-ink hover:bg-chrome disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          aria-label="Subir"
                        >
                          <ChevronUp size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === ordered.length - 1}
                          onClick={() => move(t.id, 'down')}
                          className="p-2 rounded-md text-zinc-500 hover:text-ink hover:bg-chrome disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          aria-label="Descer"
                        >
                          <ChevronDown size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTask(t)}
                          className="p-2 rounded-md text-zinc-500 hover:text-urgente hover:bg-chrome min-w-[36px] min-h-[36px] flex items-center justify-center"
                          aria-label="Remover da fila"
                        >
                          <Minus size={16} strokeWidth={1.75} />
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
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                Adicionar à fila
              </h3>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {candidates.slice(0, 12).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => addTask(t)}
                      className="w-full flex items-center gap-2 text-left px-2.5 py-2.5 rounded-lg border border-white/[0.05] hover:bg-chrome/50 transition-colors min-h-[44px]"
                    >
                      <Plus size={14} className="text-accent shrink-0" strokeWidth={1.75} />
                      <span className="text-[13px] text-ink line-clamp-2">{cleanTitleForDisplay(t.titulo)}</span>
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
