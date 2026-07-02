import type { Transaction } from '../store/storeTypes'
import { settlementCanonicalKey } from './financeBillTaskDedup'

/** Normaliza descrição como no fetchTransactions — une fixa/card no dedupe */
export function normalizeTxDescription(descricao: string): string
{
  return descricao
    .replace(/\s*\[card:card_\d+\]/gi, '')
    .replace(/\s*\[fixa:\d+\]/gi, '')
    .replace(/\s*\[receita-recorrente:\d+\]/gi, '')
    .trim()
}

/** Chave para agrupar lançamentos duplicados no mesmo dia */
export function ledgerEntryDedupKey(tx: Transaction): string
{
  const status = tx.status_pagamento ?? 'pendente'
  const data = tx.data.slice(0, 10)
  const desc = normalizeTxDescription(tx.descricao)
  const canon = settlementCanonicalKey({ titulo: desc, valor: tx.valor })
  return `${tx.tipo}|${data}|${status}|${canon}`
}

function statusRank(status: string): number
{
  if (status === 'pago') return 0
  if (status === 'agendado') return 1
  return 2
}

/** Chave de negócio — une "Eric" e "[Boleto] Eric" no mesmo mês (ignora status) */
export function transactionBusinessKey(tx: Transaction): string
{
  const month = tx.data.slice(0, 7)
  const desc = normalizeTxDescription(tx.descricao)
  const canon = settlementCanonicalKey({ titulo: desc, valor: tx.valor })
  const channel = tx.card_id ? `card:${tx.card_id}` : 'cash'
  return `${tx.tipo}|${month}|${canon}|${channel}`
}

function pickBetterTransaction(a: Transaction, b: Transaction): Transaction
{
  const aStatus = a.status_pagamento ?? 'pendente'
  const bStatus = b.status_pagamento ?? 'pendente'
  const aRank = statusRank(aStatus)
  const bRank = statusRank(bStatus)
  if (aRank !== bRank)
  {
    return aRank < bRank ? a : b
  }
  return a.id < b.id ? a : b
}

/** Mantém um lançamento por chave — o de menor id */
export function dedupeLedgerEntries(transactions: Transaction[]): Transaction[]
{
  const byKey = new Map<string, Transaction>()

  for (const tx of transactions)
  {
    const key = ledgerEntryDedupKey(tx)
    const prev = byKey.get(key)
    if (!prev || tx.id < prev.id)
    {
      byKey.set(key, tx)
    }
  }

  return [...byKey.values()].sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
}

/** Deduplica para saldo e KPIs — mesmo boleto no mês conta uma vez (prefere pago) */
export function dedupeTransactionsForLedger(transactions: Transaction[]): Transaction[]
{
  const byKey = new Map<string, Transaction>()

  for (const tx of transactions)
  {
    const key = transactionBusinessKey(tx)
    const prev = byKey.get(key)
    if (!prev)
    {
      byKey.set(key, tx)
      continue
    }
    byKey.set(key, pickBetterTransaction(prev, tx))
  }

  return [...byKey.values()]
}

export function countLedgerDuplicates(transactions: Transaction[]): number
{
  return transactions.length - dedupeTransactionsForLedger(transactions).length
}
