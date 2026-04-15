import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock, Languages, Code2, Mail, MessageSquare, CheckSquare, Square,
  AlertTriangle, Zap, Sparkles, Calendar, MoreHorizontal, Pencil, Trash2, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TarefaUnificada } from '../../types';

interface KanbanCardProps {
  tarefa: TarefaUnificada;
  onEdit?: (tarefa: TarefaUnificada) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (id: number) => void;
}

/* cor da faixa superior baseada na prioridade */
const PRIORITY_STRIP: Record<string, string> = {
  critica: 'from-red-500 to-rose-600',
  alta:    'from-amber-500 to-orange-500',
  media:   'from-blue-500 to-indigo-500',
  baixa:   'from-zinc-600 to-zinc-700',
};

/* mapeamento de origem → icone e cor */
const ORIGINS: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  manual:       { label: 'Manual',       Icon: Square,         color: 'text-zinc-400' },
  gmail_triage: { label: 'Gmail',        Icon: Mail,           color: 'text-blue-400' },
  gmail_mock:   { label: 'Gmail (mock)', Icon: Mail,           color: 'text-violet-400' },
  gmail_api:    { label: 'Gmail API',    Icon: Mail,           color: 'text-blue-400' },
  webhook:      { label: 'Webhook',      Icon: Code2,          color: 'text-violet-400' },
};
const FALLBACK_ORIGIN = { label: 'Outro', Icon: MessageSquare, color: 'text-zinc-400' };

function getOrigin (origem: string)
{
  return ORIGINS[origem] || FALLBACK_ORIGIN;
}

/* calcula quanto tempo atrás a tarefa foi criada */
function getElapsed (createdAt: string | null, id: number): string
{
  if ( createdAt )
  {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if ( mins < 60 ) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if ( hrs < 24 ) return `${hrs}h`;
    const dias = Math.floor(hrs / 24);
    return `${dias}d`;
  }
  const hours = [1, 2, 4, 6, 12, 24];
  const h = hours[id % hours.length];
  return h < 24 ? `${h}h` : '1d';
}

