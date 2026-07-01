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
  const seen = new Map<string, Notificacao>()

  for (const n of notificacoes)
  {
    if (!isNotificacaoAcionavel(n)) continue

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

export function listTarefasAtrasadas(tarefas: TarefaUnificada[]): TarefaAtrasadaItem[]
{
  const seen = new Set<number>()
  const items: TarefaAtrasadaItem[] = []

  for (const task of getOverdueTasks(tarefas)
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0)))
  {
    if (seen.has(task.id)) continue
    seen.add(task.id)
    items.push({ kind: 'tarefa_atrasada', task })
  }

  return items
}

export function listPrazosUrgentes(tarefas: TarefaUnificada[]): PrazoUrgenteItem[]
{
  const seen = new Set<number>()
  const items: PrazoUrgenteItem[] = []

  for (const task of getUrgentDeadlineTasks(tarefas))
  {
    if (seen.has(task.id)) continue
    seen.add(task.id)
    items.push({ kind: 'prazo_24h', task })
  }

  return items
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

export function countAlertasHeader(notificacoes: Notificacao[], tarefas: TarefaUnificada[]): number
{
  const unread = listNotificacoesAcionaveis(notificacoes).length
  const prazos = listPrazosUrgentes(tarefas).length
  const atrasadas = listTarefasAtrasadas(tarefas).length
  return unread + prazos + atrasadas
}
