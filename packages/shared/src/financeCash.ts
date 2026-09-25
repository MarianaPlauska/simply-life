import type { FinanceTx } from './finance'

export type FinancePaymentMethod =
  | 'pix'
  | 'debito'
  | 'dinheiro'
  | 'boleto'
  | 'cartao'
  | 'ted'
  | 'outro'

export type CardInstallment = {
  id: string
  titulo: string
  valor: number
  data: string
  atual: number
  total: number
}

const PARCELA_RE = /(\d+)\s*\/\s*(\d+)\s*$/

/** Compra no crédito — não sai do saldo até a fatura ser paga. */
export function isCreditExpense(tx: FinanceTx): boolean
{
  if (tx.tipo !== 'despesa') return false
  if (tx.cardId) return true
  return tx.formaPagamento === 'cartao'
}

/** Lançamento de liquidação da fatura (sai do caixa na hora). */
export function isFaturaSettlement(tx: FinanceTx): boolean
{
  if (tx.tipo !== 'despesa' || isCreditExpense(tx)) return false
  return /^\s*fatura\b/i.test(tx.titulo)
}

export function hitsCashBalance(tx: FinanceTx): boolean
{
  if (tx.tipo === 'receita') return true
  return !isCreditExpense(tx)
}

export function invoicePaidKey(cardId: string, isoOrYm: string): string
{
  return `cartao:${cardId}:${isoOrYm.slice(0, 7)}`
}

export function txsInCalendarMonth(
  txs: FinanceTx[] | null | undefined,
  ref = new Date(),
): FinanceTx[]
{
  const y = ref.getFullYear()
  const m = ref.getMonth()
  return (txs ?? []).filter((t) =>
  {
    const d = String(t.data || '').slice(0, 10)
    if (d.length < 10) return false
    const dt = new Date(`${d}T12:00:00`)
    return dt.getFullYear() === y && dt.getMonth() === m
  })
}

export function cashExpenseTotal(txs: FinanceTx[] | null | undefined): number
{
  return (txs ?? [])
    .filter((t) => t.tipo === 'despesa' && hitsCashBalance(t))
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
}

export function creditExpenseTotal(txs: FinanceTx[] | null | undefined): number
{
  return (txs ?? [])
    .filter((t) => isCreditExpense(t))
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
}

export function monthDailyIncomeSeries(
  txs: FinanceTx[] | null | undefined,
  now = new Date(),
): { day: number; total: number }[]
{
  const y = now.getFullYear()
  const m = now.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const totals = new Array<number>(daysInMonth).fill(0)
  for (const t of txs ?? [])
  {
    if (t?.tipo !== 'receita') continue
    const d = String(t.data || '').slice(0, 10)
    if (d.length < 10) continue
    const dt = new Date(`${d}T12:00:00`)
    if (dt.getFullYear() !== y || dt.getMonth() !== m) continue
    totals[dt.getDate() - 1] += Number(t.valor) || 0
  }
  return totals.map((total, i) => ({ day: i + 1, total }))
}

/**
 * ETAPA 2 (docs/FINANCAS_ETAPA_2.md §3): hoje só lê "3/12" do título. Parcelas de verdade
 * = N lançamentos criados na compra, um por fatura, agrupados por grupo_parcela_id.
 */
export function parseParcela(titulo: string): { atual: number; total: number } | null
{
  const m = titulo.trim().match(PARCELA_RE)
  if (!m) return null
  const atual = Number(m[1])
  const total = Number(m[2])
  if (!(atual > 0) || !(total > 0) || atual > total) return null
  return { atual, total }
}

export function cardCreditTxs(
  txs: FinanceTx[],
  card: { id: string; nome: string },
): FinanceTx[]
{
  const nome = card.nome.toLowerCase()
  return txs.filter((t) =>
    isCreditExpense(t)
    && (t.cardId === card.id
      || t.titulo.toLowerCase().includes(`[${nome}]`)
      || t.titulo.toLowerCase().includes(nome)),
  )
}

