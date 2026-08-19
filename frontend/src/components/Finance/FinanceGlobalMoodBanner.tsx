import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { summarizeSpreadsheetPeriod } from '../../lib/financeSpreadsheetAnalytics'
import { resolveSpreadsheetMood } from '../../lib/financeSpreadsheetMood'
import { countBillsDueWithinHours } from '../../lib/financeBillUrgency'
import { FinanceSpreadsheetMoodBanner } from './spreadsheet/FinanceSpreadsheetMoodBanner'
import type { Transaction } from '../../store/storeTypes'

interface FinanceGlobalMoodBannerProps
{
  monthLabel: string
  monthOffset: number
  monthTransactions: Transaction[]
  allTransactions: Transaction[]
  saldoInicial: number
  billAlertHref?: string
}

// Mascote AXEL em todas as abas de Finanças — humor conforme entradas × saídas do mês

export function FinanceGlobalMoodBanner({
  monthLabel,
  monthOffset,
  monthTransactions,
  allTransactions,
  saldoInicial,
  billAlertHref,
}: FinanceGlobalMoodBannerProps)
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)

  const billAlertCount = useMemo(
    () => countBillsDueWithinHours({ contasFixas, reservedBills, cards, transactions }),
    [contasFixas, reservedBills, cards, transactions],
  )

  const billAlertHint = useMemo(() =>
  {
    if (billAlertCount <= 0) return undefined
    const n = billAlertCount
    return `${n} conta${n > 1 ? 's' : ''} vence${n > 1 ? 'm' : ''} em até 48h. Confira faturas.`
  }, [billAlertCount])

  const moodState = useMemo(() =>
  {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const periodStart = d.toISOString().slice(0, 10)
    const summary = summarizeSpreadsheetPeriod(
      monthTransactions,
      periodStart,
      allTransactions,
      saldoInicial,
    )
    return resolveSpreadsheetMood(summary)
  }, [monthTransactions, allTransactions, saldoInicial, monthOffset])

  return (
    <FinanceSpreadsheetMoodBanner
      moodState={moodState}
      periodLabel={monthLabel}
      compact
      billAlertCount={billAlertCount}
      billAlertHint={billAlertHint}
      billAlertHref={billAlertHref}
    />
  )
}
