import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, Tag, Hash, Zap, Sparkles,
  CheckSquare, Plus, Trash2, Pencil, Check, AlertTriangle, GripVertical,
  FileText, StickyNote, ArrowRight, Loader2, ChevronDown,
  RefreshCw, Link, Activity, Timer, Play,
} from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { apiFetch } from '../../store/api';
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
      className={`flex items-center gap-3 px-3 py-2 rounded-lg group/sub transition-colors
                 ${sub.concluida ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggle(sub.id, sub.concluida)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                   ${sub.concluida
                     ? 'bg-emerald-500 border-emerald-500 text-white'
                     : 'border-zinc-600 hover:border-violet-500/50'
                   }`}
      >
        {sub.concluida && <Check className="w-3 h-3" />}
      </button>
      <span className={`flex-1 text-[13px] transition-all ${
        sub.concluida ? 'text-zinc-500 line-through' : 'text-zinc-300'
      }`}>
        {sub.titulo}
      </span>
      <button
        onClick={() => onDelete(sub.id)}
        className="p-1 rounded opacity-0 group-hover/sub:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3 h-3" />
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
      const [rTempo, rRec, rDeps, rAtiv] = await Promise.allSettled([
        apiFetch(`/tarefas/${tarefaAtual.id}/tempo`),
        apiFetch(`/tarefas/${tarefaAtual.id}/recorrencia`),
        apiFetch(`/tarefas/${tarefaAtual.id}/dependencias`),
        apiFetch(`/tarefas/${tarefaAtual.id}/atividades`),
      ]);
      if ( cancelled ) return;
      if ( rTempo.status === 'fulfilled' && rTempo.value.ok )
        setTempo(await rTempo.value.json());
      if ( rRec.status === 'fulfilled' && rRec.value.ok )
      {
        const j = await rRec.value.json();
        setRecorrencia(j.recorrencia ?? null);
      }
      if ( rDeps.status === 'fulfilled' && rDeps.value.ok )
      {
        const j = await rDeps.value.json();
        setDependencias(j.dependencias ?? []);
      }
      if ( rAtiv.status === 'fulfilled' && rAtiv.value.ok )
      {
        const j = await rAtiv.value.json();
        setAtividades(j.atividades ?? []);
      }
      setLoadingD(false);
    }
    fetchD();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaAtual.id]);

  const handleSaveRecorrencia = async (freq: string) =>
  {
    const res = await apiFetch(`/tarefas/${tarefaAtual.id}/recorrencia`, {
      method: 'POST',
      body: JSON.stringify({ frequencia: freq }),
    });
    if ( res.ok )
    {
      const j = await res.json();
      setRecorrencia(j.recorrencia);
      toast.success(`Recorrência ${freq} ativada`);
    }
    setShowFreqMenu(false);
  };

  const handleRemoveRecorrencia = async () =>
  {
    const res = await apiFetch(`/tarefas/${tarefaAtual.id}/recorrencia`, { method: 'DELETE' });
    if ( res.ok )
    {
      setRecorrencia(null);
      toast.success('Recorrência removida');
    }
  };

  const handleAddDep = async (depId: number) =>
  {
    const res = await apiFetch(`/tarefas/${tarefaAtual.id}/dependencias?depende_de_id=${depId}`, { method: 'POST' });
    if ( res.ok )
    {
      const j = await res.json();
      if ( j.dependencia ) setDependencias((prev) => [...prev, j.dependencia]);
      toast.success('Dependência adicionada');
    }
    setShowDepPicker(false);
  };

  const handleRemoveDep = async (depItemId: number) =>
  {
    const res = await apiFetch(`/tarefas/${tarefaAtual.id}/dependencias/${depItemId}`, { method: 'DELETE' });
    if ( res.ok )
    {
      setDependencias((prev) => prev.filter((d) => d.id !== depItemId));
      toast.success('Dependência removida');
    }
  };

  const FREQ_LABELS: Record<string, string> = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal' };
  const TIPO_ICON: Record<string, string> = {
    criou: '✨', editou: '✏️', moveu: '↗️', concluiu: '✅', arquivou: '📦', comentou: '💬',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-zinc-950 border border-zinc-800/60 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden
                   animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* faixa de cor da prioridade no topo */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${
          tarefaAtual.prioridade === 'critica' ? 'from-red-500 to-rose-600' :
          tarefaAtual.prioridade === 'alta' ? 'from-amber-500 to-orange-500' :
          tarefaAtual.prioridade === 'media' ? 'from-blue-500 to-indigo-500' :
          'from-zinc-600 to-zinc-700'
        }`} />

        {/* header */}
        <div className="px-6 pt-5 pb-4 border-b border-zinc-800/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* badge ia */}
              {isIA && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 mb-2">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">capturada por ia</span>
                </div>
              )}

              {/* titulo editável */}
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if ( e.key === 'Enter' ) saveTitle(); if ( e.key === 'Escape' ) setEditingTitle(false); }}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none border-b-2 border-violet-500/50 pb-1"
                />
              ) : (
                <h2
                  className="text-xl font-bold text-white leading-tight cursor-pointer hover:text-violet-300 transition-colors group/title"
                  onClick={() => { setTitleDraft(tarefaAtual.titulo); setEditingTitle(true); }}
                >
                  {tarefaAtual.titulo}
                  <Pencil className="inline w-3.5 h-3.5 ml-2 opacity-0 group-hover/title:opacity-50 transition-opacity" />
                </h2>
              )}

              {/* meta info linha */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Hash className="w-3 h-3" />{tarefaAtual.id}
                </span>
                <span className={`flex items-center gap-1 text-[11px] ${origin.color}`}>
                  <OriginIcon className="w-3 h-3" />{origin.label}
                </span>
                {tarefaAtual.created_at && (
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="w-3 h-3" />{formatDate(tarefaAtual.created_at)}
                  </span>
                )}
              </div>
            </div>

            {/* botão fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* tabs: detalhes / atividade */}
        <div className="flex border-b border-zinc-800/40">
          <button
            onClick={() => setActiveTab('detalhes')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-[12px] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'detalhes'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Detalhes
          </button>
          <button
            onClick={() => setActiveTab('atividade')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-[12px] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'atividade'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Atividade
            {atividades.length > 0 && (
              <span className="ml-1 text-[10px] bg-zinc-800 text-zinc-400 rounded-full px-1.5 py-0.5">{atividades.length}</span>
            )}
          </button>
        </div>

        {/* tab atividade */}
        {activeTab === 'atividade' && (
          <div className="p-6 space-y-3 min-h-[200px]">
            {loadingD && <p className="text-[12px] text-zinc-500">Carregando...</p>}
            {!loadingD && atividades.length === 0 && (
              <p className="text-[12px] text-zinc-600">Nenhum evento registrado ainda.</p>
            )}
            {atividades.map((ativ) => (
              <div key={ativ.id} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">{TIPO_ICON[ativ.tipo] ?? '🔹'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-zinc-300">{ativ.detalhe || ativ.tipo}</p>
                  {ativ.created_at && (
                    <p className="text-[11px] text-zinc-600 mt-0.5">{formatDate(ativ.created_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* tab detalhes (original) */}
        {activeTab === 'detalhes' && (
        /* corpo: 2 colunas no desktop */
        <div className="flex flex-col lg:flex-row">
          {/* coluna principal — conteúdo */}
          <div className="flex-1 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-zinc-800/30">

            {/* snippet / descrição */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <h3 className="text-[13px] font-semibold text-zinc-300">Descrição</h3>
              </div>
              <p className="text-[13px] text-zinc-400 leading-relaxed bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/30">
                {tarefaAtual.descricao || tarefaAtual.snippet_100_char || 'Sem descrição'}
              </p>
            </div>

            {/* subtarefas / checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-[13px] font-semibold text-zinc-300">
                    Lista de Verificação
                  </h3>
                  {subs.length > 0 && (
                    <span className="text-[11px] text-zinc-500 font-medium ml-1">
                      {subsDone} de {subs.length}
                    </span>
                  )}
                </div>
              </div>

              {/* barra de progresso da checklist */}
              {subs.length > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 rounded-full bg-zinc-800/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        subsPct === 100 ? 'bg-emerald-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${subsPct}%` }}
                    />
                  </div>
                  <span className={`text-[12px] font-bold tabular-nums ${subsPct === 100 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {subsPct}%
                  </span>
                </div>
              )}

              {/* lista de subtarefas — C8: drag reorder */}
              <DndContext sensors={subSensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd}>
                <SortableContext items={subs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
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
                  placeholder="Adicionar item..."
                  className="flex-1 bg-zinc-800/30 border border-zinc-800/40 rounded-lg px-3 py-2
                             text-[13px] text-white placeholder:text-zinc-600
                             outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim() || addingSubtask}
                  className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {addingSubtask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* notas locais */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-[13px] font-semibold text-zinc-300">Notas</h3>
                </div>
                {!editingNotes && (
                  <button
                    onClick={() => { setNotesDraft(tarefaAtual.notas_locais || ''); setEditingNotes(true); }}
                    className="text-[11px] text-zinc-500 hover:text-violet-400 transition-colors"
                  >
                    Editar
                  </button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-800/30 border border-zinc-700/40 rounded-lg px-3 py-2
                               text-[13px] text-white placeholder:text-zinc-600
                               outline-none focus:ring-1 focus:ring-violet-500/40 transition-all resize-none"
                    placeholder="Escreva suas notas aqui..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={saveNotes} className="px-3 py-1.5 text-[12px] font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors">
                      Salvar
                    </button>
                    <button onClick={() => setEditingNotes(false)} className="px-3 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-zinc-500 bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/20 min-h-[60px]">
                  {tarefaAtual.notas_locais || 'Nenhuma nota adicionada.'}
                </p>
              )}
            </div>
          </div>

          {/* sidebar direita — propriedades */}
          <div className="w-full lg:w-64 p-5 space-y-5 bg-zinc-900/30">
            {/* status */}
            <div className="relative">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Status</span>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors
                           ${statusConfig.bg} ${statusConfig.color} border-zinc-800/40 hover:border-zinc-700/60`}
              >
                {statusConfig.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1">
                  {STATUS_OPTIONS.map((st) => {
                    const cfg = STATUS_CONFIG[st];
                    return (
                      <button
                        key={st}
                        onClick={() => changeStatus(st)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-zinc-800
                                   ${tarefaAtual.status === st ? cfg.color + ' font-semibold' : 'text-zinc-400'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          st === 'pendente' ? 'bg-red-500' : st === 'em_progresso' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* prioridade */}
            <div className="relative">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Prioridade</span>
              <button
                onClick={() => setShowPrioMenu(!showPrioMenu)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors
                           ${prioConfig.bg} ${prioConfig.color} ${prioConfig.border} hover:border-zinc-600/60`}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {prioConfig.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showPrioMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1">
                  {PRIO_OPTIONS.map((pr) => {
                    const cfg = PRIORIDADE_CONFIG[pr];
                    return (
                      <button
                        key={pr}
                        onClick={() => changePriority(pr)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-zinc-800
                                   ${tarefaAtual.prioridade === pr ? cfg.color + ' font-semibold' : 'text-zinc-400'}`}
                      >
                        <Zap className="w-3 h-3" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* urgência / score */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Score de Urgência</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-zinc-800/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tarefaAtual.score_urgencia > 80 ? 'bg-red-500' :
                      tarefaAtual.score_urgencia > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(tarefaAtual.score_urgencia, 100)}%` }}
                  />
                </div>
                <span className="text-[13px] font-bold tabular-nums text-zinc-300">{tarefaAtual.score_urgencia}</span>
              </div>
              {tarefaAtual.score_urgencia > 100 && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-red-400 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> Foco Crítico
                </div>
              )}
            </div>

            {/* data de vencimento */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">Prazo</span>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${due.bg}`}>
                <Calendar className={`w-4 h-4 ${due.color}`} />
                <span className={`text-[13px] font-medium ${due.color}`}>{due.text}</span>
              </div>
            </div>

            {/* labels */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Marcadores</span>
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="p-0.5 rounded text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* labels atuais */}
              <div className="flex flex-wrap gap-1.5">
                {(tarefaAtual.labels || []).map((lb) => (
                  <span
                    key={lb.id}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border cursor-pointer
                               hover:opacity-70 transition-opacity"
                    style={{ color: lb.cor, backgroundColor: `${lb.cor}15`, borderColor: `${lb.cor}30` }}
                    onClick={() => toggleLabel(lb)}
                    title="Clique para remover"
                  >
                    <Tag className="w-3 h-3" />
                    {lb.nome}
                  </span>
                ))}
                {(tarefaAtual.labels || []).length === 0 && !showLabelPicker && (
                  <span className="text-[11px] text-zinc-600">Nenhum marcador</span>
                )}
              </div>
              {/* picker de labels */}
              {showLabelPicker && allLabels.length > 0 && (
                <div className="mt-2 p-2 bg-zinc-900/60 border border-zinc-800/40 rounded-lg space-y-1">
                  {allLabels.map((lb) => {
                    const isActive = tarefaAtual.labels?.some((l) => l.id === lb.id);
                    return (
                      <button
                        key={lb.id}
                        onClick={() => toggleLabel(lb)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-colors
                                   ${isActive ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800/40'}`}
                      >
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: isActive ? lb.cor : 'transparent', borderColor: lb.cor }} />
                        {lb.nome}
                        {isActive && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ações */}
            <div className="pt-3 border-t border-zinc-800/30 space-y-2">
              {tarefaAtual.status !== 'concluida' && (
                <button
                  onClick={() => changeStatus('concluida')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold
                             bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Concluir
                </button>
              )}
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium
                           text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg
                           hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Tarefa
              </button>

              {/* D1: iniciar foco nesta tarefa */}
              <button
                onClick={() =>
                {
                  useTaskStore.getState().startFocusSession(tarefa.id);
                  useTaskStore.getState().setActiveView('foco');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium
                           text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg
                           hover:bg-emerald-500/10 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Iniciar Foco
              </button>

              {/* D2: tempo registrado em foco */}
              <div className="pt-3 border-t border-zinc-800/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Timer className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Tempo em Foco</span>
                </div>
                {tempo ? (
                  <p className="text-[13px] font-semibold text-white">
                    {tempo.total_minutos >= 60
                      ? `${Math.floor(tempo.total_minutos / 60)}h ${tempo.total_minutos % 60}m`
                      : `${tempo.total_minutos}m`}
                    <span className="text-[11px] font-normal text-zinc-500 ml-1">
                      em {tempo.sessoes.length} sessão{tempo.sessoes.length !== 1 ? 'ões' : ''}
                    </span>
                  </p>
                ) : (
                  <p className="text-[12px] text-zinc-600">Nenhuma sessão registrada</p>
                )}
              </div>

              {/* D3: recorrência */}
              <div className="pt-3 border-t border-zinc-800/30">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Recorrência</span>
                  </div>
                  {recorrencia && (
                    <button onClick={handleRemoveRecorrencia} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                      Remover
                    </button>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFreqMenu(!showFreqMenu)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[12px] transition-colors ${
                      recorrencia
                        ? 'border-violet-500/30 bg-violet-500/5 text-violet-300'
                        : 'border-zinc-800/40 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {recorrencia ? `${FREQ_LABELS[recorrencia.frequencia] ?? recorrencia.frequencia}` : 'Não se repete'}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showFreqMenu && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1">
                      {['diaria', 'semanal', 'mensal'].map((f) => (
                        <button key={f} onClick={() => handleSaveRecorrencia(f)}
                          className="w-full text-left px-3 py-2 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors">
                          {FREQ_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* D4: dependências */}
              <div className="pt-3 border-t border-zinc-800/30">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Link className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Bloqueada por</span>
                  </div>
                  <button
                    onClick={() => setShowDepPicker(!showDepPicker)}
                    className="p-0.5 rounded text-zinc-500 hover:text-violet-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {dependencias.map((dep) => (
                    <div key={dep.id} className="flex items-center gap-2 text-[12px]">
                      <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span className={`flex-1 truncate ${dep.depende_de_status === 'concluida' ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                        {dep.depende_de_titulo}
                      </span>
                      <button onClick={() => handleRemoveDep(dep.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {dependencias.length === 0 && !showDepPicker && (
                    <p className="text-[11px] text-zinc-600">Sem dependências</p>
                  )}
                </div>
                {showDepPicker && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5 bg-zinc-900/60 border border-zinc-800/40 rounded-lg p-1.5">
                    {tarefas
                      .filter((t) => t.id !== tarefaAtual.id && t.status !== 'concluida' && !dependencias.some((d) => d.depende_de_id === t.id))
                      .slice(0, 8)
                      .map((t) => (
                        <button key={t.id} onClick={() => handleAddDep(t.id)}
                          className="w-full text-left px-2 py-1.5 rounded text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors truncate">
                          {t.titulo}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
