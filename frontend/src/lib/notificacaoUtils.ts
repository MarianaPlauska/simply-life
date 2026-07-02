import type { Notificacao } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import {
  completedBillReferenceKeys,
  filterOverdueTasksForAlerts,
  filterUrgentTasksForAlerts,
  isNotificationResolved,
  type AlertFinanceContext,
} from './notificationResolution'

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

export function listNotificacoesAcionaveis(
  notificacoes: Notificacao[],
  tarefas?: TarefaUnificada[],
): Notificacao[]
{
  const seen = new Map<string, Notificacao>()
  const completedKeys = tarefas?.length ? completedBillReferenceKeys(tarefas) : null

  for (const n of notificacoes)
  {
    if (!isNotificacaoAcionavel(n)) continue
    if (completedKeys && tarefas && isNotificationResolved(n, tarefas, completedKeys)) continue

    const key = `${n.titulo.trim().toLowerCase()}|${(n.mensagem ?? '').trim().toLowerCase()}`
    const prev = seen.get(key)
    if (!prev || n.id > prev.id)
    {
      seen.set(key, n)
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
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

export function listTarefasAtrasadas(
  tarefas: TarefaUnificada[],
  ctx?: AlertFinanceContext,
): TarefaAtrasadaItem[]
{
  return filterOverdueTasksForAlerts(tarefas, ctx).map((task) => ({
    kind: 'tarefa_atrasada' as const,
    task,
  }))
}

export function listPrazosUrgentes(tarefas: TarefaUnificada[]): PrazoUrgenteItem[]
{
  return filterUrgentTasksForAlerts(tarefas).map((task) => ({
    kind: 'prazo_24h' as const,
    task,
  }))
}

/** Evita financeiro duplicado quando já há alerta de prazo da mesma conta/tarefa */
export function filterNotificacoesSemPrazoDuplicado(
  notificacoes: Notificacao[],
  prazos: PrazoUrgenteItem[],
): Notificacao[]
{
  if (prazos.length === 0) return notificacoes

  const titulosPrazo = prazos.map(({ task }) => task.titulo.trim().toLowerCase())

  return notificacoes.filter((n) =>
  {
    if (n.tipo !== 'financeiro') return true

    const label = n.titulo
      .replace(/^conta (em \d+ dia\(s\)|vence hoje) · /i, '')
      .trim()
      .toLowerCase()

    if (!label) return true

    return !titulosPrazo.some((taskTitle) =>
      taskTitle.includes(label)
      || label.includes(taskTitle.replace(/\[boleto\]\s*/i, '').trim()),
    )
  })
}

export function countAlertasHeader(
  notificacoes: Notificacao[],
  tarefas: TarefaUnificada[],
  ctx?: AlertFinanceContext,
): number
{
  const unread = listNotificacoesAcionaveis(notificacoes, tarefas).length
  const prazos = listPrazosUrgentes(tarefas).length
  const atrasadas = listTarefasAtrasadas(tarefas, ctx).length
  return unread + prazos + atrasadas
}