export function cardInstallments(
  txs: FinanceTx[],
  card: { id: string; nome: string },
): CardInstallment[]
{
  return cardCreditTxs(txs, card)
    .map((t) =>
    {
      const parsed = parseParcela(t.titulo)
      return {
        id: t.id,
        titulo: t.titulo.replace(PARCELA_RE, '').trim() || t.titulo,
        valor: t.valor,
        data: t.data,
        atual: parsed?.atual ?? 1,
        total: parsed?.total ?? 1,
      }
    })
    .sort((a, b) => a.data.localeCompare(b.data) || a.atual - b.atual)
}

export function cardInvoiceSettledThisMonth(
  card: { nome: string },
  txs: FinanceTx[],
  ref = new Date(),
): boolean
{
  const nome = card.nome.toLowerCase()
  return txsInCalendarMonth(txs, ref).some(
    (t) => isFaturaSettlement(t) && t.titulo.toLowerCase().includes(nome),
  )
}

export function cardFaturaAbertaDisplay(
  card: { id: string; nome: string; faturaAberta?: number },
  txs: FinanceTx[],
  ref = new Date(),
): number
{
  if (cardInvoiceSettledThisMonth(card, txs, ref)) return 0
  if ((card.faturaAberta ?? 0) > 0) return card.faturaAberta ?? 0
  return creditExpenseTotal(cardCreditTxs(txsInCalendarMonth(txs, ref), card))
}

export function monthDateFromOffset(offset: number, ref = new Date()): Date
{
  return new Date(ref.getFullYear(), ref.getMonth() - offset, 1)
}

export function txsForFolder(
  txs: FinanceTx[] | null | undefined,
  folderId: string | null | undefined,
): FinanceTx[]
{
  const list = txs ?? []
  if (!folderId || folderId === 'loose')
  {
    return list.filter((t) => !t.folderId)
  }
  return list.filter((t) => t.folderId === folderId)
}

// ---------------------------------------------------------------------------
// Parcelas de uma mesma compra
// ---------------------------------------------------------------------------

function normTitle(t: string): string
{
  return t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(PARCELA_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Chave do grupo de parcelas. Lançamentos novos têm grupoParcela; os antigos
 * são reconhecidos pelo "N/M" no fim do título + cartão + valor + total de parcelas.
 */
export function installmentGroupKey(tx: FinanceTx): string | null
{
  if (tx.grupoParcela) return `g:${tx.grupoParcela}`
  const p = parseParcela(tx.titulo)
  if (!p || p.total < 2) return null
  return `leg:${tx.cardId ?? ''}|${normTitle(tx.titulo)}|${p.total}|${Math.round(tx.valor * 100)}`
}

export type InstallmentGroup = {
  key: string
  titulo: string
  parcelas: FinanceTx[]
  /** posição do lançamento consultado (1 = primeira) */
  atual: number
  total: number
  valorParcela: number
  /** parcelas depois desta */
  restantes: FinanceTx[]
  valorRestante: number
}

export function installmentGroupOf(txs: FinanceTx[], tx: FinanceTx): InstallmentGroup | null
{
  const key = installmentGroupKey(tx)
  if (!key) return null
  const parcelas = txs
    .filter((t) => installmentGroupKey(t) === key)
    .sort((a, b) => a.data.localeCompare(b.data) || (parseParcela(a.titulo)?.atual ?? 0) - (parseParcela(b.titulo)?.atual ?? 0))
  if (parcelas.length < 2) return null
  const idx = parcelas.findIndex((t) => t.id === tx.id)
  const restantes = parcelas.slice(idx + 1)
  return {
    key,
    titulo: tx.titulo.replace(PARCELA_RE, '').trim() || tx.titulo,
    parcelas,
    atual: parseParcela(tx.titulo)?.atual ?? idx + 1,
    total: parseParcela(tx.titulo)?.total ?? parcelas.length,
    valorParcela: tx.valor,
    restantes,
    valorRestante: Math.round(restantes.reduce((s, t) => s + t.valor, 0) * 100) / 100,
  }
}
