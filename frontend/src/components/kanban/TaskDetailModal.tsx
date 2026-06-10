import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, Tag, Hash, Zap, Sparkles,
  CheckSquare, Plus, Trash2, Pencil, Check, AlertTriangle, GripVertical,
  FileText, StickyNote, ArrowRight, ArrowUpRight, Loader2, ChevronDown,
  RefreshCw, Link, Activity, Timer, Play, Archive, MessageSquare, Circle,
  type LucideIcon,
} from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { supabase } from '../../lib/supabase';
import type { TarefaUnificada, Label, Subtarefa, RecorrenciaTarefa, DependenciaTarefa, AtividadeTarefa, TempoTarefa } from '../../types';
import { ORIGINS, ORIGINS_FALLBACK, PRIORIDADE_CONFIG, STATUS_CONFIG, STATUS_OPTIONS, PRIO_OPTIONS } from '../../constants/kanbanConfig';
import { formatDate, dueDateInfo } from '../../utils/kanbanHelpers';

interface TaskDetailModalProps {
  tarefa: TarefaUnificada;
  onClose: () => void;
}

/* C8: item de subtarefa arrastável */
function SortableSubtaskItem ({ sub, onToggle, onDelete }: {
  sub: Subtarefa;
  onToggle: (id: number, concluida: boolean) => void;
  onDelete: (id: number) => void;
})
{
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl group/sub transition-all duration-200 border border-transparent
                 ${sub.concluida 
                   ? 'bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/10' 
                   : 'hover:bg-zinc-900/60 hover:border-zinc-800/40'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 shrink-0 transition-colors duration-200"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggle(sub.id, sub.concluida)}
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200
                   ${sub.concluida
                     ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                     : 'border-zinc-650 hover:border-violet-500/50 hover:bg-zinc-800/50'
                   }`}
      >
        {sub.concluida && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
      </button>
      <span className={`flex-1 text-[13px] transition-all duration-200 ${
        sub.concluida ? 'text-zinc-550 line-through' : 'text-zinc-300 font-medium'
      }`}>
        {sub.titulo}
      </span>
      <button
        onClick={() => onDelete(sub.id)}
        className="p-1 rounded-md opacity-0 group-hover/sub:opacity-100 text-zinc-550 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function TaskDetailModal ({ tarefa, onClose }: TaskDetailModalProps)
{
  const updateTarefa = useTaskStore((s) => s.updateTarefa);
  const deleteTarefa = useTaskStore((s) => s.deleteTarefa);
  const createSubtarefa = useTaskStore((s) => s.createSubtarefa);
  const updateSubtarefa = useTaskStore((s) => s.updateSubtarefa);
  const deleteSubtarefa = useTaskStore((s) => s.deleteSubtarefa);
  const reorderSubtarefas = useTaskStore((s) => s.reorderSubtarefas);
  const allLabels = useTaskStore((s) => s.labels);
  const addLabelToTarefa = useTaskStore((s) => s.addLabelToTarefa);
  const removeLabelFromTarefa = useTaskStore((s) => s.removeLabelFromTarefa);

  // busca tarefa atualizada do store a cada render
  const tarefaAtual = useTaskStore((s) => s.tarefas.find((t) => t.id === tarefa.id)) || tarefa;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(tarefaAtual.titulo);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(tarefaAtual.notas_locais || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPrioMenu, setShowPrioMenu] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // fecha modal com esc
  useEffect(() =>
  {
    const handler = (e: KeyboardEvent) => { if ( e.key === 'Escape' ) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // foca no input de titulo ao editar
  useEffect(() =>
  {
    if ( editingTitle ) titleInputRef.current?.focus();
  }, [editingTitle]);

  const origin = ORIGINS[tarefaAtual.origem] || ORIGINS_FALLBACK;
  const OriginIcon = origin.Icon;
  const prioConfig = PRIORIDADE_CONFIG[tarefaAtual.prioridade] || PRIORIDADE_CONFIG.media;
  const statusConfig = STATUS_CONFIG[tarefaAtual.status] || STATUS_CONFIG.pendente;
  const subs = tarefaAtual.subtarefas || [];
  const subsDone = subs.filter((s) => s.concluida).length;
  const subsPct = subs.length > 0 ? Math.round((subsDone / subs.length) * 100) : 0;
  const isIA = ['gmail_triage', 'gmail_mock', 'gmail_api'].includes(tarefaAtual.origem);
  const due = dueDateInfo(tarefaAtual.data_vencimento);

  /* handlers */
  const saveTitle = async () =>
  {
    if ( titleDraft.trim() && titleDraft !== tarefaAtual.titulo )
    {
      await updateTarefa(tarefaAtual.id, { titulo: titleDraft.trim() });
      toast.success('Título atualizado');
    }
    setEditingTitle(false);
  };

  const saveNotes = async () =>
  {
    await updateTarefa(tarefaAtual.id, { notas_locais: notesDraft.trim() || '' });
    toast.success('Notas salvas');
    setEditingNotes(false);
  };

  const handleAddSubtask = async () =>
  {
    if ( !newSubtask.trim() ) return;
    setAddingSubtask(true);
    await createSubtarefa(tarefaAtual.id, newSubtask.trim());
    setNewSubtask('');
    setAddingSubtask(false);
  };

  const toggleSubtask = async (subId: number, concluida: boolean) =>
  {
    await updateSubtarefa(subId, { concluida: !concluida });
  };

  const handleDeleteSubtask = async (subId: number) =>
  {
    await deleteSubtarefa(subId, tarefaAtual.id);
  };

  // C8: drag reorder subtarefas
  const subSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleSubDragEnd = (event: DragEndEvent) =>
  {
    const { active, over } = event;
    if ( !over || active.id === over.id ) return;
    const oldIndex = subs.findIndex((s) => s.id === Number(active.id));
    const newIndex = subs.findIndex((s) => s.id === Number(over.id));
    if ( oldIndex === -1 || newIndex === -1 ) return;
    const newOrder = arrayMove(subs.map((s) => s.id), oldIndex, newIndex);
    reorderSubtarefas(tarefaAtual.id, newOrder);
  };

  const changeStatus = async (newStatus: string) =>
  {
    await updateTarefa(tarefaAtual.id, { status: newStatus });
    setShowStatusMenu(false);
    toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label}`);
  };

  const changePriority = async (newPrio: string) =>
  {
    await updateTarefa(tarefaAtual.id, { prioridade: newPrio });
    setShowPrioMenu(false);
    toast.success(`Prioridade → ${PRIORIDADE_CONFIG[newPrio]?.label}`);
  };

  const handleDelete = async () =>
  {
    await deleteTarefa(tarefaAtual.id);
    toast.success('Tarefa excluída');
    onClose();
  };

  const toggleLabel = async (label: Label) =>
  {
    const hasLabel = tarefaAtual.labels?.some((l) => l.id === label.id);
    if ( hasLabel )
    {
      await removeLabelFromTarefa(tarefaAtual.id, label.id);
    }
    else
    {
      await addLabelToTarefa(tarefaAtual.id, label.id);
    }
  };

  // ── Sprint D: tempo, recorrência, dependências, atividade ──

  const [activeTab, setActiveTab] = useState<'detalhes' | 'atividade'>('detalhes');
  const [tempo, setTempo] = useState<TempoTarefa | null>(null);
  const [recorrencia, setRecorrencia] = useState<RecorrenciaTarefa | null>(null);
  const [dependencias, setDependencias] = useState<DependenciaTarefa[]>([]);
  const [atividades, setAtividades] = useState<AtividadeTarefa[]>([]);
  const [showFreqMenu, setShowFreqMenu] = useState(false);
  const [showDepPicker, setShowDepPicker] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const tarefas = useTaskStore((s) => s.tarefas);

  // busca dados sprint D na abertura do modal
  useEffect(() =>
  {
    let cancelled = false;
    async function fetchD ()
    {
      setLoadingD(true);
      try
      {
        // tempo em foco
        const { data: sessoes } = await supabase
          .from('sessoes_foco')
          .select('id, duracao_minutos, created_at')
          .eq('tarefa_id', tarefaAtual.id);
        if (!cancelled && sessoes)
        {
          const total = sessoes.reduce((s, x) => s + (x.duracao_minutos || 0), 0);
          setTempo({ total_minutos: total, sessoes });
        }

        // recorrência
        const { data: rec } = await supabase
          .from('tarefa_recorrencias')
          .select('*')
          .eq('tarefa_id', tarefaAtual.id)
          .maybeSingle();
        if (!cancelled) setRecorrencia(rec ?? null);

        // dependências
        const { data: deps } = await supabase
          .from('tarefa_dependencias')
          .select('*')
          .eq('tarefa_id', tarefaAtual.id);
        if (!cancelled) setDependencias(deps ?? []);

        // atividades
        const { data: ativ } = await supabase
          .from('atividades_tarefa')
          .select('*')
          .eq('tarefa_id', tarefaAtual.id)
          .order('created_at', { ascending: false });
        if (!cancelled) setAtividades(ativ ?? []);
      }
      catch (e) { console.error('fetchD:', e); }
      if (!cancelled) setLoadingD(false);
    }
    fetchD();
    return () => { cancelled = true; };
  }, [tarefaAtual.id]);

  const handleSaveRecorrencia = async (freq: string) =>
  {
    const { data, error } = await supabase
      .from('tarefa_recorrencias')
      .upsert({ tarefa_id: tarefaAtual.id, frequencia: freq }, { onConflict: 'tarefa_id' })
      .select()
      .single();
    if (!error && data)
    {
      setRecorrencia(data);
      toast.success(`Recorrência ${freq} ativada`);
    }
    setShowFreqMenu(false);
  };

  const handleRemoveRecorrencia = async () =>
  {
    const { error } = await supabase
      .from('tarefa_recorrencias')
      .delete()
      .eq('tarefa_id', tarefaAtual.id);
    if (!error)
    {
      setRecorrencia(null);
      toast.success('Recorrência removida');
    }
  };

  const handleAddDep = async (depId: number) =>
  {
    const { data, error } = await supabase
      .from('tarefa_dependencias')
      .insert({ tarefa_id: tarefaAtual.id, depende_de_id: depId })
      .select()
      .single();
    if (!error && data)
    {
      setDependencias((prev) => [...prev, data]);
      toast.success('Dependência adicionada');
    }
    setShowDepPicker(false);
  };

  const handleRemoveDep = async (depItemId: number) =>
  {
    const { error } = await supabase
      .from('tarefa_dependencias')
      .delete()
      .eq('id', depItemId);
    if (!error)
    {
      setDependencias((prev) => prev.filter((d) => d.id !== depItemId));
      toast.success('Dependência removida');
    }
  };

  const FREQ_LABELS: Record<string, string> = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal' };
  const TIPO_ICON: Record<string, LucideIcon> = {
    criou: Sparkles,
    editou: Pencil,
    moveu: ArrowUpRight,
    concluiu: Check,
    arquivou: Archive,
    comentou: MessageSquare,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden p-4 md:p-6 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative bg-zinc-950/95 border border-zinc-800/80 rounded-2xl shadow-[0_0_80px_-15px_rgba(139,92,246,0.18)] 
                   w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* faixa de cor da prioridade no topo */}
        <div className={`h-1 w-full shrink-0 bg-gradient-to-r ${
          tarefaAtual.prioridade === 'critica' ? 'from-rose-500 to-red-650' :
          tarefaAtual.prioridade === 'alta' ? 'from-amber-500 to-orange-500' :
          tarefaAtual.prioridade === 'media' ? 'from-sky-500 to-indigo-500' :
          'from-zinc-600 to-zinc-700'
        }`} />

        {/* header */}
        <div className="px-8 py-5 border-b border-zinc-800/30 flex items-center justify-between shrink-0 bg-zinc-950/50 z-20">
          <div className="flex items-center gap-3">
            {/* badge ia */}
            {isIA && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">JARVIS Triage</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-500 text-[12px] font-semibold tracking-wider">
              <Hash className="w-3.5 h-3.5" />
              <span>TASK-{tarefaAtual.id}</span>
            </div>
          </div>

          {/* botão fechar */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* corpo: 2 colunas no desktop */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* coluna principal — conteúdo */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
            
            {/* titulo editável */}
            <div className="space-y-3">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { 
                    if ( e.key === 'Enter' ) saveTitle(); 
                    if ( e.key === 'Escape' ) setEditingTitle(false); 
                  }}
                  className="w-full bg-zinc-900/50 border border-violet-500/30 rounded-xl px-4 py-2 text-2xl font-bold text-white outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                />
              ) : (
                <h1
                  onClick={() => { setTitleDraft(tarefaAtual.titulo); setEditingTitle(true); }}
                  className="text-2xl font-bold text-white tracking-tight cursor-pointer hover:bg-zinc-900/30 rounded-xl px-4 py-2 -mx-4 transition-all duration-200 flex items-center gap-2 group/title"
                >
                  <span>{tarefaAtual.titulo}</span>
                  <Pencil className="w-4 h-4 text-zinc-500 opacity-0 group-hover/title:opacity-100 transition-opacity duration-200 shrink-0" />
                </h1>
              )}

              {/* meta info linha */}
              <div className="flex items-center gap-4 text-[12px] text-zinc-500 px-1 border-b border-zinc-800/20 pb-4">
                <div className={`flex items-center gap-1.5 ${origin.color} font-semibold`}>
                  <OriginIcon className="w-4 h-4" />
                  <span>{origin.label}</span>
                </div>
                {tarefaAtual.created_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Criada em {formatDate(tarefaAtual.created_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* tabs: detalhes / atividade */}
            <div className="flex border-b border-zinc-800/30 -mx-8 px-8 shrink-0">
              <button
                onClick={() => setActiveTab('detalhes')}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-bold transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === 'detalhes'
                    ? 'border-violet-500 text-violet-400 shadow-[0_4px_12px_rgba(139,92,246,0.1)]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <FileText className="w-4 h-4" /> Detalhes
              </button>
              <button
                onClick={() => setActiveTab('atividade')}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-bold transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === 'atividade'
                    ? 'border-violet-500 text-violet-400 shadow-[0_4px_12px_rgba(139,92,246,0.1)]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Activity className="w-4 h-4" /> Linha do Tempo
                {atividades.length > 0 && (
                  <span className="text-[10px] bg-zinc-800/80 text-zinc-400 rounded-full px-2 py-0.5 font-extrabold">{atividades.length}</span>
                )}
              </button>
            </div>

            {/* tab atividade */}
            {activeTab === 'atividade' && (
              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
                {loadingD && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  </div>
                )}
                {!loadingD && atividades.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[13px] text-zinc-500">Nenhum evento registrado nesta tarefa.</p>
                  </div>
                )}
                <div className="relative border-l border-zinc-800/60 ml-3.5 pl-6 space-y-6">
                  {atividades.map((ativ) => (
                    <div key={ativ.id} className="relative group">
                      {/* Timeline bullet dot */}
                      <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-zinc-950 border-2 border-violet-500 flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
                      
                      <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-3.5 hover:border-zinc-800/60 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-1">
                          {(() =>
                          {
                            const Icon = TIPO_ICON[ativ.tipo] ?? Circle;
                            return <Icon size={14} strokeWidth={1.5} className="text-violet-400 shrink-0" />;
                          })()}
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                            {ativ.tipo}
                          </span>
                          {ativ.created_at && (
                            <span className="text-[10px] text-zinc-650 ml-auto font-medium">
                              {formatDate(ativ.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-zinc-300 font-medium">
                          {ativ.detalhe || ativ.tipo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* tab detalhes */}
            {activeTab === 'detalhes' && (
              <div className="space-y-8">
                
                {/* snippet / descrição */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <FileText className="w-4 h-4 text-violet-400/80" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Descrição</span>
                  </div>
                  <div className="text-[13px] text-zinc-300 leading-relaxed bg-zinc-900/25 border border-zinc-850 rounded-xl p-4 shadow-inner hover:border-zinc-800/60 transition-all duration-200">
                    {tarefaAtual.descricao || tarefaAtual.snippet_100_char || (
                      <span className="text-zinc-600 italic">Sem descrição registrada</span>
                    )}
                  </div>
                </div>

                {/* subtarefas / checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-violet-400/80" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Subtarefas</span>
                      {subs.length > 0 && (
                        <span className="text-[11px] bg-zinc-900 text-zinc-500 font-bold px-2 py-0.5 rounded-full border border-zinc-800/50">
                          {subsDone} / {subs.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* barra de progresso da checklist */}
                  {subs.length > 0 && (
                    <div className="flex items-center gap-3 bg-zinc-900/35 border border-zinc-850 rounded-xl px-4 py-2.5">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                            subsPct === 100 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                              : 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                          }`}
                          style={{ width: `${subsPct}%` }}
                        />
                      </div>
                      <span className={`text-[12px] font-bold tabular-nums min-w-[36px] text-right ${subsPct === 100 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {subsPct}%
                      </span>
                    </div>
                  )}

                  {/* lista de subtarefas — C8: drag reorder */}
                  <DndContext sensors={subSensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd}>
                    <SortableContext items={subs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                        {subs.map((sub) => (
                          <SortableSubtaskItem
                            key={sub.id}
                            sub={sub}
                            onToggle={toggleSubtask}
                            onDelete={handleDeleteSubtask}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* adicionar nova subtarefa */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => { if ( e.key === 'Enter' ) handleAddSubtask(); }}
                      placeholder="Adicionar nova subtarefa..."
                      className="flex-1 bg-zinc-900/30 border border-zinc-800/60 rounded-xl px-4 py-2
                                 text-[13px] text-white placeholder:text-zinc-650
                                 outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all duration-200"
                    />
                    <button
                      onClick={handleAddSubtask}
                      disabled={!newSubtask.trim() || addingSubtask}
                      className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all duration-200
                                 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    >
                      {addingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* notas locais */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-violet-400/80" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Notas Pessoais</span>
                    </div>
                    {!editingNotes && (
                      <button
                        onClick={() => { setNotesDraft(tarefaAtual.notas_locais || ''); setEditingNotes(true); }}
                        className="text-[11px] text-zinc-500 hover:text-violet-400 transition-colors font-semibold"
                      >
                        Editar notas
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2.5">
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-900/30 border border-zinc-800/60 rounded-xl px-4 py-3
                                   text-[13px] text-white placeholder:text-zinc-650
                                   outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all duration-200 resize-none"
                        placeholder="Digite anotações ou observações específicas sobre esta tarefa..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={saveNotes} className="px-4 py-2 text-[12px] font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-all duration-200">
                          Salvar
                        </button>
                        <button onClick={() => setEditingNotes(false)} className="px-4 py-2 text-[12px] font-bold text-zinc-400 hover:text-zinc-200 transition-all duration-200">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { setNotesDraft(tarefaAtual.notas_locais || ''); setEditingNotes(true); }}
                      className="text-[13px] text-zinc-450 bg-zinc-900/15 border border-zinc-850 rounded-xl p-4 min-h-[80px] cursor-pointer hover:border-zinc-800/50 hover:bg-zinc-900/25 transition-all duration-200"
                    >
                      {tarefaAtual.notas_locais || (
                        <span className="text-zinc-600 italic">Clique para adicionar notas...</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* sidebar direita — propriedades */}
          <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/30 bg-zinc-900/15 overflow-y-auto p-6 space-y-6 flex flex-col justify-between scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
            
            <div className="space-y-6">
              
              {/* status */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold block">Status</label>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold transition-all duration-200
                             bg-zinc-900/35 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700/60`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      tarefaAtual.status === 'pendente' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                      tarefaAtual.status === 'em_progresso' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    }`} />
                    <span className={statusConfig.color}>{statusConfig.label}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </button>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {STATUS_OPTIONS.map((st) => {
                        const cfg = STATUS_CONFIG[st];
                        const isSelected = tarefaAtual.status === st;
                        return (
                          <button
                            key={st}
                            onClick={() => changeStatus(st)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors hover:bg-zinc-900
                                       ${isSelected ? cfg.color + ' font-semibold bg-zinc-900/40' : 'text-zinc-400'}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              st === 'pendente' ? 'bg-red-500' : st === 'em_progresso' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <span className="flex-1">{cfg.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* prioridade */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] text-zinc-555 uppercase tracking-widest font-bold block">Prioridade</label>
                <button
                  onClick={() => setShowPrioMenu(!showPrioMenu)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold transition-all duration-200
                             bg-zinc-900/35 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700/60`}
                >
                  <span className="flex items-center gap-2.5">
                    <Zap className={`w-4 h-4 ${
                      tarefaAtual.prioridade === 'critica' ? 'text-red-500' : 
                      tarefaAtual.prioridade === 'alta' ? 'text-amber-500' : 
                      tarefaAtual.prioridade === 'media' ? 'text-sky-500' : 
                      'text-zinc-500'
                    }`} />
                    <span className={prioConfig.color}>{prioConfig.label}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </button>
                {showPrioMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPrioMenu(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {PRIO_OPTIONS.map((pr) => {
                        const cfg = PRIORIDADE_CONFIG[pr];
                        const isSelected = tarefaAtual.prioridade === pr;
                        return (
                          <button
                            key={pr}
                            onClick={() => changePriority(pr)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors hover:bg-zinc-900
                                       ${isSelected ? cfg.color + ' font-semibold bg-zinc-900/40' : 'text-zinc-400'}`}
                          >
                            <Zap className={`w-3.5 h-3.5 ${
                              pr === 'critica' ? 'text-red-500' : 
                              pr === 'alta' ? 'text-amber-500' : 
                              pr === 'media' ? 'text-sky-500' : 
                              'text-zinc-500'
                            }`} />
                            <span className="flex-1">{cfg.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* urgência / score */}
              <div className="space-y-2.5 bg-zinc-900/20 border border-zinc-850 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Score de Urgência</span>
                  <span className="text-[13px] font-extrabold tabular-nums text-zinc-350">{tarefaAtual.score_urgencia}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        tarefaAtual.score_urgencia > 80 ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                        tarefaAtual.score_urgencia > 40 ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 
                        'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      }`}
                      style={{ width: `${Math.min(tarefaAtual.score_urgencia, 100)}%` }}
                    />
                  </div>
                </div>
                {tarefaAtual.score_urgencia > 100 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> 
                    <span>Foco Crítico Excedido</span>
                  </div>
                )}
              </div>

              {/* data de vencimento */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold block">Prazo final</span>
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold ${due.bg} ${due.color} border-transparent shadow-sm`}>
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="truncate">{due.text}</span>
                </div>
              </div>

              {/* labels */}
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Marcadores</span>
                  <button
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                    className="p-1 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* picker de labels */}
                {showLabelPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLabelPicker(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {allLabels.length > 0 ? (
                        allLabels.map((lb) => {
                          const isActive = tarefaAtual.labels?.some((l) => l.id === lb.id);
                          return (
                            <button
                              key={lb.id}
                              onClick={() => toggleLabel(lb)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-left transition-colors
                                         ${isActive ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:bg-zinc-900'}`}
                            >
                              <span className="w-3 h-3 rounded-full border shrink-0" style={{ backgroundColor: isActive ? lb.cor : 'transparent', borderColor: lb.cor }} />
                              <span className="flex-1 truncate">{lb.nome}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-2 text-[11px] text-zinc-650">Nenhum marcador disponível</div>
                      )}
                    </div>
                  </>
                )}

                {/* labels atuais */}
                <div className="flex flex-wrap gap-1.5">
                  {(tarefaAtual.labels || []).map((lb) => (
                    <span
                      key={lb.id}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer
                                 hover:opacity-75 active:scale-95 transition-all duration-200"
                      style={{ color: lb.cor, backgroundColor: `${lb.cor}10`, borderColor: `${lb.cor}30` }}
                      onClick={() => toggleLabel(lb)}
                      title="Clique para remover"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{lb.nome}</span>
                      <X className="w-2.5 h-2.5 ml-0.5 opacity-60 hover:opacity-100" />
                    </span>
                  ))}
                  {(tarefaAtual.labels || []).length === 0 && !showLabelPicker && (
                    <span className="text-[11px] text-zinc-600 italic">Sem marcadores atribuídos</span>
                  )}
                </div>
              </div>

              {/* D2: tempo registrado em foco */}
              <div className="border-t border-zinc-800/40 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Timer className="w-4 h-4 text-violet-400/80" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Tempo em Foco</span>
                </div>
                {tempo ? (
                  <div className="bg-zinc-900/20 border border-zinc-850 rounded-xl p-3">
                    <p className="text-[13px] font-extrabold text-white">
                      {tempo.total_minutos >= 60
                        ? `${Math.floor(tempo.total_minutos / 60)}h ${tempo.total_minutos % 60}m`
                        : `${tempo.total_minutos}m`}
                      <span className="text-[11px] font-normal text-zinc-550 ml-1.5">
                        em {tempo.sessoes.length} sessão{tempo.sessoes.length !== 1 ? 'ões' : ''}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-650 italic pl-1">Nenhuma sessão registrada</p>
                )}
              </div>

              {/* D3: recorrência */}
              <div className="border-t border-zinc-800/40 pt-4 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <RefreshCw className="w-4 h-4 text-violet-400/80" />
                    <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold">Recorrência</span>
                  </div>
                  {recorrencia && (
                    <button onClick={handleRemoveRecorrencia} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">
                      Remover
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowFreqMenu(!showFreqMenu)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[12px] font-semibold transition-all duration-200 ${
                    recorrencia
                      ? 'border-violet-500/30 bg-violet-500/5 text-violet-400 hover:border-violet-500/50'
                      : 'border-zinc-800/50 text-zinc-500 hover:border-zinc-700/60 hover:text-zinc-400'
                  }`}
                >
                  <span>{recorrencia ? `${FREQ_LABELS[recorrencia.frequencia] ?? recorrencia.frequencia}` : 'Não se repete'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showFreqMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFreqMenu(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-1.5 z-20 bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      {['diaria', 'semanal', 'mensal'].map((f) => (
                        <button key={f} onClick={() => handleSaveRecorrencia(f)}
                          className="w-full text-left px-3.5 py-2.5 text-[12px] text-zinc-300 hover:bg-zinc-900 transition-colors font-semibold">
                          {FREQ_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* D4: dependências */}
              <div className="border-t border-zinc-800/40 pt-4 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Link className="w-3.5 h-3.5 text-violet-400/80" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bloqueada por</span>
                  </div>
                  <button
                    onClick={() => setShowDepPicker(!showDepPicker)}
                    className="p-1 rounded-lg bg-zinc-900/40 border border-zinc-800/50 text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all duration-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                
                {showDepPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDepPicker(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-1.5 z-20 max-h-40 overflow-y-auto space-y-0.5 bg-zinc-950 border border-zinc-800/80 rounded-xl p-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 scrollbar-thin">
                      {tarefas
                        .filter((t) => t.id !== tarefaAtual.id && t.status !== 'concluida' && !dependencias.some((d) => d.depende_de_id === t.id))
                        .slice(0, 8)
                        .map((t) => (
                          <button key={t.id} onClick={() => handleAddDep(t.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] text-zinc-300 hover:bg-zinc-900 transition-colors truncate font-semibold">
                            {t.titulo}
                          </button>
                        ))}
                      {tarefas.filter((t) => t.id !== tarefaAtual.id && t.status !== 'concluida' && !dependencias.some((d) => d.depende_de_id === t.id)).length === 0 && (
                        <div className="text-center py-2 text-[11px] text-zinc-600">Nenhuma tarefa disponível</div>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  {dependencias.map((dep) => (
                    <div key={dep.id} className="flex items-center gap-2.5 bg-zinc-900/20 border border-zinc-850 px-3 py-1.5 rounded-xl text-[12px]">
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className={`flex-1 truncate font-semibold ${dep.depende_de_status === 'concluida' ? 'line-through text-zinc-650' : 'text-zinc-350'}`}>
                        {dep.depende_de_titulo}
                      </span>
                      <button onClick={() => handleRemoveDep(dep.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {dependencias.length === 0 && !showDepPicker && (
                    <p className="text-[11px] text-zinc-650 italic pl-1">Sem dependências ativas</p>
                  )}
                </div>
              </div>
            </div>

            {/* ações */}
            <div className="border-t border-zinc-800/40 pt-4 space-y-2 mt-auto shrink-0">
              {tarefaAtual.status !== 'concluida' && (
                <button
                  onClick={() => changeStatus('concluida')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-extrabold
                             bg-gradient-to-r from-emerald-600 to-teal-650 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-emerald-950/20"
                >
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>Concluir Tarefa</span>
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                  {
                    useTaskStore.getState().startFocusSession(tarefa.id);
                    useTaskStore.getState().setActiveView('foco');
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-bold
                             text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl
                             hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>Focar</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-bold
                             text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl
                             hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