/* badge de urgencia */
function getUrgencyBadge (score: number)
{
  if ( score > 80 ) return { label: 'Critico', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' };
  if ( score > 40 ) return { label: 'Atencao', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' };
  return { label: 'Normal', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' };
}

/* estilos visuais por prioridade */
const PRIORIDADE_STYLES: Record<string, { bg: string; text: string }> = {
  critica: { bg: 'bg-red-500/10',   text: 'text-red-400'   },
  alta:    { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  media:   { bg: 'bg-blue-500/10',  text: 'text-blue-400'  },
  baixa:   { bg: 'bg-zinc-500/10',  text: 'text-zinc-400'  },
};

/* chip de data de vencimento com cor contextual */
function DueDateChip ({ date }: { date: string })
{
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(date);
  venc.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);

  let cor = 'text-zinc-500 bg-zinc-800/50';
  if ( diffDias < 0 )       cor = 'text-red-400 bg-red-500/10';
  else if ( diffDias === 0 ) cor = 'text-amber-400 bg-amber-500/10';
  else if ( diffDias <= 2 )  cor = 'text-orange-400 bg-orange-500/10';

  const texto = diffDias < 0
    ? `${Math.abs(diffDias)}d atraso`
    : diffDias === 0
      ? 'Hoje'
      : diffDias === 1 ? 'Amanhã' : `${diffDias}d`;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${cor}`}>
      <Calendar className="w-3 h-3" />
      {texto}
    </span>
  );
}

/* barra de progresso das subtarefas — estilo clickup */
function SubtaskProgressBar ({ done, total }: { done: number; total: number })
{
  if ( total === 0 ) return null;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${allDone ? 'bg-emerald-500' : 'bg-violet-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium tabular-nums ${allDone ? 'text-emerald-400' : 'text-zinc-500'}`}>
        {done}/{total}
      </span>
    </div>
  );
}


export function KanbanCard ({ tarefa, onEdit, onDelete, onDuplicate }: KanbanCardProps)
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
    if ( isTranslated ) { setIsTranslated(false); return; }
    toast.info('Traduzindo via IA...', { duration: 1500 });
    setTimeout(() => { setIsTranslated(true); toast.success('Traducao concluida!'); }, 1200);
  };

  const origin = getOrigin(tarefa.origem || 'manual');
  const urgency = getUrgencyBadge(tarefa.score_urgencia);
  const elapsed = getElapsed(tarefa.created_at, tarefa.id);
  const OriginIcon = origin.Icon;
  const isCriticalFocus = tarefa.score_urgencia > 100;
  const isIA = tarefa.origem === 'gmail_triage' || tarefa.origem === 'gmail_mock' || tarefa.origem === 'gmail_api';
  const prio = tarefa.prioridade || 'media';
  const prioStyle = PRIORIDADE_STYLES[prio] || PRIORIDADE_STYLES.media;
  const subs = tarefa.subtarefas || [];
  const subtasks = { done: subs.filter((s) => s.concluida).length, total: subs.length };
  const labels = tarefa.labels || [];
  const stripGradient = PRIORITY_STRIP[prio] || PRIORITY_STRIP.media;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}, urgencia ${urgency.label}`}
      className={[
        'relative rounded-xl overflow-hidden',
        'bg-zinc-900/70 backdrop-blur-sm border',
        'hover:border-zinc-600/60 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-black/20',
        'transition-all duration-200 cursor-grab active:cursor-grabbing group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
        isDragging ? 'shadow-2xl shadow-violet-500/10 scale-[1.02] rotate-1' : '',
        isIA
          ? 'border-violet-500/30 shadow-[0_0_24px_rgba(139,92,246,0.08)]'
          : isCriticalFocus
            ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
            : 'border-zinc-800/50',
      ].join(' ')}
      tabIndex={0}
    >
      {/* faixa de cor no topo — identifica a prioridade visualmente */}
      <div className={`h-1 w-full bg-gradient-to-r ${stripGradient}`} />

      {/* header do card — origem + tempo + menu de ações */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-0">
        <div className="flex items-center gap-1.5">
          <OriginIcon className={`w-3.5 h-3.5 ${origin.color}`} />
          <span className="text-[10px] text-zinc-500 font-medium">{origin.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
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
                className="absolute right-0 top-7 z-20 w-36 bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-xl py-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); onEdit?.(tarefa); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); onDuplicate?.(tarefa.id); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Duplicar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); onDelete?.(tarefa.id); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors"
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
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">capturada por ia</span>
          </div>
        </div>
      )}

      {/* corpo do card */}
      <div className="px-3.5 pt-2.5 pb-2">
        {/* badges: urgencia + prioridade */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${urgency.bg} ${urgency.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
              {urgency.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${prioStyle.bg} ${prioStyle.text}`}>
              <Zap className="w-3 h-3" />
              {prio}
            </span>
            {isCriticalFocus && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Foco
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-zinc-700">#{tarefa.id}</span>
        </div>

        {/* titulo — clicável para abrir detalhe */}
        <h4
          className="font-semibold text-[13px] leading-snug text-zinc-200 group-hover:text-white transition-colors mb-1
                     cursor-pointer hover:text-violet-300"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit?.(tarefa); }}
        >
          {tarefa.titulo}
        </h4>

        {/* snippet */}
        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-2.5">
          {isTranslated ? `[EN] ${tarefa.snippet_100_char}` : tarefa.snippet_100_char}
        </p>

        {/* labels coloridos como chips */}
        {labels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2.5">
            {labels.map((lb) => (
              <span
                key={lb.id}
                className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: lb.cor,
                  backgroundColor: `${lb.cor}15`,
                  borderColor: `${lb.cor}30`,
                }}
              >
                {lb.nome}
              </span>
            ))}
          </div>
        )}

        {/* barra de progresso de subtarefas */}
        <SubtaskProgressBar done={subtasks.done} total={subtasks.total} />
      </div>

      {/* footer — data de vencimento, avatares, tradução */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-zinc-800/30">
        <div className="flex items-center gap-2">
          {tarefa.data_vencimento && <DueDateChip date={tarefa.data_vencimento} />}
          {subtasks.total > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              {subtasks.done === subtasks.total
                ? <CheckSquare className="w-3 h-3 text-emerald-400" />
                : <Square className="w-3 h-3" />}
              <span>{subtasks.done}/{subtasks.total}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(2, (tarefa.id % 3) + 1) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600/40 ring-1 ring-zinc-900
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