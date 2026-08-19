import type { TemporalHorizon } from './temporalHorizon'

// Utilitários visuais Kanban — prioridade discreta, editorial

export function urgencyStripeClass(score: number): string
{
  if (score > 90) return 'border-l-[3px] border-l-urgente'
  if (score > 70) return 'border-l-[3px] border-l-atencao'
  return 'border-l-[3px] border-l-line'
}

export function urgencyScoreClass(score: number): string
{
  if (score > 90) return 'text-urgente'
  if (score > 70) return 'text-atencao'
  return 'text-ink-muted'
}

export function urgencyDotClass(score: number): string
{
  if (score > 90) return 'bg-urgente'
  if (score > 70) return 'bg-atencao'
  return 'bg-line'
}

export function formatTaskRef(id: number): string
{
  if (id <= 0) return 'DRAFT'
  return `SL-${String(id).padStart(4, '0')}`
}

export const WIP_HOJE_BOARD = 8
export const WIP_HOJE_EXEC = 5

export const COLUMN_META: Record<
  TemporalHorizon,
  { index: string; subtitle: string }
> = {
  hoje: { index: '', subtitle: '' },
  semana: { index: '', subtitle: '' },
  backlog: { index: '', subtitle: '' },
}
