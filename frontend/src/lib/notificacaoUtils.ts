import type { Notificacao } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { getOverdueTasks, getUrgentDeadlineTasks } from './axelAlerts'

export function isNotificacaoLida(lida: Notificacao['lida'] | number | string | null | undefined): boolean
{
  return lida === true || lida === 1 || lida === '1'
}

/** Resumos de rotina e avisos redundantes — não devem acionar o sino */
export function isNotificacaoRuido(n: Notificacao): boolean
{
  if (n.tipo !== 'financeiro') return false

  const titulo = n.titulo.toLowerCase()
  const msg = (n.mensagem ?? '').toLowerCase()

  if (titulo.includes('axel ·') && titulo.includes('livre:')) return true
  if (msg.includes('ritmo tranquilo')) return true
  if (titulo === 'uso de cartão elevado') return true

  return false
}

export function isNotificacaoAcionavel(n: Notificacao): boolean
{
  if (isNotificacaoLida(n.lida)) return false
  if (isNotificacaoRuido(n)) return false
  return true
}

export function listNotificacoesAcionaveis(notificacoes: Notificacao[]): Notificacao[]
{
  return notificacoes.filter(isNotificacaoAcionavel)
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

export interface TarefaAtrasadaItem
{
  kind: 'tarefa_atrasada'
  task: TarefaUnificada
}

export function listTarefasAtrasadas(tarefas: TarefaUnificada[]): TarefaAtrasadaItem[]
{
  return getOverdueTasks(tarefas)
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
    .map((task) => ({ kind: 'tarefa_atrasada' as const, task }))
}

export function listPrazosUrgentes(tarefas: TarefaUnificada[]): PrazoUrgenteItem[]
{
  return getUrgentDeadlineTasks(tarefas).map((task) => ({ kind: 'prazo_24h' as const, task }))
}

export function countAlertasHeader(notificacoes: Notificacao[], tarefas: TarefaUnificada[]): number
{
  const unread = listNotificacoesAcionaveis(notificacoes).length
  const prazos = listPrazosUrgentes(tarefas).length
  const atrasadas = listTarefasAtrasadas(tarefas).length
  return unread + prazos + atrasadas
}
