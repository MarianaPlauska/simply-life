import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock, Languages, CheckSquare, Square,
  AlertTriangle, Sparkles, Calendar, MoreHorizontal, Pencil, Trash2, Copy, Timer,
  Wallet, Pill,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TarefaUnificada } from '../../types';
import { PRIO_BADGE, getOrigin } from '../../constants/kanbanConfig';
import { getElapsed, getUrgencyBadge } from '../../utils/kanbanHelpers';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskLineRow } from './TaskLineRow';

interface KanbanCardProps
{
  tarefa: TarefaUnificada;
  onEdit?: (tarefa: TarefaUnificada) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (id: number) => void;
  flat?: boolean;
}



/* chip de data de vencimento com cor contextual */
function DueDateChip ({ date }: { date: string })
{
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(date);
  venc.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);

  let cor = 'text-zinc-500';
  if (diffDias < 0) {
    cor = 'text-rose-400';
  } else if (diffDias === 0) {
    cor = 'text-amber-400';
  } else if (diffDias <= 2) {
    cor = 'text-orange-400';
  }

  const texto = diffDias < 0
    ? `${Math.abs(diffDias)}d atraso`
    : diffDias === 0
      ? 'Hoje'
      : diffDias === 1 ? 'Amanhã' : `${diffDias}d`;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cor}`}>
      <Calendar className="w-3 h-3 text-current" />
      {texto}
    </span>
  );
}

/* barra de progresso das subtarefas — estilo premium */
function SubtaskProgressBar ({ done, total }: { done: number; total: number })
{
  if (total === 0) {
    return null;
  }
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  return (
    <div className="flex items-center gap-2.5 w-full mt-2.5">
      <div className="flex-1 h-[3px] rounded-full bg-zinc-950 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${allDone ? 'bg-emerald-500' : 'bg-violet-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold font-mono tabular-nums ${allDone ? 'text-emerald-400' : 'text-zinc-500'}`}>
        {done}/{total}
      </span>
    </div>
  );
}


