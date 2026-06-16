import { useMemo, useState } from 'react'
import { FinancePeriodToolbar } from './FinancePeriodToolbar'
import { FinanceGroupedRollupTable } from './FinanceGroupedRollupTable'
import { FinanceSpreadsheetTable } from './spreadsheet/FinanceSpreadsheetTable'
import { FinanceSpreadsheetAnnualPanel } from './spreadsheet/FinanceSpreadsheetAnnualPanel'
import { FinanceSpreadsheetDashboard } from './spreadsheet/FinanceSpreadsheetDashboard'
import { FinanceExcelSpreadsheet } from './spreadsheet/FinanceExcelSpreadsheet'
import { resolveFinancePeriod, type FinancePeriodConfig } from '../../lib/financePeriodFilter'
import {
  buildAnnualCumulative,
  buildAnnualKpis,
  buildMonthlyReceitaDespesa,
  buildPeriodIncomeBreakdown,
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

type SheetView = 'painel' | 'excel' | 'extrato' | 'anual'

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
  const [sheetView, setSheetView] = useState<SheetView>('painel')
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

  const breakdown = useMemo(
    () => buildPeriodIncomeBreakdown(periodTransactions, recurringIncomes),
    [periodTransactions, recurringIncomes],
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

  const sheetTabs: { id: SheetView; label: string }[] = [
    { id: 'painel', label: 'Painel' },
    { id: 'excel', label: 'Planilha' },
    { id: 'extrato', label: 'Extrato' },
    { id: 'anual', label: 'Anual' },
  ]

  return (
    <div className="space-y-4">
      <FinancePeriodToolbar
        config={periodConfig}
        resolved={resolvedPeriod}
        onChange={onPeriodChange}
        onShift={onPeriodShift}
      />

      <div className="flex gap-0 border-b border-line overflow-x-auto scrollbar-none">
        {sheetTabs.map(({ id, label }) =>
        {
          const active = sheetView === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSheetView(id)}
              className={[
                'shrink-0 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide border-b-2 -mb-px transition-colors',
                active
                  ? 'border-[#217346] text-[#217346] bg-[#217346]/8'
                  : 'border-transparent text-ink-muted hover:text-ink hover:bg-chrome/50',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {sheetView === 'painel' && (
        <FinanceSpreadsheetDashboard
          periodLabel={periodLabel}
          summary={summary}
          breakdown={breakdown}
          onNewTransaction={onNewTransaction}
        />
      )}

      {sheetView === 'excel' && (
        <FinanceExcelSpreadsheet
          periodLabel={periodLabel}
          summary={summary}
          rows={ledger}
          cards={cards}
        />
      )}

      {sheetView === 'extrato' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Extrato · {periodLabel} · {ledger.length} linha{ledger.length !== 1 ? 's' : ''}
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
        </>
      )}

      {sheetView === 'anual' && (
        <FinanceSpreadsheetAnnualPanel
          year={viewYear}
          receitaKpi={annualKpis.receita}
          despesaKpi={annualKpis.despesa}
          monthly={monthly}
          cumulative={cumulative}
        />
      )}
    </div>
  )
}
