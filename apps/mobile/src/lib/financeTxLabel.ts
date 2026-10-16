import { brDateFromIso, isCreditExpense, isFaturaSettlement, type FinanceTx } from '@simply-life/shared'

/** Legenda curta do lançamento no extrato. */
export function financeTxSubtitle(tx: FinanceTx): string
{
  // dia no jeito do Brasil (06/10); se a data vier em outro formato, mostra como veio
  const bits = [brDateFromIso(tx.data?.slice(0, 10) ?? '').slice(0, 5) || tx.data]
  if (tx.tipo === 'receita') bits.push('Receita')
  else if (isFaturaSettlement(tx)) bits.push('Fatura paga')
  else if (isCreditExpense(tx)) bits.push('Crédito · na fatura')
  else bits.push('Conta')

  if (tx.pagoContaCasal) bits.push('conta do casal')
  else if (tx.escopo === 'casal') bits.push('Casal')
  return bits.join(' · ')
}
