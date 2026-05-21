import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTaskStore } from '../../store/useTaskStore';

interface KanbanColumnProps
{
  id: string;
  title: string;
  count: number;
  wipLimit: number;
  dotColor: string;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, wipLimit, dotColor, children }: KanbanColumnProps)
{
  const { setNodeRef, isOver } = useDroppable({ id });
  const overLimit = count > wipLimit;
  const [showAddCard, setShowAddCard] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const createTarefa = useTaskStore((s) => s.createTarefa);

  const handleAddCard = async () =>
  {
    if (!newTitle.trim())
    {
      return;
    }
    setAdding(true);
    await createTarefa(newTitle.trim());
    setNewTitle('');
    setShowAddCard(false);
    setAdding(false);
  };

  return (
    <section
      ref={setNodeRef}
      aria-label={`Coluna ${title}, ${count} de ${wipLimit} tarefas`}
      className={[
        'w-80 shrink-0 flex flex-col transition-all duration-200',
        isOver ? 'bg-violet-500/[0.02] rounded-xl' : 'bg-transparent',
      ].join(' ')}
    >
      {/* cabeçalho da coluna */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md py-3.5 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <h3 className="text-[13px] font-semibold text-zinc-200">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-md ${
                overLimit ? 'text-red-400 bg-red-500/10' : 'text-zinc-500'
              }`}
            >
              {count}/{wipLimit}
            </span>
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="p-1 rounded-md text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
              title="Adicionar tarefa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* indicador de progresso do wip limit (linha ultra fina de 2px) */}
        <div className="mt-2.5 h-[2px] rounded-full bg-zinc-900 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              overLimit ? 'bg-red-500' : 'bg-violet-500/60'
            }`}
            style={{ width: `${Math.min((count / wipLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* área para rolagem de tarefas */}
      <div
        className="flex-1 py-2 px-1 flex flex-col gap-2 overflow-y-auto min-h-[120px] max-h-[calc(100vh-260px)]
                   scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent"
        role="list"
      >
        {/* formulário inline de criação rápida de card */}
        {showAddCard && (
          <div className="bg-zinc-900/35 border border-zinc-800/80 rounded-xl p-3 space-y-2.5 backdrop-blur-sm">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) =>
              {
                if (e.key === 'Enter')
                {
                  handleAddCard();
                }
                else if (e.key === 'Escape')
                {
                  setShowAddCard(false);
                  setNewTitle('');
                }
              }}
              placeholder="Título da nova tarefa..."
              className="w-full bg-zinc-950/45 border border-zinc-800/80 rounded-lg px-3 py-1.5
                         text-[13px] text-zinc-200 placeholder:text-zinc-650
                         outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 transition-all"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newTitle.trim() || adding}
                className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold
                           bg-violet-650 text-white rounded-lg hover:bg-violet-550
                           transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Criar</span>
              </button>
              <button
                onClick={() =>
                {
                  setShowAddCard(false);
                  setNewTitle('');
                }}
                className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-350 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {children}

        {/* indicador visual durante drag & drop se a coluna estiver vazia */}
        {isOver && count === 0 && (
          <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-violet-500/20 min-h-[90px] bg-violet-500/[0.005]">
            <span className="text-[10px] text-violet-400/50 uppercase tracking-widest font-semibold">Soltar aqui</span>
          </div>
        )}
      </div>
    </section>
  );
}
