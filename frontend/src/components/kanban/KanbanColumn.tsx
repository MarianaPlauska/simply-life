import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Plus, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTaskStore } from '../../store/useTaskStore'

// Coluna do Kanban - padrão "data container plano" (§2.2 / §2.4)
// Sem sombras, sem bordas grossas, header minimalista colado ao fundo

interface KanbanColumnProps
{
  id: string
  title: string
  count: number
  wipLimit: number
  dotColor: string
  children: ReactNode
  flat?: boolean
}

export function KanbanColumn({ id, title, count, wipLimit, dotColor, children, flat }: KanbanColumnProps)
{
  const { setNodeRef, isOver } = useDroppable({ id })
  const overLimit = count > wipLimit
  const [showAddCard, setShowAddCard] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const createTarefa = useTaskStore((s) => s.createTarefa)

  const handleAddCard = async () =>
  {
    if (!newTitle.trim()) return
    setAdding(true)
    await createTarefa(newTitle.trim())
    setNewTitle('')
    setShowAddCard(false)
    setAdding(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) =>
  {
    if (e.key === 'Enter')
    {
      handleAddCard()
    }
    else if (e.key === 'Escape')
    {
      setShowAddCard(false)
      setNewTitle('')
    }
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={`Coluna ${title}, ${count} de ${wipLimit} tarefas`}
      className={[
        'w-80 shrink-0 flex flex-col',
        isOver && !flat ? 'bg-card/40' : '',
      ].join(' ')}
    >
      {/* cabeçalho - sticky leve, sem blur excessivo */}
      <div className="py-2 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <h3 className="text-[14px] font-semibold text-zinc-100">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={[
              'text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded',
              overLimit ? 'text-red-400 bg-red-500/10' : 'text-zinc-500',
            ].join(' ')}>
              {count}/{wipLimit}
            </span>
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="p-1 rounded text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
              title="Adicionar tarefa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!flat && (
          <div className="mt-1.5 h-[2px] rounded-full bg-zinc-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${overLimit ? 'bg-red-500' : 'bg-violet-500/60'}`}
              style={{ width: `${Math.min((count / wipLimit) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* lista de tarefas - gap pequeno mantém o ritmo de linha */}
      <div
        className="flex-1 px-0.5 flex flex-col gap-0.5 overflow-y-auto min-h-[120px] max-h-[calc(100vh-220px)]"
        role="list"
      >
        {showAddCard && (
          <div className="bg-card border-l-2 border-violet-500/60 rounded-sm px-2 py-1.5 space-y-1.5">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Título da tarefa (use 'urgente' p/ score alto)..."
              className="w-full bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newTitle.trim() || adding}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-violet-600 text-white rounded hover:bg-violet-500 transition-colors disabled:opacity-40"
              >
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Criar
              </button>
              <button
                onClick={() => { setShowAddCard(false); setNewTitle('') }}
                className="px-1.5 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {children}

        {isOver && count === 0 && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-violet-500/20 rounded-sm min-h-[80px]">
            <span className="text-[10px] text-violet-400/60 uppercase tracking-wider font-semibold">Soltar aqui</span>
          </div>
        )}
      </div>
    </section>
  )
}
