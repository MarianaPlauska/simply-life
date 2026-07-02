import { useEffect, useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { useCashPosition } from '../../hooks/useCashPosition'
import { resolveCashTone, BALANCE_TONE_TEXT } from '../../lib/financeBalanceTone'
import { countLedgerDuplicates } from '../../lib/financeTransactionDedup'
import { FinanceMonthKpisRow } from './overview/FinanceMonthKpisRow'
import { FinanceGlobalMoodBanner } from './FinanceGlobalMoodBanner'
import {
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { FinanceAlertTab } from '../../lib/financeAlerts'
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts'
import { FinanceAlertsPanel } from './goals/FinanceAlertsPanel'
import { FinanceMonthGoalWidget } from './overview/FinanceMonthGoalWidget'
import type { Transaction } from '../../store/storeTypes'
import type { PlannerLeafTab } from '../../lib/financePlannerNav'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceHomeTabProps
{
  monthLabel: string
  monthOffset?: number
  receita: number
  despesas: number
  saldo: number
  transactions: Transaction[]
  monthTransactions: Transaction[]
  onNavigate: (tab: PlannerLeafTab | FinanceAlertTab) => void
}

export function FinanceHomeTab({
  monthLabel,
  monthOffset = 0,
  receita,
  despesas,
  saldo,
  transactions,
  monthTransactions,
  onNavigate,
}: FinanceHomeTabProps)
{
  const isFutureMonth = monthOffset > 0
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const alerts = useFinanceAlerts(monthTransactions)
  const fetchBillSettlements = useTaskStore((s) => s.fetchBillSettlements)
  const reconcileFinanceLedger = useTaskStore((s) => s.reconcileFinanceLedger)
  const { display: position } = useCashPosition()
  const ledgerDupCount = useMemo(
    () => countLedgerDuplicates(transactions),
    [transactions],
  )

  useEffect(() =>
  {
    void fetchBillSettlements()
  }, [fetchBillSettlements])

  const cashTone = resolveCashTone(position.saldoDisponivel, position.saldoProjetadoDisponivel)
  const criticalAlerts = alerts.filter((a) => a.severity === 'urgent' || a.severity === 'caution')

  return (
    <div className="space-y-3">
      <FinanceGlobalMoodBanner
        monthLabel={monthLabel}
        monthOffset={monthOffset}
        monthTransactions={monthTransactions}
        allTransactions={transactions}
        saldoInicial={cashAccount.saldo_inicial}
      />

      <FinanceMonthKpisRow
        saldoDisponivel={position.saldoDisponivel}
        receita={receita}
        despesas={despesas}
        saldoMes={saldo}
        balanceToneClass={BALANCE_TONE_TEXT[cashTone]}
        compact
        onConfigureSaldo={() => onNavigate('conta')}
        onReconcile={
          ledgerDupCount > 0
            ? () => void reconcileFinanceLedger()
            : undefined
        }
      />

      <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
        {isFutureMonth ? `Previsão · ${monthLabel}` : monthLabel}
        {' · '}reservado {fmt(position.reservaRestante)}
        {' · '}projetado {fmt(position.saldoProjetadoDisponivel)}
      </p>

      {!isFutureMonth && (
        <FinanceMonthGoalWidget monthTransactions={monthTransactions} monthOffset={monthOffset} />
      )}

      {criticalAlerts.length > 0 && (
        <FinanceAlertsPanel alerts={criticalAlerts} compact onNavigate={onNavigate} />
      )}
    </div>
  )
}
