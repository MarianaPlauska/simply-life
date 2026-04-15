// KanbanBoard — Sprint C: power features (C1-C8) | Sprint D: Gantt view
import { useEffect, useState, useMemo, useCallback } from 'react';
import { DndContext, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import {
  FlaskConical, X, Send, Loader2, Search, SlidersHorizontal,
  LayoutGrid, List, Archive, RotateCcw, Trash2, ArrowRight,
  ChevronDown, Zap, Copy, CalendarDays,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { TaskDetailModal } from './TaskDetailModal';
import { ListView } from './ListView';
import { GanttView } from './GanttView';
import { toast } from 'sonner';
import type { TarefaUnificada } from '../../types';
import { PRIO_LABELS, PRIO_ORDER, ORIGIN_LABELS } from '../../constants/kanbanConfig';

const COLUMNS = [
  { id: 'pendente',      title: 'Pendente',      dotColor: 'bg-red-500',     wipLimit: 5  },
  { id: 'em_progresso',  title: 'Em Progresso',  dotColor: 'bg-amber-500',   wipLimit: 8  },
  { id: 'concluida',     title: 'Concluída',     dotColor: 'bg-emerald-500', wipLimit: 20 },
] as const;

const PRIORIDADES = ['critica', 'alta', 'media', 'baixa'] as const;
const ORIGENS     = ['manual', 'gmail_triage', 'gmail_mock', 'gmail_api', 'webhook'] as const;


type ViewMode = 'board' | 'list' | 'gantt';
type GroupBy  = 'none' | 'prioridade' | 'origem' | 'label';
type Tab      = 'active' | 'arquivo';


/* ── dev modal ────────────────────────────────────────────── */
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
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
            type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="ex: Proposta urgente – revisão do contrato"
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-transparent transition-shadow"
            autoFocus
          />
          <p className="text-[11px] text-zinc-600">O motor de score vai triar usando suas keywords configuradas.</p>
        </div>
        <button
          onClick={handleSubmit} disabled={!titulo.trim() || sending}
          className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Enviando...' : 'Enviar para Triagem'}
        </button>
      </div>
    </div>
  );
}


