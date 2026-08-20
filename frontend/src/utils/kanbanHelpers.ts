// funções utilitárias compartilhadas entre componentes kanban
import type { TarefaUnificada } from '../types';

// ── formatação de data ─────────────────────────────────────────

export function formatDate (dateStr: string | null): string
{
  if ( !dateStr ) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── info de data de vencimento com cor contextual ─────────────

export function dueDateInfo (dateStr: string | null)
{
  if ( !dateStr ) return { text: 'Sem prazo', color: 'text-zinc-500', bg: 'bg-zinc-800/50' };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dateStr); venc.setHours(0, 0, 0, 0);
  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);

  if ( diff < 0 )  return { text: `${Math.abs(diff)}d além da data`, color: 'text-ink-muted', bg: 'bg-chrome/50' };
  if ( diff === 0 ) return { text: 'Vence hoje',                  color: 'text-atencao',  bg: 'bg-atencao/10'  };
  if ( diff <= 2 )  return { text: `Vence em ${diff}d`,           color: 'text-ink-muted', bg: 'bg-chrome/50' };
  return { text: formatDate(dateStr), color: 'text-zinc-400', bg: 'bg-zinc-800/50' };
}

// ── tempo decorrido desde criação ─────────────────────────────

export function getElapsed (createdAt: string | null, id: number): string
{
  if ( createdAt )
  {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if ( mins < 60 ) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if ( hrs < 24 ) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }
  const hours = [1, 2, 4, 6, 12, 24];
  const h = hours[id % hours.length];
  return h < 24 ? `${h}h` : '1d';
}

// ── badge de urgência ──────────────────────────────────────────

export function getUrgencyBadge (score: number)
{
  if ( score > 80 ) return { label: 'Critico', bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-500'     };
  if ( score > 40 ) return { label: 'Atencao', bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500'   };
  return              { label: 'Normal',  bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' };
}

// ── comparação para sort da ListView ──────────────────────────

import { PRIO_ORDER, STATUS_ORDER } from '../constants/kanbanConfig';

type SortKey = 'titulo' | 'prioridade' | 'status' | 'score_urgencia' | 'created_at';

export function compareValue (a: TarefaUnificada, b: TarefaUnificada, key: SortKey): number
{
  if ( key === 'prioridade' )    return (PRIO_ORDER[a.prioridade] ?? 9) - (PRIO_ORDER[b.prioridade] ?? 9);
  if ( key === 'status' )        return (STATUS_ORDER[a.status] ?? 9)    - (STATUS_ORDER[b.status] ?? 9);
  if ( key === 'score_urgencia' ) return b.score_urgencia - a.score_urgencia;
  if ( key === 'titulo' )        return a.titulo.localeCompare(b.titulo, 'pt-BR');
  if ( key === 'created_at' )
  {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  }
  return 0;
}
