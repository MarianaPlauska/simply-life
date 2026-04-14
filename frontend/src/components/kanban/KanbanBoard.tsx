import { useEffect, useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { FlaskConical, X, Send, Loader2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS = [
  { id: 'pendente', title: 'Fazer em 1h', dotColor: 'bg-red-500', wipLimit: 5 },
  { id: 'hoje', title: 'Fazer Hoje', dotColor: 'bg-amber-500', wipLimit: 8 },
  { id: 'concluida', title: 'Concluida', dotColor: 'bg-emerald-500', wipLimit: 20 },
] as const;

function DevIngestaoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [sending, setSending] = useState(false);
  const simularIngestao = useTaskStore((s) => s.simularIngestao);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSending(true);
    await simularIngestao(titulo.trim());
    setSending(false);
    setTitulo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <h2 className="text-[15px] font-semibold text-white">Simular Ingestão de E-mail</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] text-zinc-400 font-medium">Título do E-mail Falso</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="ex: Proposta urgente – revisão do contrato"
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-transparent transition-shadow"
            autoFocus
          />
          <p className="text-[11px] text-zinc-600">O motor de score vai triar usando suas keywords configuradas.</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!titulo.trim() || sending}
          className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Enviando...' : 'Enviar para Triagem'}
        </button>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { tarefas, isLoading, error, fetchTarefas, moveTask } = useTaskStore();
  const [devModalOpen, setDevModalOpen] = useState(false);

  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as string;

    const task = tarefas.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto w-full pb-12 relative">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Kanban</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Arraste as tarefas entre colunas para organizar seu fluxo.</p>
        </div>
        <div className="flex items-start gap-5 overflow-x-auto pb-4 scrollbar-thin" role="region" aria-label="Quadro Kanban">
          {COLUMNS.map((col) => {
            const columnTasks = tarefas.filter((t) => t.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                count={columnTasks.length}
                wipLimit={col.wipLimit}
                dotColor={col.dotColor}
              >
                {isLoading && <p className="text-zinc-500 text-[12px] py-4 text-center" role="status">Buscando na API...</p>}
                {error && <p className="text-red-400 text-[12px] py-4 text-center" role="alert">{error}</p>}
                {columnTasks.map((tarefa) => (
                  <KanbanCard key={tarefa.id} tarefa={tarefa} />
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        {/* Dev Mode Button */}
        <button
          onClick={() => setDevModalOpen(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-500 hover:text-amber-400 rounded-xl px-3 py-2 text-[11px] font-medium backdrop-blur-sm transition-all z-40"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Dev: Simular Ingestão
        </button>

        <DevIngestaoModal open={devModalOpen} onClose={() => setDevModalOpen(false)} />
      </div>
    </DndContext>
  );
}