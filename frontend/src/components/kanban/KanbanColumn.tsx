import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTaskStore } from '../../store/useTaskStore';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  wipLimit: number;
  dotColor: string;
  children: ReactNode;
}

export function KanbanColumn ({ id, title, count, wipLimit, dotColor, children }: KanbanColumnProps)
{
  const { setNodeRef, isOver } = useDroppable({ id });
  const overLimit = count > wipLimit;
  const [collapsed, setCollapsed] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const createTarefa = useTaskStore((s) => s.createTarefa);

  const handleAddCard = async () =>
  {
    if ( !newTitle.trim() ) return;
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
        'w-80 shrink-0 flex flex-col rounded-xl border transition-all duration-200',
        isOver
          ? 'border-violet-500/40 bg-violet-500/[0.03] shadow-lg shadow-violet-500/5'
          : 'border-zinc-800/40 bg-zinc-900/20',
        collapsed ? 'w-14' : '',
      ].join(' ')}
    >
      {/* cabeçalho fixo da coluna */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md px-4 py-3 border-b border-zinc-800/30 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* botão collapse */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 rounded hover:bg-zinc-800/60 transition-colors text-zinc-500 hover:text-zinc-300"
              title={collapsed ? 'Expandir coluna' : 'Recolher coluna'}
            >
              {collapsed
                ? <ChevronRight className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            {!collapsed && (
              <h3 className="text-[13px] font-semibold text-zinc-200">{title}</h3>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-md ${
                  overLimit ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 bg-zinc-800/50'
                }`}
              >
                {count}/{wipLimit}
              </span>
              {/* botão adicionar card */}
              <button
                onClick={() => setShowAddCard(!showAddCard)}
                className="p-1 rounded-md text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                title="Adicionar tarefa"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* barra de progresso do wip limit */}
        {!collapsed && (
          <div className="mt-2 h-1 rounded-full bg-zinc-800/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${overLimit ? 'bg-red-500' : dotColor}`}
              style={{ width: `${Math.min((count / wipLimit) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* coluna recolhida: mostra titulo vertical */}
      {collapsed && (
        <div className="flex-1 flex items-center justify-center py-4">
          <span className="text-[11px] text-zinc-500 font-medium [writing-mode:vertical-lr] rotate-180">
            {title} ({count})
          </span>
        </div>
      )}

      {/* area de cards rolável */}
      {!collapsed && (
        <div
          className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto min-h-[120px] max-h-[calc(100vh-260px)]
                     scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
          role="list"
        >
          {/* formulario inline para adicionar card */}
          {showAddCard && (
            <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-3 space-y-2 backdrop-blur-sm">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if ( e.key === 'Enter' ) handleAddCard();
                  if ( e.key === 'Escape' ) { setShowAddCard(false); setNewTitle(''); }
                }}
                placeholder="Título da nova tarefa..."
                className="w-full bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2
                           text-[13px] text-white placeholder:text-zinc-600
                           outline-none focus:ring-1 focus:ring-violet-500/40 transition-shadow"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddCard}
                  disabled={!newTitle.trim() || adding}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium
                             bg-violet-600 text-white rounded-lg hover:bg-violet-500
                             transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Criar
                </button>
                <button
                  onClick={() => { setShowAddCard(false); setNewTitle(''); }}
                  className="px-3 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {children}

          {/* indicador de drop zone quando está arrastando */}
          {isOver && count === 0 && (
            <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-violet-500/30 min-h-[80px]">
              <span className="text-[11px] text-violet-400/60">Solte aqui</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
