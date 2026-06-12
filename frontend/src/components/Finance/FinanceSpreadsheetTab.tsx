import { useMemo, useState } from 'react'
import { FinancePeriodToolbar } from './FinancePeriodToolbar'
import { FinanceGroupedRollupTable } from './FinanceGroupedRollupTable'
import { FinanceSpreadsheetHeader } from './spreadsheet/FinanceSpreadsheetHeader'
import { FinanceSpreadsheetTable } from './spreadsheet/FinanceSpreadsheetTable'
import { FinanceSpreadsheetAnnualPanel } from './spreadsheet/FinanceSpreadsheetAnnualPanel'
import { resolveFinancePeriod, type FinancePeriodConfig } from '../../lib/financePeriodFilter'
import {
  buildAnnualCumulative,
  buildAnnualKpis,
  buildMonthlyReceitaDespesa,
  buildSpreadsheetLedger,
  summarizeSpreadsheetPeriod,
} from '../../lib/financeSpreadsheetAnalytics'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { useTaskStore } from '../../store/useTaskStore'
import type { Category, Transaction } from '../../store/storeTypes'

interface FinanceSpreadsheetTabProps
{
  periodLabel: string
  periodTransactions: Transaction[]
  allTransactions: Transaction[]
  periodConfig: FinancePeriodConfig
  onPeriodChange: (config: FinancePeriodConfig) => void
  onPeriodShift: (direction: -1 | 1) => void
  activeCategories: Category[]
  onNewTransaction: () => void
}

export function FinanceSpreadsheetTab({
  periodLabel,
  periodTransactions,
  allTransactions,
  periodConfig,
  onPeriodChange,
  onPeriodShift,
  activeCategories,
  onNewTransaction,
}: FinanceSpreadsheetTabProps)
{
  const [showGrupos, setShowGrupos] = useState(false)

  const cards = useTaskStore((s) => s.cards)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)

  const resolvedPeriod = useMemo(
    () => resolveFinancePeriod(periodConfig),
    [periodConfig],
  )

  const summary = useMemo(
    () => summarizeSpreadsheetPeriod(
      periodTransactions,
      resolvedPeriod.start,
      allTransactions,
      cashAccount.saldo_inicial,
    ),
    [periodTransactions, resolvedPeriod.start, allTransactions, cashAccount.saldo_inicial],
  )

  const ledger = useMemo(
    () => buildSpreadsheetLedger(
      periodTransactions,
      activeCategories,
      summary.saldoInicio,
    ),
    [periodTransactions, activeCategories, summary.saldoInicio],
  )

  const viewYear = useMemo(() =>
  {
    const d = new Date(`${resolvedPeriod.start}T12:00:00`)
    return d.getFullYear()
  }, [resolvedPeriod.start])

  const monthly = useMemo(
    () => buildMonthlyReceitaDespesa(allTransactions, viewYear),
    [allTransactions, viewYear],
  )

  const cumulative = useMemo(
    () => buildAnnualCumulative(allTransactions, viewYear),
    [allTransactions, viewYear],
  )

  const annualKpis = useMemo(
    () => buildAnnualKpis(allTransactions, viewYear, recurringIncomes, contasFixas),
    [allTransactions, viewYear, recurringIncomes, contasFixas],
  )

  return (
    <div className="space-y-4">
      <FinancePeriodToolbar
        config={periodConfig}
        resolved={resolvedPeriod}
        onChange={onPeriodChange}
        onShift={onPeriodShift}
      />

      <FinanceSpreadsheetHeader
        periodLabel={periodLabel}
        summary={summary}
        onNewTransaction={onNewTransaction}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Extrato · {periodLabel}
        </span>
        <button
          type="button"
          onClick={() => setShowGrupos(!showGrupos)}
          className={showGrupos ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
        >
          {showGrupos ? 'Ocultar grupos' : 'Ver por grupo'}
        </button>
      </div>

      <FinanceSpreadsheetTable rows={ledger} cards={cards} />

      {showGrupos && (
        <FinanceGroupedRollupTable
          transactions={periodTransactions}
          activeCategories={activeCategories}
          periodLabel={periodLabel}
        />
      )}

      <FinanceSpreadsheetAnnualPanel
        year={viewYear}
        receitaKpi={annualKpis.receita}
        despesaKpi={annualKpis.despesa}
        monthly={monthly}
        cumulative={cumulative}
      />
    </div>
  )
}
