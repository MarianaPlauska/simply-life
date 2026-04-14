import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Languages, Code2, Mail, MessageSquare, CheckSquare, Square, AlertTriangle, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { TarefaUnificada } from '../../types';

interface KanbanCardProps {
  tarefa: TarefaUnificada;
}

/* Origin icon mapping */
const ORIGINS: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  manual: { label: 'Manual', Icon: Square, color: 'text-zinc-400' },
  gmail_triage: { label: 'Gmail', Icon: Mail, color: 'text-blue-400' },
  gmail_mock: { label: 'Gmail (mock)', Icon: Mail, color: 'text-violet-400' },
  webhook: { label: 'Webhook', Icon: Code2, color: 'text-violet-400' },
};

const FALLBACK_ORIGIN = { label: 'Outro', Icon: MessageSquare, color: 'text-zinc-400' };

function getOrigin(origem: string) {
  return ORIGINS[origem] || FALLBACK_ORIGIN;
}

function getElapsed(id: number) {
  const hours = [1, 2, 4, 6, 12, 24];
  const h = hours[id % hours.length];
  return h < 24 ? `${h}h` : '1d';
}

function getUrgencyBadge(score: number) {
  if (score > 80) return { label: 'Critico', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' };
  if (score > 40) return { label: 'Atencao', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' };
  return { label: 'Normal', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' };
}

const PRIORIDADE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  critica: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  alta:    { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  media:   { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  baixa:   { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' },
};


export function KanbanCard({ tarefa }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarefa.id,
  });
  const [isTranslated, setIsTranslated] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const handleTranslate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    toast.info('Traduzindo via IA...', { duration: 1500 });
    setTimeout(() => {
      setIsTranslated(true);
      toast.success('Traducao concluida!');
    }, 1200);
  };

  const origin = getOrigin(tarefa.origem || 'manual');
  const urgency = getUrgencyBadge(tarefa.score_urgencia);
  const elapsed = getElapsed(tarefa.id);

  const OriginIcon = origin.Icon;
  const isCriticalFocus = tarefa.score_urgencia > 100;
  // tarefa veio pelo motor de triagem (gmail real ou mock)
  const isIA = tarefa.origem === 'gmail_triage' || tarefa.origem === 'gmail_mock';
  const prio = tarefa.prioridade || 'media';
  const prioStyle = PRIORIDADE_STYLES[prio] || PRIORIDADE_STYLES.media;
  // subtarefas reais do sprint 1 — usa dados do backend
  const subs = tarefa.subtarefas || [];
  const subtasks = { done: subs.filter((s) => s.concluida).length, total: subs.length };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}, urgencia ${urgency.label}`}
      className={[
        'bg-zinc-900/60 border rounded-xl overflow-hidden',
        'hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
        // tarefa capturada pela ia — borda violeta brilhante
        isIA
          ? 'border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.12)]'
          : isCriticalFocus
            ? 'border-red-500/60 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)]'
            : 'border-zinc-800/60',
      ].join(' ')}
      tabIndex={0}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        <div className="flex items-center gap-1.5">
          <OriginIcon className={`w-3.5 h-3.5 ${origin.color}`} aria-hidden="true" />
          <span className="text-[11px] text-zinc-500 font-medium">{origin.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <Clock className="w-3 h-3" aria-hidden="true" />
          <span>ha {elapsed}</span>
        </div>
      </div>

      {/* badge ia — aparece quando a tarefa foi capturada automaticamente */}
      {isIA && (
        <div className="flex items-center gap-1 px-4 pt-1.5 pb-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">capturada por ia</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-4 pt-3 pb-2">
        {/* Urgency Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${urgency.bg} ${urgency.text}`}>
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
                Foco Crítico
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-zinc-600">#{tarefa.id}</span>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-[13px] leading-snug text-zinc-200 group-hover:text-white transition-colors mb-1.5">
          {tarefa.titulo}
        </h4>

        {/* Snippet */}
        <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed">
          {isTranslated
            ? `[EN] ${tarefa.snippet_100_char}`
            : tarefa.snippet_100_char}
        </p>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between px-4 py-3 mt-1 border-t border-zinc-800/30">
        {/* Subtasks */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          {subtasks.done === subtasks.total ? (
            <CheckSquare className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          ) : (
            <Square className="w-3 h-3" aria-hidden="true" />
          )}
          <span>{subtasks.done}/{subtasks.total}</span>
        </div>

        {/* Assignee avatars (simulated) */}
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(2, (tarefa.id % 3) + 1) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700/60 ring-1 ring-zinc-900"
                aria-label="Membro atribuido"
              />
            ))}
          </div>

          {/* Translate button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleTranslate}
            title="Traduzir snippet"
            aria-label="Traduzir snippet para ingles"
            className={`ml-1 p-1 rounded-md transition-colors ${
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