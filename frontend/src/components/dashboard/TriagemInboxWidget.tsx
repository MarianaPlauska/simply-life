import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, MessageSquare, Sparkles, ExternalLink,
  ChevronRight, CheckCircle2, X, Clock, AlertTriangle,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { fadeUp, staggerContainer, staggerChild } from './DashboardPrimitives';
import type { ActiveView } from '../../store/useTaskStore';

/* ══════════════════════════════════════════════════════════════
   TriagemInboxWidget — Caixa de Entrada Unificada
   Mostra e-mails/mensagens processados pela IA com resumo,
   score de urgência e ação sugerida. O usuário pode aceitar
   (criar tarefa) ou descartar.
   ══════════════════════════════════════════════════════════════ */

export interface UnifiedEvent
{
  id: string;
  source: 'gmail' | 'teams' | 'calendar';
  sender: string;
  rawSubject: string;
  resumo: string;               // resumo em PT-BR pela IA
  acaoSugerida: 'responder' | 'fazer' | 'agendar' | 'ignorar';
  scoreUrgencia: number;        // 0-100
  keywordsDetectadas: string[];
  timestamp: Date;
  processed: boolean;
  dismissed: boolean;
}



function getSourceIcon(source: string)
{
  switch (source)
  {
    case 'gmail': return Mail;
    case 'teams': return MessageSquare;
    default: return Mail;
  }
}

function getSourceLabel(source: string)
{
  switch (source)
  {
    case 'gmail': return 'Gmail';
    case 'teams': return 'Teams';
    default: return source;
  }
}

function getUrgencyColor(score: number)
{
  if (score >= 80) return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15' };
  if (score >= 50) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15' };
  return { text: 'text-zinc-500', bg: 'bg-zinc-800/50', border: 'border-white/5' };
}

function getActionLabel(acao: string)
{
  switch (acao)
  {
    case 'responder': return 'Responder';
    case 'fazer': return 'Criar Tarefa';
    case 'agendar': return 'Agendar';
    case 'ignorar': return 'Ignorar';
    default: return acao;
  }
}

function timeAgo(date: Date): string
{
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

interface TriagemInboxWidgetProps
{
  setActiveView?: (v: ActiveView) => void;
}

import { useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';

export function TriagemInboxWidget({ setActiveView: _setActiveView }: TriagemInboxWidgetProps)
{
  const inboxEvents = useTaskStore((s) => s.inboxEvents);
  const fetchInbox = useTaskStore((s) => s.fetchInbox);
  const dismissEvent = useTaskStore((s) => s.dismissEvent);
  const createTaskFromEvent = useTaskStore((s) => s.createTaskFromEvent);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const events = inboxEvents
    .filter((e) => !e.dismissed && !e.processed)
    .sort((a, b) => b.score_urgencia - a.score_urgencia);

  const urgentCount = events.filter((e) => e.score_urgencia >= 80).length;

  return (
    <motion.div {...fadeUp}>
      <GlassCard className="!border-violet-500/10">
        {/* glow sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.05),transparent_50%)] pointer-events-none z-0" />

        <div className="relative z-10">
          {/* header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center relative">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  Inbox IA
                  {urgentCount > 0 && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-600">
                  {events.length} evento{events.length !== 1 ? 's' : ''} processado{events.length !== 1 ? 's' : ''} pela IA
                </p>
              </div>
            </div>

            <button
              onClick={() =>
              {
                _setActiveView?.('kanban');
              }}
              className="text-[10px] text-zinc-600 hover:text-violet-400 transition-colors flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* event list */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-2"
          >
            <AnimatePresence>
              {events.slice(0, 4).map((event) =>
              {
                const SourceIcon = getSourceIcon(event.source);
                const urgency = getUrgencyColor(event.score_urgencia);

                return (
                  <motion.div
                    key={event.id}
                    variants={staggerChild}
                    layout
                    className={`
                      group relative flex items-start gap-3 p-4 rounded-2xl
                      bg-zinc-900/30 border ${urgency.border}
                      hover:bg-zinc-800/30 transition-all duration-300
                    `}
                  >
                    {/* source badge */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl ${urgency.bg} flex items-center justify-center`}>
                      <SourceIcon className={`w-4 h-4 ${urgency.text}`} />
                    </div>

                    {/* conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-zinc-300 truncate">{event.sender}</span>
                        <span className="text-[9px] text-zinc-600">via {getSourceLabel(event.source)}</span>
                        <span className="text-[9px] text-zinc-700 flex items-center gap-0.5 ml-auto shrink-0">
                          <Clock className="w-3 h-3" />
                          {timeAgo(new Date(event.created_at))}
                        </span>
                      </div>

                      {/* resumo da IA */}
                      <p className="text-[12px] text-zinc-400 leading-relaxed mb-2">
                        {event.resumo || event.raw_subject}
                      </p>

                      {/* keywords + ações */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(event.keywords_detectadas || []).slice(0, 3).map((kw) => (
                          <span key={kw} className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-md">
                            {kw}
                          </span>
                        ))}

                        {/* score badge */}
                        <span className={`text-[9px] font-bold ${urgency.text} ${urgency.bg} px-1.5 py-0.5 rounded-md ml-auto`}>
                          ⚡ {event.score_urgencia}
                        </span>
                      </div>
                    </div>

                    {/* ações hover */}
                    <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (event.acao_sugerida === 'fazer') createTaskFromEvent(event.id);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                        title={getActionLabel(event.acao_sugerida || '')}
                      >
                        {event.acao_sugerida === 'fazer' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => dismissEvent(event.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                        title="Descartar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* shimmer bar — mostra que IA está "processando" */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="relative w-full h-1 rounded-full bg-zinc-900/80 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent rounded-full"
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-500" />
                IA monitorando...
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
