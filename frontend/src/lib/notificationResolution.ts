import type { FinanceBillSettlement, Notificacao, Transaction } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { getOverdueTasks, getUrgentDeadlineTasks } from './axelAlerts'
import { dismissBillForTask } from './financeBillOrchestrator'
import { billTaskReferenceKey, parseBillAmountFromTitle } from './financeBillTaskDedup'
import { markDueNotifSent } from './financeBillDismiss'
import { isPaidInSettlements } from './financeLedgerReconcile'
import { hasPaidExpenseForBill } from './financeBillPayment'
import { isNotificacaoLida } from './notificacaoUtils'
import { supabase } from './supabase'

function billLabelFromTitle(titulo: string): string | null
{
  const t = titulo.trim()
  const boleto = t.match(/\[Boleto\]\s*(.+?)\s*[—–-]/i)
  if (boleto) return boleto[1].replace(/\s*\[fixa:\d+\]/gi, '').trim()

  const emoji = t.match(/^📄\s*(.+?)\s+vence/i)
  if (emoji) return emoji[1].trim()

  return null
}

function notificationBillLabel(n: Notificacao): string | null
{
  const fromTitle = n.titulo
    .replace(/^conta (em \d+ dia\(s\)|vence hoje) · /i, '')
    .replace(/^axel\s*[-·]/i, '')
    .trim()
  return fromTitle || null
}

export function completedBillReferenceKeys(tarefas: TarefaUnificada[]): Set<string>
{
  const keys = new Set<string>()
  for (const t of tarefas)
  {
    if (t.status !== 'concluida') continue
    const key = billTaskReferenceKey(t)
    if (key) keys.add(key)
  }
  return keys
}

function isTaskResolved(tarefas: TarefaUnificada[], taskId: number): boolean
{
  const task = tarefas.find((t) => t.id === taskId)
  return task?.status === 'concluida'
}

export interface AlertFinanceContext
{
  settlements?: FinanceBillSettlement[]
  transactions?: Transaction[]
}

function isBillTaskAlreadyPaid(
  task: TarefaUnificada,
  ctx?: AlertFinanceContext,
): boolean
{
  if (!ctx) return false

  const valor = parseBillAmountFromTitle(task.titulo)
  const monthKey = (task.data_vencimento ?? '').slice(0, 7)
    || new Date().toISOString().slice(0, 7)
  const settlements = ctx.settlements ?? []
  const transactions = ctx.transactions ?? []

  if (settlements.length > 0)
  {
    if (isPaidInSettlements(task.titulo, valor, settlements)) return true
  }

  if (transactions.length > 0 && valor > 0)
  {
    if (hasPaidExpenseForBill(transactions, task.titulo, valor, monthKey)) return true
  }

  return false
}

/** Remove duplicatas e tarefas já resolvidas (incl. boleto concluído em outra cópia) */
export function filterOverdueTasksForAlerts(
  tarefas: TarefaUnificada[],
  ctx?: AlertFinanceContext,
): TarefaUnificada[]
{
  const completedKeys = completedBillReferenceKeys(tarefas)
  const seenKeys = new Set<string>()
  const seenIds = new Set<number>()
  const out: TarefaUnificada[] = []

  for (const task of getOverdueTasks(tarefas)
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0)))
  {
    if (seenIds.has(task.id)) continue
    if (isBillTaskAlreadyPaid(task, ctx)) continue

    const key = billTaskReferenceKey(task)
    if (key)
    {
      if (completedKeys.has(key)) continue
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
    }

    seenIds.add(task.id)
    out.push(task)
  }

  return out
}

export function filterUrgentTasksForAlerts(tarefas: TarefaUnificada[]): TarefaUnificada[]
{
  const completedKeys = completedBillReferenceKeys(tarefas)
  const seenKeys = new Set<string>()
  const seenIds = new Set<number>()
  const out: TarefaUnificada[] = []

  for (const task of getUrgentDeadlineTasks(tarefas))
  {
    if (seenIds.has(task.id)) continue

    const key = billTaskReferenceKey(task)
    if (key)
    {
      if (completedKeys.has(key)) continue
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
    }

    seenIds.add(task.id)
    out.push(task)
  }

  return out
}

