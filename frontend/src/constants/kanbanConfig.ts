// Constantes compartilhadas entre KanbanBoard, KanbanCard, TaskDetailModal e ListView
import { Square, Mail, Code2, MessageSquare } from 'lucide-react';
import type React from 'react';

// ── Prioridade ────────────────────────────────────────────────

export const PRIO_LABELS: Record<string, string> = {
  critica: 'Crítica',
  alta:    'Alta',
  media:   'Média',
  baixa:   'Baixa',
};

export const PRIO_ORDER: Record<string, number> = {
  critica: 0,
  alta:    1,
  media:   2,
  baixa:   3,
};

// faixa de cor superior no card (gradiente)
export const PRIORITY_STRIP: Record<string, string> = {
  critica: 'from-red-500 to-rose-600',
  alta:    'from-amber-500 to-orange-500',
  media:   'from-blue-500 to-indigo-500',
  baixa:   'from-zinc-600 to-zinc-700',
};

// badge de prioridade (bg + text)
export const PRIO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  critica: { label: 'Crítica', color: 'text-red-400',   bg: 'bg-red-500/10'   },
  alta:    { label: 'Alta',    color: 'text-amber-400', bg: 'bg-amber-500/10' },
  media:   { label: 'Média',   color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
  baixa:   { label: 'Baixa',   color: 'text-zinc-400',  bg: 'bg-zinc-500/10'  },
};

// config completa com border (usado no TaskDetailModal)
export const PRIORIDADE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critica: { label: 'Crítica', color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30'   },
  alta:    { label: 'Alta',    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  media:   { label: 'Média',   color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/30'  },
  baixa:   { label: 'Baixa',   color: 'text-zinc-400',  bg: 'bg-zinc-500/10',  border: 'border-zinc-500/30'  },
};

export const PRIO_OPTIONS = ['critica', 'alta', 'media', 'baixa'] as const;

// ── Status ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente:     { label: 'Pendente',     color: 'text-red-400',     bg: 'bg-red-500/10'     },
  em_progresso: { label: 'Em Progresso', color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  concluida:    { label: 'Concluída',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export const STATUS_ORDER: Record<string, number> = {
  pendente: 0,
  em_progresso: 1,
  concluida: 2,
};

export const STATUS_OPTIONS = ['pendente', 'em_progresso', 'concluida'] as const;

// ── Origem ─────────────────────────────────────────────────────

export const ORIGINS: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  manual:       { label: 'Manual',       Icon: Square,         color: 'text-zinc-400'   },
  gmail_triage: { label: 'Gmail',        Icon: Mail,           color: 'text-blue-400'   },
  gmail_mock:   { label: 'Gmail (mock)', Icon: Mail,           color: 'text-violet-400' },
  gmail_api:    { label: 'Gmail API',    Icon: Mail,           color: 'text-blue-400'   },
  webhook:      { label: 'Webhook',      Icon: Code2,          color: 'text-violet-400' },
};
export const ORIGINS_FALLBACK = { label: 'Outro', Icon: MessageSquare, color: 'text-zinc-400' };

export const ORIGIN_LABELS: Record<string, string> = {
  manual:       'Manual',
  gmail_triage: 'Gmail',
  gmail_mock:   'Gmail (mock)',
  gmail_api:    'Gmail API',
  webhook:      'Webhook',
};

export function getOrigin (origem: string): { label: string; Icon: React.ElementType; color: string }
{
  return ORIGINS[origem] || ORIGINS_FALLBACK;
}