export function KanbanCard ({ tarefa, onEdit, onDelete, onDuplicate, flat }: KanbanCardProps)
{
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarefa.id });
  const [isTranslated, setIsTranslated] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    transition: isDragging ? 'none' : 'all 200ms cubic-bezier(.4,0,.2,1)',
  };

  const handleTranslate = (e: React.MouseEvent) =>
  {
    e.stopPropagation();
    if (isTranslated) {
      setIsTranslated(false); 
      return;
    }
    toast.info('Traduzindo via IA...', { duration: 1500 });
    setTimeout(() => { setIsTranslated(true); toast.success('Tradução concluída!'); }, 1200);
  };

  const origin = getOrigin(tarefa.origem || 'manual');
  const urgency = getUrgencyBadge(tarefa.score_urgencia);
  const elapsed = getElapsed(tarefa.created_at, tarefa.id);
  const OriginIcon = origin.Icon;
  const isCriticalFocus = tarefa.score_urgencia > 100;
  const focusPhase = useTaskStore((s) => s.focusState.phase);
  const focusTargetId = useTaskStore((s) => s.focusState.targetTaskId);
  const isInFocus = (focusPhase === 'focus' || focusPhase === 'break') && focusTargetId === tarefa.id;
  const isIA = tarefa.origem === 'gmail_triage' || tarefa.origem === 'gmail_mock' || tarefa.origem === 'gmail_api';
  const prio = tarefa.prioridade || 'media';
  const prioStyle = PRIO_BADGE[prio] || PRIO_BADGE.media;
  const subs = tarefa.subtarefas || [];
  const subtasks = { done: subs.filter((s) => s.concluida).length, total: subs.length };
  const labels = tarefa.labels || [];

  if (flat)
  {
    return (
      <TaskLineRow
        tarefa={tarefa}
        onOpen={() => onEdit?.(tarefa)}
        drag={{
          setNodeRef,
          listeners,
          attributes,
          style,
          isDragging,
        }}
      />
    );
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}, urgência ${urgency.label}`}
      className={[
        'relative rounded-md overflow-hidden',
        'bg-zinc-950/60 backdrop-blur-sm border border-white/[0.04] hover:border-violet-500/20 hover:bg-[#090514]',
        'transition-all duration-200 cursor-grab active:cursor-grabbing group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
        isDragging ? 'shadow-2xl shadow-violet-500/10 scale-[1.02] rotate-1' : '',
        !flat && tarefa.origem === 'financeiro'
          ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.04)] animate-[pulse_3s_ease-in-out_infinite]'
          : !flat && tarefa.origem === 'saude'
            ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.04)] animate-[pulse_3s_ease-in-out_infinite]'
            : !flat && isIA
              ? 'border-violet-500/20 shadow-[0_0_24px_rgba(139,92,246,0.04)]'
              : !flat && isInFocus
                ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
                : !flat && isCriticalFocus
                  ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                  : flat ? '' : 'border-zinc-800/40',
      ].join(' ')}
      tabIndex={0}
    >
      {/* header do card — origem + tempo + menu de ações */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-0">
        <div className="flex items-center gap-1.5">
          <OriginIcon className={`w-3.5 h-3.5 ${origin.color}`} />
          <span className="text-[10px] text-zinc-500 font-semibold">{origin.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
            <Clock className="w-3 h-3" />
            <span>{elapsed}</span>
          </div>
          {/* botão de ações rápidas — aparece no hover */}
          <div className="relative" ref={actionsRef}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity
                         text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60"
              title="Ações"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {showActions && (
              <div
                className="absolute right-0 top-7 z-20 w-36 bg-zinc-950 border border-zinc-900 rounded-lg shadow-xl py-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); onEdit?.(tarefa); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                >
                  <Pencil className="w-3 h-3 text-zinc-500" /> Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); onDuplicate?.(tarefa.id); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                >
                  <Copy className="w-3 h-3 text-zinc-500" /> Duplicar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); onDelete?.(tarefa.id); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                >
                  <Trash2 className="w-3 h-3" /> Arquivar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* badge ia */}
      {isIA && (
        <div className="flex items-center gap-1 px-3.5 pt-1.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-500/5 border border-violet-500/10">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400">Capturado por IA</span>
          </div>
        </div>
      )}

      {/* Phantom task badges for active orchestrator origins */}
      {tarefa.origem === 'financeiro' && (
        <div className="flex items-center gap-1 px-3.5 pt-1.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/10">
            <Wallet className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Vencimento Financeiro</span>
          </div>
        </div>
      )}
      {tarefa.origem === 'saude' && (
        <div className="flex items-center gap-1 px-3.5 pt-1.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">
            <Pill className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Medicamento Pendente</span>
          </div>
        </div>
      )}

      {/* corpo do card */}
      <div className="px-3.5 pt-2.5 pb-2.5">
        {/* badges: urgência + prioridade com visual estilo Linear */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${urgency.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
              {urgency.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${prioStyle.color}`}>
              <span className="w-1 h-1 rounded-full bg-current opacity-60" />
              {prio}
            </span>
            {isCriticalFocus && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Foco
              </span>
            )}
            {isInFocus && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 animate-pulse">
                <Timer className="w-3 h-3" />
                Em Foco
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-zinc-700 font-semibold">#{tarefa.id}</span>
        </div>

        {/* título — clicável para abrir detalhe */}
        <h4
          className="font-bold text-[13px] leading-snug text-zinc-200 group-hover:text-white transition-colors mb-1
                     cursor-pointer hover:text-violet-400"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit?.(tarefa); }}
        >
          {tarefa.titulo}
        </h4>

        {/* snippet */}
        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-3">
          {isTranslated ? `[EN] ${tarefa.snippet_100_char}` : tarefa.snippet_100_char}
        </p>

        {/* labels coloridos como chips estilo bullet de baixo contraste */}
        {labels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {labels.map((lb) => (
              <span
                key={lb.id}
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 border border-zinc-800/40 bg-zinc-950/40 transition-colors"
                style={{ color: lb.cor }}
              >
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: lb.cor }} />
                {lb.nome}
              </span>
            ))}
          </div>
        )}

        {/* barra de progresso de subtarefas */}
        <SubtaskProgressBar done={subtasks.done} total={subtasks.total} />
      </div>

      {/* footer — data de vencimento, avatares, tradução */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-zinc-950/40">
        <div className="flex items-center gap-3.5">
          {tarefa.data_vencimento && <DueDateChip date={tarefa.data_vencimento} />}
          {subtasks.total > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold">
              {subtasks.done === subtasks.total
                ? <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                : <Square className="w-3.5 h-3.5 text-zinc-600" />}
              <span>{subtasks.done}/{subtasks.total}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(2, (tarefa.id % 3) + 1) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-900/80 ring-1 ring-zinc-900
                           flex items-center justify-center text-[8px] font-bold text-zinc-400"
              >
                {String.fromCharCode(65 + ((tarefa.id + i) % 26))}
              </div>
            ))}
          </div>

          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleTranslate}
            title="Traduzir snippet"
            className={`p-1 rounded-md transition-colors ${
              isTranslated
                ? 'text-violet-400 bg-violet-500/10'
                : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}