export function isNotificationResolved(
  n: Notificacao,
  tarefas: TarefaUnificada[],
  completedKeys: Set<string>,
): boolean
{
  if (isNotificacaoLida(n.lida)) return true

  if (n.tipo === 'tarefa')
  {
    const match = n.mensagem?.match(/SL-\d+/i) ?? n.titulo.match(/SL-\d+/i)
    if (match)
    {
      const id = Number(match[0].replace(/\D/g, ''))
      if (id > 0 && isTaskResolved(tarefas, id)) return true
    }
  }

  if (n.tipo !== 'financeiro') return false

  const notifLabel = notificationBillLabel(n)?.toLowerCase()
  if (!notifLabel) return false

  for (const t of tarefas)
  {
    if (t.status !== 'concluida') continue
    const taskLabel = billLabelFromTitle(t.titulo)?.toLowerCase()
    if (!taskLabel) continue
    if (taskLabel.includes(notifLabel) || notifLabel.includes(taskLabel))
    {
      return true
    }
    const key = billTaskReferenceKey(t)
    if (key && completedKeys.has(key))
    {
      const normalized = notifLabel.replace(/\s+/g, ' ')
      if (t.titulo.toLowerCase().includes(normalized.split(' ')[0]))
      {
        return true
      }
    }
  }

  for (const key of completedKeys)
  {
    const parts = key.split('|')
    const name = parts[1]?.toLowerCase()
    if (name && notifLabel.includes(name))
    {
      return true
    }
  }

  return false
}

/** Marca notificações ligadas à tarefa concluída */
export async function markNotificationsForCompletedTask(tarefa: TarefaUnificada): Promise<void>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return

  const label = billLabelFromTitle(tarefa.titulo)?.toLowerCase()
  const phantom = tarefa.snippet_100_char?.match(/^phantom_fin_bill_(.+)$/)

  if (phantom?.[1])
  {
    markDueNotifSent(phantom[1])
  }

  dismissBillForTask(tarefa)

  const { data: rows } = await supabase
    .from('notificacoes')
    .select('id, titulo, tipo, lida')
    .eq('user_id', uid)
    .eq('lida', 0)

  if (!rows?.length) return

  const ids = rows
    .filter((n) =>
    {
      const titulo = String(n.titulo ?? '').toLowerCase()
      if (n.tipo === 'tarefa' && titulo.includes(tarefa.titulo.toLowerCase().slice(0, 24)))
      {
        return true
      }
      if (n.tipo === 'financeiro' && label)
      {
        const notifLabel = notificationBillLabel({
          id: Number(n.id),
          titulo: String(n.titulo),
          mensagem: '',
          tipo: 'financeiro',
          urgencia: 'normal',
          lida: false,
          score_urgencia: 0,
          criado_em: '',
        })?.toLowerCase()
        if (notifLabel && (notifLabel.includes(label) || label.includes(notifLabel)))
        {
          return true
        }
      }
      return false
    })
    .map((n) => Number(n.id))

  if (ids.length === 0) return

  await supabase.from('notificacoes').update({ lida: 1 }).in('id', ids)
}

export async function reconcileStaleNotifications(
  notificacoes: Notificacao[],
  tarefas: TarefaUnificada[],
): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const completedKeys = completedBillReferenceKeys(tarefas)
  const staleIds = notificacoes
    .filter((n) => isNotificationResolved(n, tarefas, completedKeys))
    .map((n) => n.id)

  if (staleIds.length === 0) return 0

  await supabase.from('notificacoes').update({ lida: 1 }).in('id', staleIds)
  return staleIds.length
}
