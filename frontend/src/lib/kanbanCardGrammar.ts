import { diffDaysUntilDue, formatDaysRemaining } from './daysRemaining'

/** Tom de módulo a partir da origem da tarefa — não usa laranja AXEL */
export type KanbanModuleTone = 'finance' | 'health' | 'tasks'

export function kanbanOriginTone(origem: string | null | undefined): KanbanModuleTone
{
  const key = (origem ?? '').toLowerCase()
  if (key.includes('financ'))
  {
    return 'finance'
  }
  if (key.includes('saude') || key.includes('health') || key === 'agua')
  {
    return 'health'
  }
  return 'tasks'
}

/** Faixa 3px à esquerda do card/linha */
export const KANBAN_ORIGIN_BAR: Record<KanbanModuleTone, string> = {
  finance: 'border-l-[3px] border-l-finance',
  health: 'border-l-[3px] border-l-health',
  tasks: 'border-l-[3px] border-l-tasks',
}

export const KANBAN_ORIGIN_DOT: Record<KanbanModuleTone, string> = {
  finance: 'bg-finance',
  health: 'bg-health',
  tasks: 'bg-tasks',
}

export function isKanbanDueOverdue(dataVencimento: string | null | undefined): boolean
{
  const diff = diffDaysUntilDue(dataVencimento)
  return diff !== null && diff < 0
}

/** Prazo vencido em text-urgente só no texto do prazo */
export function kanbanDueTextClass(dataVencimento: string | null | undefined): string
{
  if (isKanbanDueOverdue(dataVencimento))
  {
    return 'text-urgente'
  }
  return 'text-ink-muted'
}

export function kanbanDueLabel(dataVencimento: string | null | undefined): string | null
{
  if (!dataVencimento)
  {
    return null
  }
  return formatDaysRemaining(dataVencimento).label
}
