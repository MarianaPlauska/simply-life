import { useEffect, useState, useMemo } from 'react';
import { DndContext, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { FlaskConical, X, Send, Loader2, Search, Filter, SlidersHorizontal, LayoutGrid, List, Tag } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { TaskDetailModal } from './TaskDetailModal';
import { toast } from 'sonner';
import type { TarefaUnificada } from '../../types';

const COLUMNS = [
  { id: 'pendente',      title: 'Pendente',      dotColor: 'bg-red-500',     wipLimit: 5  },
  { id: 'em_progresso',  title: 'Em Progresso',  dotColor: 'bg-amber-500',   wipLimit: 8  },
  { id: 'concluida',     title: 'Concluída',     dotColor: 'bg-emerald-500', wipLimit: 20 },
] as const;

const PRIORIDADES = ['critica', 'alta', 'media', 'baixa'] as const;
const ORIGENS     = ['manual', 'gmail_triage', 'gmail_mock', 'gmail_api', 'webhook'] as const;

/* modal de dev para simular ingestão de email — mantido do original */
function DevIngestaoModal ({ open, onClose }: { open: boolean; onClose: () => void })
{
  const [titulo, setTitulo] = useState('');
  const [sending, setSending] = useState(false);
  const simularIngestao = useTaskStore((s) => s.simularIngestao);

  if ( !open ) return null;

  const handleSubmit = async () =>
  {
    if ( !titulo.trim() ) return;
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


export function KanbanBoard ()
{
  const { tarefas, isLoading, error, fetchTarefas, moveTask, deleteTarefa, labels, fetchLabels } = useTaskStore();
  const [devModalOpen, setDevModalOpen] = useState(false);

  // filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrio, setFilterPrio] = useState<string | null>(null);
  const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // drag overlay
  const [activeId, setActiveId] = useState<number | null>(null);

  // modal de detalhe
  const [selectedTarefa, setSelectedTarefa] = useState<TarefaUnificada | null>(null);

  useEffect(() =>
  {
    fetchTarefas();
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aplica filtros nas tarefas
  const filtered = useMemo(() =>
  {
    let result = tarefas;

    if ( searchQuery.trim() )
    {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.titulo.toLowerCase().includes(q) ||
        t.snippet_100_char?.toLowerCase().includes(q)
      );
    }
    if ( filterPrio )
    {
      result = result.filter((t) => t.prioridade === filterPrio);
    }
    if ( filterOrigem )
    {
      result = result.filter((t) => t.origem === filterOrigem);
    }
    if ( filterLabel !== null )
    {
      result = result.filter((t) => t.labels?.some((l) => l.id === filterLabel));
    }

    return result;
  }, [tarefas, searchQuery, filterPrio, filterOrigem, filterLabel]);

  const hasActiveFilters = !!searchQuery || !!filterPrio || !!filterOrigem || filterLabel !== null;

  function clearFilters ()
  {
    setSearchQuery('');
    setFilterPrio(null);
    setFilterOrigem(null);
    setFilterLabel(null);
  }

  function handleDragStart (event: { active: { id: string | number } })
  {
    setActiveId(event.active.id as number);
  }

  function handleDragEnd (event: DragEndEvent)
  {
    setActiveId(null);
    const { active, over } = event;
    if ( !over ) return;

    const taskId = active.id as number;
    const newStatus = over.id as string;
    const task = tarefas.find((t) => t.id === taskId);
    if ( task && task.status !== newStatus )
    {
      moveTask(taskId, newStatus);
    }
  }

  const handleDeleteCard = (id: number) =>
  {
    deleteTarefa(id);
    toast.success('Tarefa excluída');
  };

  const handleEditCard = (tarefa: TarefaUnificada) =>
  {
    setSelectedTarefa(tarefa);
  };

  const activeTarefa = activeId ? tarefas.find((t) => t.id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto w-full pb-12 relative">

        {/* header do kanban com busca e filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Kanban</h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}
                {hasActiveFilters ? ' (filtrado)' : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* botão de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg border transition-all',
                  showFilters || hasActiveFilters
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                    : 'bg-zinc-900/60 border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700',
                ].join(' ')}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtros
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* barra de busca + filtros expandidos */}
          <div className="flex items-center gap-3">
            {/* campo de busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tarefas..."
                className="w-full bg-zinc-900/60 border border-zinc-800/50 rounded-lg pl-9 pr-3 py-2
                           text-[13px] text-white placeholder:text-zinc-600
                           outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* limpar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* filtros expandidos */}
          {showFilters && (
            <div className="flex items-center gap-4 flex-wrap p-3 bg-zinc-900/40 border border-zinc-800/30 rounded-xl">
              {/* filtro: prioridade */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Prioridade</span>
                <div className="flex items-center gap-1">
                  {PRIORIDADES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPrio(filterPrio === p ? null : p)}
                      className={[
                        'px-2 py-1 text-[11px] font-medium rounded-md border transition-all capitalize',
                        filterPrio === p
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                          : 'bg-zinc-800/40 border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* filtro: origem */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Origem</span>
                <div className="flex items-center gap-1">
                  {ORIGENS.map((o) => (
                    <button
                      key={o}
                      onClick={() => setFilterOrigem(filterOrigem === o ? null : o)}
                      className={[
                        'px-2 py-1 text-[11px] font-medium rounded-md border transition-all',
                        filterOrigem === o
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                          : 'bg-zinc-800/40 border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                      ].join(' ')}
                    >
                      {o.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* filtro: labels */}
              {labels.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Label</span>
                  <div className="flex items-center gap-1">
                    {labels.map((lb) => (
                      <button
                        key={lb.id}
                        onClick={() => setFilterLabel(filterLabel === lb.id ? null : lb.id)}
                        className={[
                          'flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border transition-all',
                          filterLabel === lb.id
                            ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                            : 'bg-zinc-800/40 border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                        ].join(' ')}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lb.cor }} />
                        {lb.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* grade de colunas do kanban */}
        <div className="flex items-start gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" role="region" aria-label="Quadro Kanban">
          {COLUMNS.map((col) =>
          {
            const columnTasks = filtered.filter((t) => t.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                count={columnTasks.length}
                wipLimit={col.wipLimit}
                dotColor={col.dotColor}
              >
                {isLoading && columnTasks.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
                    <span className="text-[12px] text-zinc-600">Carregando...</span>
                  </div>
                )}
                {error && <p className="text-red-400 text-[12px] py-4 text-center" role="alert">{error}</p>}
                {!isLoading && !error && columnTasks.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-zinc-800/40 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4 text-zinc-700" />
                    </div>
                    <p className="text-[12px] text-zinc-600">
                      {hasActiveFilters ? 'Nenhuma tarefa com esses filtros' : 'Nenhuma tarefa'}
                    </p>
                  </div>
                )}
                {columnTasks.map((tarefa) => (
                  <KanbanCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    onEdit={() => handleEditCard(tarefa)}
                    onDelete={handleDeleteCard}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        {/* overlay do card sendo arrastado */}
        <DragOverlay>
          {activeTarefa && (
            <div className="opacity-90 rotate-2 scale-105">
              <KanbanCard tarefa={activeTarefa} />
            </div>
          )}
        </DragOverlay>

        {/* botão dev mode */}
        <button
          onClick={() => setDevModalOpen(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-500 hover:text-amber-400 rounded-xl px-3 py-2 text-[11px] font-medium backdrop-blur-sm transition-all z-40"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Dev: Simular Ingestão
        </button>

        <DevIngestaoModal open={devModalOpen} onClose={() => setDevModalOpen(false)} />

        {/* modal de detalhe da tarefa */}
        {selectedTarefa && (
          <TaskDetailModal
            tarefa={selectedTarefa}
            onClose={() => setSelectedTarefa(null)}
          />
        )}
      </div>
    </DndContext>
  );
}