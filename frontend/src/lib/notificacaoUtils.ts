import type { Notificacao } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { getUrgentDeadlineTasks } from './axelAlerts'

export function isNotificacaoLida(lida: Notificacao['lida'] | number | string | null | undefined): boolean
{
  return lida === true || lida === 1 || lida === '1'
}

export function normalizeNotificacao(row: Record<string, unknown>): Notificacao
{
  return {
    id: Number(row.id),
    titulo: String(row.titulo ?? ''),
    mensagem: row.mensagem != null ? String(row.mensagem) : '',
    tipo: String(row.tipo ?? 'info') as Notificacao['tipo'],
    urgencia: (row.urgencia as Notificacao['urgencia']) ?? 'normal',
    lida: isNotificacaoLida(row.lida as Notificacao['lida']),
    score_urgencia: Number(row.score_urgencia ?? 0),
    criado_em: row.criado_em != null ? String(row.criado_em) : new Date().toISOString(),
  }
}

export interface PrazoUrgenteItem
{
  kind: 'prazo_24h'
  task: TarefaUnificada
}

export function listPrazosUrgentes(tarefas: TarefaUnificada[]): PrazoUrgenteItem[]
{
  return getUrgentDeadlineTasks(tarefas).map((task) => ({ kind: 'prazo_24h' as const, task }))
}

export function countAlertasHeader(notificacoes: Notificacao[], tarefas: TarefaUnificada[]): number
{
  const unread = notificacoes.filter((n) => !isNotificacaoLida(n.lida)).length
  const prazos = listPrazosUrgentes(tarefas).length
  return unread + prazos
}
