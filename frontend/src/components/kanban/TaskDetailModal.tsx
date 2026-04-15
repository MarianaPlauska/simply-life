import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, Tag, Hash, Zap, Sparkles, Mail, Code2, MessageSquare, Square,
  CheckSquare, Plus, Trash2, Pencil, Check, AlertTriangle, GripVertical,
  FileText, StickyNote, ArrowRight, Loader2, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import type { TarefaUnificada, Label } from '../../types';

interface TaskDetailModalProps {
  tarefa: TarefaUnificada;
  onClose: () => void;
}

/* mapeamento de origem */
const ORIGINS: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  manual:       { label: 'Manual',       Icon: Square,         color: 'text-zinc-400'   },
  gmail_triage: { label: 'Gmail',        Icon: Mail,           color: 'text-blue-400'   },
  gmail_mock:   { label: 'Gmail (mock)', Icon: Mail,           color: 'text-violet-400' },
  gmail_api:    { label: 'Gmail API',    Icon: Mail,           color: 'text-blue-400'   },
  webhook:      { label: 'Webhook',      Icon: Code2,          color: 'text-violet-400' },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critica: { label: 'Crítica', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'   },
  alta:    { label: 'Alta',    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  media:   { label: 'Média',   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'  },
  baixa:   { label: 'Baixa',   color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   border: 'border-zinc-500/30'  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente:      { label: 'Pendente',      color: 'text-red-400',     bg: 'bg-red-500/10'     },
  em_progresso:  { label: 'Em Progresso',  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  concluida:     { label: 'Concluída',     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const STATUS_OPTIONS = ['pendente', 'em_progresso', 'concluida'] as const;
const PRIO_OPTIONS   = ['critica', 'alta', 'media', 'baixa'] as const;

/* helper para formatar data */
function formatDate (dateStr: string | null): string
{
  if ( !dateStr ) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* chip de data de vencimento com cor contextual */
function dueDateInfo (dateStr: string | null)
{
  if ( !dateStr ) return { text: 'Sem prazo', color: 'text-zinc-500', bg: 'bg-zinc-800/50' };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dateStr); venc.setHours(0, 0, 0, 0);
  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);

  if ( diff < 0 )       return { text: `${Math.abs(diff)}d atrasado`,   color: 'text-red-400',    bg: 'bg-red-500/10'    };
  if ( diff === 0 )      return { text: 'Vence hoje',                    color: 'text-amber-400',  bg: 'bg-amber-500/10'  };
  if ( diff <= 2 )       return { text: `Vence em ${diff}d`,             color: 'text-orange-400', bg: 'bg-orange-500/10' };
  return { text: formatDate(dateStr), color: 'text-zinc-400', bg: 'bg-zinc-800/50' };
}


export function TaskDetailModal ({ tarefa, onClose }: TaskDetailModalProps)
{
  const updateTarefa = useTaskStore((s) => s.updateTarefa);
  const deleteTarefa = useTaskStore((s) => s.deleteTarefa);
  const createSubtarefa = useTaskStore((s) => s.createSubtarefa);
  const updateSubtarefa = useTaskStore((s) => s.updateSubtarefa);
  const deleteSubtarefa = useTaskStore((s) => s.deleteSubtarefa);
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

  const origin = ORIGINS[tarefaAtual.origem] || { label: 'Outro', Icon: MessageSquare, color: 'text-zinc-400' };
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

  const changeStatus = async (newStatus: string) =>
  {
    await updateTarefa(tarefaAtual.id, { status: newStatus });
    setShowStatusMenu(false);
    toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label}`);
  };

  const changePriority = async (newPrio: string) =>
  {
    // usa PATCH com prioridade — precisa backend suportar
    await updateTarefa(tarefaAtual.id, { status: tarefaAtual.status });
    setShowPrioMenu(false);
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

        {/* corpo: 2 colunas no desktop */}
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

              {/* lista de subtarefas */}
              <div className="space-y-1">
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg group/sub transition-colors
                               ${sub.concluida ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'}`}
                  >
                    <button
                      onClick={() => toggleSubtask(sub.id, sub.concluida)}
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
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="p-1 rounded opacity-0 group-hover/sub:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

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
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium
                              ${prioConfig.bg} ${prioConfig.color} ${prioConfig.border}`}>
                <Zap className="w-3.5 h-3.5" />
                {prioConfig.label}
              </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
