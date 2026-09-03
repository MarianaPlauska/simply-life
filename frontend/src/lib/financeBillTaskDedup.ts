import type { TarefaUnificada } from '../types'

/** Valor numérico a partir do título do boleto */
export function parseBillAmountFromTitle(titulo: string): number
{
  const m = titulo.match(/R\$\s*([\d.,]+)/i)
  if (!m?.[1]) return 0
  const raw = m[1].includes(',')
    ? m[1].replace(/\./g, '').replace(',', '.')
    : m[1]
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

/** Nome do credor a partir do título (vários formatos de tarefa financeira) */
export function parseBillNameFromTitle(titulo: string): string | null
{
  const t = titulo.trim()
  const boleto = t.match(/\[Boleto\]\s*(.+?)\s*[---]\s*R\$/i)
  if (boleto?.[1])
  {
    return boleto[1].replace(/\s*\[fixa:\d+\]/gi, '').trim()
  }

  const emoji = t.match(/^📄\s*(.+?)\s+vence/i)
  if (emoji?.[1])
  {
    return emoji[1].trim()
  }

  if (t.toLowerCase().includes('boleto'))
  {
    const bare = t.replace(/^\[Boleto\]\s*/i, '').split(/\s*[---]\s*/)[0]
    return bare.replace(/\s*\[fixa:\d+\]/gi, '').trim() || null
  }

  return null
}

/** Chave canônica nome+valor - une formatos [Boleto], 📄 e phantom */
export function billCanonicalKey(input: { titulo: string }): string | null
{
  const nome = parseBillNameFromTitle(input.titulo)
  if (!nome) return null
  const valor = parseBillAmountFromTitle(input.titulo)
  return `bill|${nome.toLowerCase()}|${valor.toFixed(2)}`
}

/** Nome do credor normalizado - une "Eric", "Eric [fixa:2]" e "[Boleto] Eric - R$ 10" */
export function normalizeBillCreditorName(titulo: string): string
{
  const parsed = parseBillNameFromTitle(titulo)
  if (parsed)
  {
    return parsed.toLowerCase()
  }

  let s = titulo.trim()
  s = s.replace(/^\[Boleto\]\s*/i, '')
  s = s.split(/\s*[---]\s*R\$/i)[0] ?? s
  s = s.replace(/\s*\[fixa:\d+\]/gi, '')
  return s.trim().toLowerCase()
}

export function settlementCanonicalKey(input: { titulo: string; valor: number }): string
{
  const nome = normalizeBillCreditorName(input.titulo)
  const valor = input.valor > 0 ? input.valor : parseBillAmountFromTitle(input.titulo)
  return `bill|${nome}|${valor.toFixed(2)}`
}

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

/** Chave estável para agrupar duplicatas - qualquer status */
export function billTaskReferenceKey(t: TarefaUnificada): string | null
{
  if (t.snippet_100_char?.startsWith('phantom_fin_'))
  {
    return t.snippet_100_char
  }

  const titulo = t.titulo.trim()
  const boletoMatch = titulo.match(/\[Boleto\]\s*(.+?)\s*[---]\s*(R\$\s*[\d.,]+)/i)
  if (boletoMatch)
  {
    const nome = boletoMatch[1].replace(/\s*\[fixa:\d+\]/gi, '').trim().toLowerCase()
    return `boleto|${nome}|${boletoMatch[2].replace(/\s/g, '').toLowerCase()}`
  }

  const emojiMatch = titulo.match(/^📄\s*(.+?)\s+vence/i)
  if (emojiMatch)
  {
    return `conta|${emojiMatch[1].trim().toLowerCase()}`
  }

  if (titulo.toLowerCase().includes('boleto') || t.origem === 'financeiro')
  {
    return `titulo|${titulo.toLowerCase()}`
  }

  return null
}

/** Chave estável para agrupar duplicatas do mesmo boleto (só pendentes) */
export function billTaskDedupKey(t: TarefaUnificada): string | null
{
  if (!isFinanceBillTask(t)) return null
  return billCanonicalKey(t) ?? billTaskReferenceKey(t)
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

/** Chave de referência a partir do título padrão de boleto (sync Kanban) */
export function billReferenceKeyFromTitle(titulo: string): string | null
{
  return billTaskReferenceKey({
    id: 0,
    titulo,
    status: 'pendente',
    origem: 'financeiro',
  } as TarefaUnificada)
}

/** Já existe tarefa pendente para o mesmo boleto (phantom, ref ou título) */
export function hasPendingBillTask(
  tarefas: TarefaUnificada[],
  opts: { titulo: string; phantomKey?: string },
): boolean
{
  const refKey = billReferenceKeyFromTitle(opts.titulo)

  for (const t of tarefas)
  {
    if (t.status === 'concluida') continue
    if (opts.phantomKey && t.snippet_100_char === opts.phantomKey) return true
    const canon = billCanonicalKey({ titulo: opts.titulo })
    if (canon && billCanonicalKey(t) === canon) return true
    if (refKey && billTaskReferenceKey(t) === refKey) return true
  }

  return false
}
