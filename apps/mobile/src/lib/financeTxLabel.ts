import { isCreditExpense, isFaturaSettlement, type FinanceTx } from '@simply-life/shared'

/** Legenda curta do lançamento no extrato. */
export function financeTxSubtitle(tx: FinanceTx): string
{
  const bits = [tx.data]
  if (tx.tipo === 'receita') bits.push('Receita')
  else if (isFaturaSettlement(tx)) bits.push('Fatura paga')
  else if (isCreditExpense(tx)) bits.push('Crédito · na fatura')
  else bits.push('Conta')

  if (tx.pagoContaCasal) bits.push('conta do casal')
  else if (tx.escopo === 'casal') bits.push('Casal')
  return bits.join(' · ')
}
