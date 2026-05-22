import type { TarefaUnificada } from '../types';

/** "Fazer em 1h" (pendente + score alto) ou coluna Pendente com score crítico */
export function isInCriticalKanbanBucket(t: TarefaUnificada): boolean
{
  if (t.status === 'concluida') return false;
  const score = t.score_urgencia || 0;
  return t.status === 'pendente' && score > 100;
}

export function getStressTasks(tarefas: TarefaUnificada[]): TarefaUnificada[]
{
  return tarefas.filter(isInCriticalKanbanBucket);
}

export function countStressTasks(tarefas: TarefaUnificada[]): number
{
  return getStressTasks(tarefas).length;
}

const COMM_ORIGINS = new Set([
  'gmail_triage',
  'gmail_mock',
  'gmail_api',
  'gmail',
  'email',
  'webhook',
]);

export function isCommunicationTask(t: TarefaUnificada): boolean
{
  const o = (t.origem || '').toLowerCase();
  return COMM_ORIGINS.has(o) || o.includes('gmail') || o.includes('mail');
}

export function getCommunicationStressTasks(tarefas: TarefaUnificada[]): TarefaUnificada[]
{
  return getStressTasks(tarefas).filter(isCommunicationTask);
}
