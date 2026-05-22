import { useEffect, useState, useMemo, useCallback } from 'react';
import { DndContext, type DragEndEvent, DragOverlay } from '@dnd-kit/core';
import {
  FlaskConical, LayoutGrid, List, Archive,
  CalendarDays, CalendarRange, Calendar, Loader2, Radio,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { TaskDetailModal } from './TaskDetailModal';
import { ListView } from './ListView';
import { GanttView } from './GanttView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DevIngestaoModal } from './DevIngestaoModal';
import { BatchBar } from './BatchBar';
import { ArquivoTab } from './ArquivoTab';
import { BoardFilters } from './BoardFilters';
import { toast } from 'sonner';
import type { TarefaUnificada } from '../../types';
import { PRIO_LABELS, ORIGIN_LABELS } from '../../constants/kanbanConfig';

const COLUMNS = [
  { id: 'pendente',      title: 'Pendente',      dotColor: 'bg-red-500',     wipLimit: 5  },
  { id: 'em_progresso',  title: 'Em Progresso',  dotColor: 'bg-amber-500',   wipLimit: 8  },
  { id: 'concluida',     title: 'Concluída',     dotColor: 'bg-emerald-500', wipLimit: 20 },
] as const;

type ViewMode = 'board' | 'list' | 'week' | 'month' | 'gantt';
type GroupBy  = 'none' | 'prioridade' | 'origem' | 'label';
type Tab      = 'active' | 'arquivo';

export function KanbanBoard() {
  const {
    tarefas, isLoading, error, fetchTarefas, moveTask, deleteTarefa,
    labels, fetchLabels, duplicateTarefa,
    batchMove, batchDelete, batchPriority, updateTarefa,
  } = useTaskStore();

  const [devModalOpen, setDevModalOpen] = useState(false);

  // estados de controle de visualização
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [tab, setTab] = useState<Tab>('active');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [boardStyle, setBoardStyle] = useState<'classico' | 'temporal'>(() =>
  {
    try
    {
      const saved = localStorage.getItem('jarvis_kanban_style')
      if (saved === 'classico' || saved === 'temporal') return saved
    }
    catch { /* privado */ }
    return 'temporal'
  });

  const realtimeStatus = useTaskStore((s) => s.realtimeStatus);

  const persistBoardStyle = (style: 'classico' | 'temporal') =>
  {
    setBoardStyle(style)
    try
    {
      localStorage.setItem('jarvis_kanban_style', style)
    }
    catch { /* modo privado */ }
  }

  // filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrio, setFilterPrio] = useState<string | null>(null);
  const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // drag and drop
  const [activeId, setActiveId] = useState<number | null>(null);

  // modais e seleção
  const [selectedTarefa, setSelectedTarefa] = useState<TarefaUnificada | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchTarefas();
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aplica os filtros às tarefas
  const filtered = useMemo(() => {
    let result = tarefas;
    if (searchQuery.trim())
    {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        return t.titulo.toLowerCase().includes(q) || t.snippet_100_char?.toLowerCase().includes(q);
      });
    }
    if (filterPrio)
    {
      result = result.filter((t) => {
        return t.prioridade === filterPrio;
      });
    }
    if (filterOrigem)
    {
      result = result.filter((t) => {
        return t.origem === filterOrigem;
      });
    }
    if (filterLabel !== null)
    {
      result = result.filter((t) => {
        return t.labels?.some((l) => {
          return l.id === filterLabel;
        });
      });
    }
    return result;
  }, [tarefas, searchQuery, filterPrio, filterOrigem, filterLabel]);

  const TEMPORAL_COLUMNS = useMemo(() =>
  {
    return [
      { id: 'fazer_1h',     title: 'Fazer em 1h',   dotColor: 'bg-rose-500',    wipLimit: 3  },
      { id: 'fazer_hoje',   title: 'Fazer Hoje',    dotColor: 'bg-amber-500',   wipLimit: 8  },
      { id: 'nesta_semana', title: 'Nesta Semana',  dotColor: 'bg-blue-500',    wipLimit: 15 },
    ] as const;
  }, []);

  const boardColumns = boardStyle === 'temporal' ? TEMPORAL_COLUMNS : COLUMNS;

  // regra temporal — prioridade crítica/alta também sobe coluna
  const isFazer1h = useCallback((t: TarefaUnificada) =>
  {
    if (t.status !== 'pendente') return false
    const score = t.score_urgencia ?? 0
    return score >= 60 || t.prioridade === 'critica'
  }, [])

  const isFazerHoje = useCallback((t: TarefaUnificada) =>
  {
    if (t.status === 'em_progresso') return true
    if (t.status !== 'pendente') return false
    const score = t.score_urgencia ?? 0
    return (score >= 35 && score < 60) || t.prioridade === 'alta'
  }, [])

  const isNestaSemana = useCallback((t: TarefaUnificada) =>
  {
    if (t.status !== 'pendente') return false
    if (isFazer1h(t) || isFazerHoje(t)) return false
    return true
  }, [isFazer1h, isFazerHoje])

  const getColumnTasks = useCallback((colId: string) =>
  {
    if (boardStyle === 'temporal')
    {
      if (colId === 'fazer_1h') return filtered.filter(isFazer1h)
      if (colId === 'fazer_hoje') return filtered.filter(isFazerHoje)
      if (colId === 'nesta_semana') return filtered.filter(isNestaSemana)
      return []
    }
    return filtered.filter((t) => t.status === colId);
  }, [filtered, boardStyle, isFazer1h, isFazerHoje, isNestaSemana]);

  const getGroupColumnTasks = useCallback((tasks: TarefaUnificada[], colId: string) =>
  {
    if (boardStyle === 'temporal')
    {
      if (colId === 'fazer_1h') return tasks.filter(isFazer1h)
      if (colId === 'fazer_hoje') return tasks.filter(isFazerHoje)
      if (colId === 'nesta_semana') return tasks.filter(isNestaSemana)
      return []
    }
    return tasks.filter((t) => t.status === colId);
  }, [boardStyle, isFazer1h, isFazerHoje, isNestaSemana]);

  // agrupa tarefas se houver seleção de agrupamento
  const groups = useMemo(() => {
    if (groupBy === 'none')
    {
      return null;
    }

    const map = new Map<string, TarefaUnificada[]>();
    for (const t of filtered) {
      let key: string;
      if (groupBy === 'prioridade')
      {
        key = t.prioridade;
      } else if (groupBy === 'origem')
      {
        key = t.origem;
      } else {
        const lbls = t.labels || [];
        if (lbls.length === 0)
        {
          key = 'Sem label';
        } else {
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

    if (groupBy === 'prioridade')
    {
      const order = ['critica', 'alta', 'media', 'baixa'];
      return order.filter((k) => {
        return map.has(k);
      }).map((k) => {
        return { key: k, label: PRIO_LABELS[k] || k, tasks: map.get(k)! };
      });
    }

    return Array.from(map.entries()).map(([k, tasks]) => {
      return {
        key: k,
        label: groupBy === 'origem' ? (ORIGIN_LABELS[k] || k) : k,
        tasks,
      };
    });
  }, [filtered, groupBy]);

  const hasActiveFilters = !!searchQuery || !!filterPrio || !!filterOrigem || filterLabel !== null;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterPrio(null);
    setFilterOrigem(null);
    setFilterLabel(null);
  }, []);

  // gerenciamento de seleção de cards
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id))
      {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filtered.length)
    {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => {
        return t.id;
      })));
    }
  }, [filtered, selectedIds.size]);

  // manipuladores de drag and drop
  function handleDragStart(event: { active: { id: string | number } }) {
    setActiveId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent)
  {
    setActiveId(null);
    const { active, over } = event;
    if (!over)
    {
      return;
    }
    const taskId = active.id as number;
    const newStatus = over.id as string;
    
    if (boardStyle === 'temporal')
    {
      const task = tarefas.find((t) => t.id === taskId);
      if (task)
      {
        if (newStatus === 'fazer_1h')
        {
          updateTarefa(taskId, { status: 'pendente', score_urgencia: 85, prioridade: 'critica' });
        }
        else if (newStatus === 'fazer_hoje')
        {
          updateTarefa(taskId, { status: 'em_progresso', prioridade: 'alta' });
        }
        else if (newStatus === 'nesta_semana')
        {
          updateTarefa(taskId, { status: 'pendente', score_urgencia: 30, prioridade: 'media' });
        }
      }
    }
    else
    {
      const task = tarefas.find((t) =>
      {
        return t.id === taskId;
      });
      if (task && task.status !== newStatus)
      {
        moveTask(taskId, newStatus);
      }
    }
  }

  const handleDeleteCard = (id: number) => {
    deleteTarefa(id);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
    toast.success('Tarefa arquivada');
  };

  const handleEditCard = (tarefa: TarefaUnificada) => {
    setSelectedTarefa(tarefa);
  };

  const handleDuplicate = async (id: number) => {
    await duplicateTarefa(id);
    toast.success('Tarefa duplicada');
  };

  // ações em lote (batch actions)
  const handleBatchMove = async (status: string) => {
    const count = selectedIds.size;
    await batchMove(Array.from(selectedIds), status);
    setSelectedIds(new Set());
    toast.success(`${count} tarefas movidas`);
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    await batchDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast.success(`${count} tarefas arquivadas`);
  };

  const handleBatchPriority = async (prio: string) => {
    const count = selectedIds.size;
    await batchPriority(Array.from(selectedIds), prio);
    setSelectedIds(new Set());
    toast.success(`${count} prioridades atualizadas`);
  };

  const activeTarefa = activeId ? tarefas.find((t) => {
    return t.id === activeId;
  }) : null;

  // renderiza as colunas do board organizadas com swimlanes (se agrupado) ou padrão
  function renderBoard()
  {
    if (groups)
    {
      return (
        <div className="space-y-10">
          {groups.map((g) =>
          {
            return (
              <div key={g.key} className="space-y-4">
                <h2 className="text-[13px] font-semibold text-zinc-400 flex items-center gap-2 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
                  <span>{g.label}</span>
                  <span className="text-[10px] text-zinc-650 font-medium normal-case">({g.tasks.length})</span>
                </h2>
                <div className="flex items-start gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
                  {boardColumns.map((col) =>
                  {
                    const columnTasks = getGroupColumnTasks(g.tasks, col.id);
                    return (
                      <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        count={columnTasks.length}
                        wipLimit={col.wipLimit}
                        dotColor={col.dotColor}
                        flat={boardStyle === 'temporal'}
                      >
                        {columnTasks.map((tarefa) =>
                        {
                          return (
                            <KanbanCard
                              key={tarefa.id}
                              tarefa={tarefa}
                              onEdit={() =>
                              {
                                return handleEditCard(tarefa);
                              }}
                              onDelete={handleDeleteCard}
                              onDuplicate={handleDuplicate}
                              flat={boardStyle === 'temporal'}
                            />
                          );
                        })}
                      </KanbanColumn>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // renderização padrão — colunas lado a lado com gap menor (densidade §2.4)
    return (
      <div
        className="flex items-start gap-4 overflow-x-auto pb-4"
        role="region"
        aria-label="Quadro Kanban"
      >
        {boardColumns.map((col) =>
        {
          const columnTasks = getColumnTasks(col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              count={columnTasks.length}
              wipLimit={col.wipLimit}
              dotColor={col.dotColor}
              flat={boardStyle === 'temporal'}
            >
              {isLoading && columnTasks.length === 0 && (
                <div className="flex flex-col items-center gap-2.5 py-12 text-center">
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                  <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Buscando tarefas...</span>
                </div>
              )}
              {error && (
                <p className="text-red-400 text-[11px] py-6 text-center font-medium" role="alert">
                  {error}
                </p>
              )}
              {!isLoading && !error && columnTasks.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="text-[11px] text-zinc-650 font-medium">
                    {hasActiveFilters ? 'Nenhuma correspondência' : 'Lista vazia'}
                  </span>
                </div>
              )}
              {columnTasks.map((tarefa) =>
              {
                return (
                  <KanbanCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    onEdit={() =>
                    {
                      return handleEditCard(tarefa);
                    }}
                    onDelete={handleDeleteCard}
                    onDuplicate={handleDuplicate}
                    flat={boardStyle === 'temporal'}
                  />
                );
              })}
            </KanbanColumn>
          );
        })}
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto w-full pb-16 relative px-1">
        {/* cabeçalho principal — espaçamento reduzido para densidade */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                Tarefas
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 normal-case">
                  <Radio className="w-3.5 h-3.5" />
                  <span className={`w-2 h-2 rounded-full ${
                    realtimeStatus === 'live' ? 'bg-emerald-500'
                      : realtimeStatus === 'connecting' ? 'bg-amber-400 animate-pulse'
                        : realtimeStatus === 'error' ? 'bg-red-500'
                          : 'bg-zinc-600'
                  }`} />
                  {realtimeStatus === 'live' ? 'Ao vivo' : realtimeStatus === 'error' ? 'Realtime off' : ''}
                </span>
              </h1>
              <p className="text-zinc-400 text-[13px] font-medium mt-1">
                {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}
                {hasActiveFilters ? ' filtradas' : ' ativas'}
                {boardStyle === 'temporal' ? ' · visão Jarvis' : ''}
              </p>
            </div>

            {/* toolbar — visual plano, separadores sutis (§2.4) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* abas: ativas / arquivo */}
              <div className="flex items-center gap-0.5 border-r border-zinc-900 pr-2 mr-1">
                <button
                  onClick={() => setTab('active')}
                  className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                    tab === 'active' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  Ativas
                </button>
                <button
                  onClick={() => setTab('arquivo')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                    tab === 'arquivo' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Arquivo</span>
                </button>
              </div>

              {/* seletor de modo de visualização */}
              {tab === 'active' && (
                <div className="flex items-center gap-0.5 border border-zinc-900 rounded p-0.5">
                  <button onClick={() => setViewMode('board')} className={`p-1.5 rounded transition-colors ${viewMode === 'board' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'}`} title="Quadro">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'}`} title="Lista">
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('week')} className={`p-1.5 rounded transition-colors ${viewMode === 'week' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'}`} title="Semanal">
                    <CalendarRange className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('month')} className={`p-1.5 rounded transition-colors ${viewMode === 'month' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'}`} title="Mensal">
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('gantt')} className={`p-1.5 rounded transition-colors ${viewMode === 'gantt' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'}`} title="Gantt">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* estilo do quadro: clássico vs temporal */}
              {viewMode === 'board' && tab === 'active' && (
                <div className="flex items-center gap-0.5 border border-zinc-900 rounded p-0.5">
                  <button
                    onClick={() => persistBoardStyle('classico')}
                    className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                      boardStyle === 'classico' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    Clássico
                  </button>
                  <button
                    onClick={() => persistBoardStyle('temporal')}
                    className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                      boardStyle === 'temporal' ? 'bg-card text-white' : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    Temporal
                  </button>
                </div>
              )}

              {/* agrupamentos de tarefas */}
              {tab === 'active' && (
                <div className="relative">
                  <select
                    value={groupBy}
                    onChange={(e) => {
                      return setGroupBy(e.target.value as GroupBy);
                    }}
                    className="bg-transparent border border-zinc-900 rounded pl-2.5 pr-7 py-1 text-[12px] font-medium text-zinc-400 outline-none focus:border-violet-500/30 appearance-none cursor-pointer"
                  >
                    <option value="none">Sem Agrupamento</option>
                    <option value="prioridade">Agrupar por Prioridade</option>
                    <option value="origem">Agrupar por Origem</option>
                    <option value="label">Agrupar por Marcador</option>
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-650 pointer-events-none text-[8px] font-bold">▼</span>
                </div>
              )}
            </div>
          </div>

          {/* barra de filtros (componente isolado) */}
          {tab === 'active' && (
            <BoardFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterPrio={filterPrio}
              setFilterPrio={setFilterPrio}
              filterOrigem={filterOrigem}
              setFilterOrigem={setFilterOrigem}
              filterLabel={filterLabel}
              setFilterLabel={setFilterLabel}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              labels={labels}
            />
          )}
        </div>

        {/* conteúdo dinâmico principal dependendo do tab/viewMode */}
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
        ) : viewMode === 'week' ? (
          <WeekView
            tarefas={filtered}
            onSelectTarefa={(t) => {
              return setSelectedTarefa(t);
            }}
          />
        ) : viewMode === 'month' ? (
          <MonthView
            tarefas={filtered}
            onSelectTarefa={(t) => {
              return setSelectedTarefa(t);
            }}
          />
        ) : viewMode === 'gantt' ? (
          <GanttView
            tarefas={filtered}
            onSelectTarefa={(t) => {
              return setSelectedTarefa(t);
            }}
          />
        ) : (
          renderBoard()
        )}

        {/* overlay de arraste (drag overlay) */}
        <DragOverlay>
          {activeTarefa ? (
            <div className="opacity-90">
              <KanbanCard tarefa={activeTarefa} flat={boardStyle === 'temporal'} />
            </div>
          ) : null}
        </DragOverlay>

        {/* barra de ações em lote flutuante (componente isolado) */}
        {selectedIds.size > 0 && tab === 'active' && (
          <BatchBar
            count={selectedIds.size}
            onMove={handleBatchMove}
            onDelete={handleBatchDelete}
            onPriority={handleBatchPriority}
            onClear={() => {
              return setSelectedIds(new Set());
            }}
          />
        )}

        {/* botão dev simulador flutuante */}
        <button
          onClick={() => {
            return setDevModalOpen(true);
          }}
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-card hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-violet-400 rounded px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold transition-colors z-35"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Simular Triagem</span>
        </button>

        {/* modal de simulação de triagem de e-mail (componente isolado) */}
        <DevIngestaoModal 
          open={devModalOpen} 
          onClose={() => {
            return setDevModalOpen(false);
          }} 
        />

        {/* modal de detalhe da tarefa */}
        {selectedTarefa && (
          <TaskDetailModal 
            tarefa={selectedTarefa} 
            onClose={() => {
              return setSelectedTarefa(null);
            }} 
          />
        )}
      </div>
    </DndContext>
  );
}