/* ── C3: barra de ações em lote ──────────────────────────── */
function BatchBar ({ count, onMove, onDelete, onPriority, onClear }: {
  count: number;
  onMove: (status: string) => void;
  onDelete: () => void;
  onPriority: (prio: string) => void;
  onClear: () => void;
})
{
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPrioMenu, setShowPrioMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
      <span className="text-[13px] font-semibold text-violet-300">{count} selecionada{count !== 1 ? 's' : ''}</span>
      <div className="h-4 w-px bg-violet-500/30" />

      {/* mover */}
      <div className="relative">
        <button
          onClick={() => { setShowMoveMenu(!showMoveMenu); setShowPrioMenu(false); }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium bg-zinc-800/60 text-zinc-300 rounded-lg hover:bg-zinc-700/60 transition-colors"
        >
          <ArrowRight className="w-3 h-3" /> Mover <ChevronDown className="w-3 h-3" />
        </button>
        {showMoveMenu && (
          <div className="absolute top-full left-0 mt-1 z-20 w-36 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1">
            {['pendente', 'em_progresso', 'concluida'].map((s) => (
              <button key={s} onClick={() => { onMove(s); setShowMoveMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors capitalize"
              >{s.replace('_', ' ')}</button>
            ))}
          </div>
        )}
      </div>

      {/* prioridade */}
      <div className="relative">
        <button
          onClick={() => { setShowPrioMenu(!showPrioMenu); setShowMoveMenu(false); }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium bg-zinc-800/60 text-zinc-300 rounded-lg hover:bg-zinc-700/60 transition-colors"
        >
          <Zap className="w-3 h-3" /> Prioridade <ChevronDown className="w-3 h-3" />
        </button>
        {showPrioMenu && (
          <div className="absolute top-full left-0 mt-1 z-20 w-32 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1">
            {PRIORIDADES.map((p) => (
              <button key={p} onClick={() => { onPriority(p); setShowPrioMenu(false); }}
                className="w-full px-3 py-1.5 text-left text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors capitalize"
              >{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* excluir */}
      <button
        onClick={onDelete}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
      >
        <Trash2 className="w-3 h-3" /> Arquivar
      </button>

      {/* limpar seleção */}
      <button onClick={onClear} className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
        Limpar seleção
      </button>
    </div>
  );
}


/* ── C6: tab de arquivo ──────────────────────────────────── */
function ArquivoTab ()
{
  const { arquivo, arquivoLoading, fetchArquivo, restaurarTarefa } = useTaskStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() =>
  {
    if ( !loaded ) { fetchArquivo(); setLoaded(true); }
  }, [loaded, fetchArquivo]);

  if ( arquivoLoading )
  {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
      </div>
    );
  }

  if ( arquivo.length === 0 )
  {
    return (
      <div className="text-center py-16 space-y-2">
        <Archive className="w-8 h-8 text-zinc-700 mx-auto" />
        <p className="text-[13px] text-zinc-600">Arquivo vazio</p>
        <p className="text-[11px] text-zinc-700">Tarefas excluídas aparecem aqui e podem ser restauradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {arquivo.map((t) => (
        <div key={t.id} className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 border border-zinc-800/30 rounded-xl hover:bg-zinc-800/30 transition-colors">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-zinc-400 truncate">{t.titulo}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-zinc-600 font-mono">#{t.id}</span>
              <span className="text-[10px] text-zinc-600">{t.status}</span>
              <span className="text-[10px] text-zinc-600">{t.prioridade}</span>
            </div>
          </div>
          <button
            onClick={async () => { await restaurarTarefa(t.id); toast.success('Tarefa restaurada'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors shrink-0 ml-3"
          >
            <RotateCcw className="w-3 h-3" /> Restaurar
          </button>
        </div>
      ))}
    </div>
  );
}


/* ── MAIN COMPONENT ──────────────────────────────────────── */
export function KanbanBoard ()
{
  const {
    tarefas, isLoading, error, fetchTarefas, moveTask, deleteTarefa,
    labels, fetchLabels, duplicateTarefa,
    batchMove, batchDelete, batchPriority,
  } = useTaskStore();

  const [devModalOpen, setDevModalOpen] = useState(false);

  // C1: view mode
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  // C6: tab ativa/arquivo
  const [tab, setTab] = useState<Tab>('active');
  // C2: agrupamento
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  // filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrio, setFilterPrio] = useState<string | null>(null);
  const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // drag
  const [activeId, setActiveId] = useState<number | null>(null);
  // modal
  const [selectedTarefa, setSelectedTarefa] = useState<TarefaUnificada | null>(null);
  // C3: multi-select
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() =>
  {
    fetchTarefas();
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aplica filtros
  const filtered = useMemo(() =>
  {
    let result = tarefas;
    if ( searchQuery.trim() )
    {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.titulo.toLowerCase().includes(q) || t.snippet_100_char?.toLowerCase().includes(q)
      );
    }
    if ( filterPrio )   result = result.filter((t) => t.prioridade === filterPrio);
    if ( filterOrigem ) result = result.filter((t) => t.origem === filterOrigem);
    if ( filterLabel !== null ) result = result.filter((t) => t.labels?.some((l) => l.id === filterLabel));
    return result;
  }, [tarefas, searchQuery, filterPrio, filterOrigem, filterLabel]);

  // C2: agrupamento
  const groups = useMemo(() =>
  {
    if ( groupBy === 'none' ) return null;

    const map = new Map<string, TarefaUnificada[]>();
    for ( const t of filtered )
    {
      let key: string;
      if ( groupBy === 'prioridade' ) key = t.prioridade;
      else if ( groupBy === 'origem' ) key = t.origem;
      else
      {
        const lbls = t.labels || [];
        if ( lbls.length === 0 ) key = 'Sem label';
        else
        {
          lbls.forEach((l) => {
            const prev = map.get(l.nome) || [];
            prev.push(t);
            map.set(l.nome, prev);
          });
          continue;
        }
      }
      const prev = map.get(key) || [];
      prev.push(t);
      map.set(key, prev);
    }

    if ( groupBy === 'prioridade' )
    {
      const order = ['critica', 'alta', 'media', 'baixa'];
      return order.filter((k) => map.has(k)).map((k) => ({ key: k, label: PRIO_LABELS[k] || k, tasks: map.get(k)! }));
    }
    return Array.from(map.entries()).map(([k, tasks]) => ({
      key: k, label: groupBy === 'origem' ? (ORIGIN_LABELS[k] || k) : k, tasks,
    }));
  }, [filtered, groupBy]);

  const hasActiveFilters = !!searchQuery || !!filterPrio || !!filterOrigem || filterLabel !== null;

  const clearFilters = useCallback(() =>
  {
    setSearchQuery(''); setFilterPrio(null); setFilterOrigem(null); setFilterLabel(null);
  }, []);

  // C3: selection
  const toggleSelect = useCallback((id: number) =>
  {
    setSelectedIds((prev) =>
    {
      const next = new Set(prev);
      if ( next.has(id) ) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() =>
  {
    if ( selectedIds.size === filtered.length ) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((t) => t.id)));
  }, [filtered, selectedIds.size]);

  function handleDragStart (event: { active: { id: string | number } }) { setActiveId(event.active.id as number); }

  function handleDragEnd (event: DragEndEvent)
  {
    setActiveId(null);
    const { active, over } = event;
    if ( !over ) return;
    const taskId = active.id as number;
    const newStatus = over.id as string;
    const task = tarefas.find((t) => t.id === taskId);
    if ( task && task.status !== newStatus ) moveTask(taskId, newStatus);
  }

  const handleDeleteCard = (id: number) =>
  {
    deleteTarefa(id);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
    toast.success('Tarefa arquivada');
  };

  const handleEditCard = (tarefa: TarefaUnificada) => setSelectedTarefa(tarefa);

  const handleDuplicate = async (id: number) =>
  {
    await duplicateTarefa(id);
    toast.success('Tarefa duplicada');
  };

  // C3: batch handlers
  const handleBatchMove = async (status: string) =>
  {
    const count = selectedIds.size;
    await batchMove(Array.from(selectedIds), status);
    setSelectedIds(new Set());
    toast.success(`${count} tarefas movidas`);
  };
  const handleBatchDelete = async () =>
  {
    const count = selectedIds.size;
    await batchDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast.success(`${count} tarefas arquivadas`);
  };
  const handleBatchPriority = async (prio: string) =>
  {
    const count = selectedIds.size;
    await batchPriority(Array.from(selectedIds), prio);
    setSelectedIds(new Set());
    toast.success(`${count} prioridades atualizadas`);
  };

  const activeTarefa = activeId ? tarefas.find((t) => t.id === activeId) : null;

  /* ── render: colunas do board (com groupBy) ── */
  function renderBoard ()
  {
    if ( groups )
    {
      // C2: swimlanes
      return (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.key}>
              <h2 className="text-[14px] font-bold text-zinc-300 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500/40" />
                {g.label}
                <span className="text-[11px] text-zinc-600 font-normal ml-1">{g.tasks.length}</span>
              </h2>
              <div className="flex items-start gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {COLUMNS.map((col) =>
                {
                  const columnTasks = g.tasks.filter((t) => t.status === col.id);
                  return (
                    <KanbanColumn key={col.id} id={col.id} title={col.title} count={columnTasks.length} wipLimit={col.wipLimit} dotColor={col.dotColor}>
                      {columnTasks.map((tarefa) => (
                        <KanbanCard key={tarefa.id} tarefa={tarefa} onEdit={() => handleEditCard(tarefa)} onDelete={handleDeleteCard} onDuplicate={handleDuplicate} />
                      ))}
                    </KanbanColumn>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // default board
    return (
      <div className="flex items-start gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" role="region" aria-label="Quadro Kanban">
        {COLUMNS.map((col) =>
        {
          const columnTasks = filtered.filter((t) => t.status === col.id);
          return (
            <KanbanColumn key={col.id} id={col.id} title={col.title} count={columnTasks.length} wipLimit={col.wipLimit} dotColor={col.dotColor}>
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
                  <p className="text-[12px] text-zinc-600">{hasActiveFilters ? 'Nenhuma tarefa com esses filtros' : 'Nenhuma tarefa'}</p>
                </div>
              )}
              {columnTasks.map((tarefa) => (
                <KanbanCard key={tarefa.id} tarefa={tarefa} onEdit={() => handleEditCard(tarefa)} onDelete={handleDeleteCard} onDuplicate={handleDuplicate} />
              ))}
            </KanbanColumn>
          );
        })}
      </div>
    );
  }


  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto w-full pb-12 relative">

        {/* ── header ── */}
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
              {/* C6: tabs */}
              <div className="flex items-center bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-0.5">
                <button
                  onClick={() => setTab('active')}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                    tab === 'active' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Ativas
                </button>
                <button
                  onClick={() => setTab('arquivo')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                    tab === 'arquivo' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Archive className="w-3 h-3" /> Arquivo
                </button>
              </div>

              {/* C1: view toggle */}
              {tab === 'active' && (
                <div className="flex items-center bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('board')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Board view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('gantt')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'gantt' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Timeline / Gantt"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* C2: group by */}
              {tab === 'active' && (
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-400
                             outline-none focus:ring-1 focus:ring-violet-500/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="none">Sem agrupamento</option>
                  <option value="prioridade">Agrupar: Prioridade</option>
                  <option value="origem">Agrupar: Origem</option>
                  <option value="label">Agrupar: Label</option>
                </select>
              )}

              {/* filtros */}
              {tab === 'active' && (
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
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />}
                </button>
              )}
            </div>
          </div>

          {/* busca + filtros */}
          {tab === 'active' && (
            <>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar tarefas..."
                    className="w-full bg-zinc-900/60 border border-zinc-800/50 rounded-lg pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/30 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-500 hover:text-zinc-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">Limpar filtros</button>
                )}
              </div>

              {showFilters && (
                <div className="flex items-center gap-4 flex-wrap p-3 bg-zinc-900/40 border border-zinc-800/30 rounded-xl">
                  {/* prioridade */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Prioridade</span>
                    <div className="flex items-center gap-1">
                      {PRIORIDADES.map((p) => (
                        <button key={p} onClick={() => setFilterPrio(filterPrio === p ? null : p)}
                          className={['px-2 py-1 text-[11px] font-medium rounded-md border transition-all capitalize',
                            filterPrio === p ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-zinc-800/40 border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                          ].join(' ')}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                  {/* origem */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Origem</span>
                    <div className="flex items-center gap-1">
                      {ORIGENS.map((o) => (
                        <button key={o} onClick={() => setFilterOrigem(filterOrigem === o ? null : o)}
                          className={['px-2 py-1 text-[11px] font-medium rounded-md border transition-all',
                            filterOrigem === o ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-zinc-800/40 border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                          ].join(' ')}
                        >{o.replace('_', ' ')}</button>
                      ))}
                    </div>
                  </div>
                  {/* labels */}
                  {labels.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Label</span>
                      <div className="flex items-center gap-1">
                        {labels.map((lb) => (
                          <button key={lb.id} onClick={() => setFilterLabel(filterLabel === lb.id ? null : lb.id)}
                            className={['flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border transition-all',
                              filterLabel === lb.id ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-zinc-800/40 border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
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
            </>
          )}

          {/* C3: batch actions bar */}
          {selectedIds.size > 0 && tab === 'active' && (
            <BatchBar
              count={selectedIds.size}
              onMove={handleBatchMove}
              onDelete={handleBatchDelete}
              onPriority={handleBatchPriority}
              onClear={() => setSelectedIds(new Set())}
            />
          )}
        </div>

        {/* ── conteúdo principal ── */}
        {tab === 'arquivo' ? (
          <ArquivoTab />
        ) : viewMode === 'list' ? (
          <ListView
            tarefas={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onEdit={handleEditCard}
            onDelete={handleDeleteCard}
            onDuplicate={handleDuplicate}
          />
        ) : viewMode === 'gantt' ? (
          <GanttView
            tarefas={filtered}
            onSelectTarefa={(t) => setSelectedTarefa(t)}
          />
        ) : (
          renderBoard()
        )}

        {/* drag overlay */}
        <DragOverlay>
          {activeTarefa && (
            <div className="opacity-90 rotate-2 scale-105">
              <KanbanCard tarefa={activeTarefa} />
            </div>
          )}
        </DragOverlay>

        {/* dev mode */}
        <button
          onClick={() => setDevModalOpen(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-500 hover:text-amber-400 rounded-xl px-3 py-2 text-[11px] font-medium backdrop-blur-sm transition-all z-40"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Dev: Simular Ingestão
        </button>

        <DevIngestaoModal open={devModalOpen} onClose={() => setDevModalOpen(false)} />

        {selectedTarefa && (
          <TaskDetailModal tarefa={selectedTarefa} onClose={() => setSelectedTarefa(null)} />
        )}
      </div>
    </DndContext>
  );
}