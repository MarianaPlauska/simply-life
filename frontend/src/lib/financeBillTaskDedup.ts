import type { TarefaUnificada } from '../types'

/** Tarefa gerada automaticamente para lembrar de pagar conta/boleto */
export function isFinanceBillTask(t: TarefaUnificada): boolean
{
  if (t.status === 'concluida') return false

  const titulo = t.titulo.toLowerCase()
  if (t.origem === 'financeiro') return true
  if (titulo.includes('[boleto]')) return true
  if (titulo.includes('boleto')) return true
  if (titulo.startsWith('📄')) return true
  if (t.snippet_100_char?.startsWith('phantom_fin_bill_')) return true
  if (t.snippet_100_char?.startsWith('phantom_fin_conta_')) return true

  return false
}

/** Chave estável para agrupar duplicatas do mesmo boleto */
export function billTaskDedupKey(t: TarefaUnificada): string | null
{
  if (!isFinanceBillTask(t)) return null

  if (t.snippet_100_char?.startsWith('phantom_fin_'))
  {
    return t.snippet_100_char
  }

  const titulo = t.titulo.trim()
  const boletoMatch = titulo.match(/\[Boleto\]\s*(.+?)\s*[—–-]\s*(R\$\s*[\d.,]+)/i)
  if (boletoMatch)
  {
    return `boleto|${boletoMatch[1].trim().toLowerCase()}|${boletoMatch[2].replace(/\s/g, '').toLowerCase()}`
  }

  const emojiMatch = titulo.match(/^📄\s*(.+?)\s+vence/i)
  if (emojiMatch)
  {
    return `conta|${emojiMatch[1].trim().toLowerCase()}`
  }

  return `titulo|${titulo.toLowerCase()}`
}

export interface BillTaskDedupPlan
{
  keeperId: number
  duplicateIds: number[]
}

/** Agrupa duplicatas e indica qual manter (phantom key > mais recente) */
export function planBillTaskDedup(tarefas: TarefaUnificada[]): BillTaskDedupPlan[]
{
  const groups = new Map<string, TarefaUnificada[]>()

  for (const t of tarefas)
  {
    const key = billTaskDedupKey(t)
    if (!key) continue
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }

  const plans: BillTaskDedupPlan[] = []

  for (const group of groups.values())
  {
    if (group.length <= 1) continue

    const sorted = [...group].sort((a, b) =>
    {
      const aPhantom = a.snippet_100_char?.startsWith('phantom_fin_bill_') ? 1 : 0
      const bPhantom = b.snippet_100_char?.startsWith('phantom_fin_bill_') ? 1 : 0
      if (aPhantom !== bPhantom) return bPhantom - aPhantom
      return b.id - a.id
    })

    const keeper = sorted[0]
    const duplicateIds = sorted.slice(1).map((t) => t.id)
    plans.push({ keeperId: keeper.id, duplicateIds })
  }

  return plans
}

export function countDuplicateBillTasks(tarefas: TarefaUnificada[]): number
{
  return planBillTaskDedup(tarefas).reduce((n, p) => n + p.duplicateIds.length, 0)
}

export function duplicateBillTaskIds(tarefas: TarefaUnificada[]): number[]
{
  return planBillTaskDedup(tarefas).flatMap((p) => p.duplicateIds)
}
