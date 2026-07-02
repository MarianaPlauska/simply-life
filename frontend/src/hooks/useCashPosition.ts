import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import {
  computeCashPosition,
  resolveCashPosition,
  type CashPosition,
} from '../lib/financeReservedBills'

export interface CashPositionPair
{
  /** Valores calculados pelo extrato (sem override manual) */
  computed: CashPosition
  /** Valores exibidos — respeita saldos fixados manualmente */
  display: CashPosition
}

/** Posição de caixa calculada + exibida, com fixas e settlements */
export function useCashPosition(): CashPositionPair
{
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const billSettlements = useTaskStore((s) => s.billSettlements)

  const computed = useMemo(
    () => computeCashPosition(transactions, cashAccount.saldo_inicial, reservedBills, {
      contasFixas,
      billSettlements,
    }),
    [transactions, cashAccount.saldo_inicial, reservedBills, contasFixas, billSettlements],
  )

  const display = useMemo(
    () => resolveCashPosition({
      transactions,
      cashAccount,
      reservedBills,
      contasFixas,
      billSettlements,
    }),
    [transactions, cashAccount, reservedBills, contasFixas, billSettlements],
  )

  return { computed, display }
}
