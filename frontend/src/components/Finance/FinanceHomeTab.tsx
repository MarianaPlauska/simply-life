import { useEffect, useMemo } from 'react'
import { CalendarOff } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useCashPosition } from '../../hooks/useCashPosition'
import { resolveCashTone, BALANCE_TONE_TEXT } from '../../lib/financeBalanceTone'
import { countLedgerDuplicates } from '../../lib/financeTransactionDedup'
import { buildMonthOutlook, monthHasLedgerData } from '../../lib/financeMonthOutlook'
import { maskFinanceValue } from '../../lib/financeHideValues'
import { FinanceMonthKpisRow } from './overview/FinanceMonthKpisRow'
import { FinanceGlobalMoodBanner } from './FinanceGlobalMoodBanner'
import {
  AXEL_TEXT_PRIMARY,
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
  hideValues?: boolean
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
  hideValues = false,
  onNavigate,
}: FinanceHomeTabProps)
{
  const isFutureMonth = monthOffset > 0
  const isPastMonth = monthOffset < 0
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const cards = useTaskStore((s) => s.cards)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const categories = useTaskStore((s) => s.categories)
  const alerts = useFinanceAlerts(monthTransactions)
  const fetchBillSettlements = useTaskStore((s) => s.fetchBillSettlements)
  const reconcileFinanceLedger = useTaskStore((s) => s.reconcileFinanceLedger)
  const { display: position } = useCashPosition()
  const ledgerDupCount = useMemo(
    () => countLedgerDuplicates(transactions),
    [transactions],
  )

  const pastMonthEmpty = isPastMonth && !monthHasLedgerData(transactions, monthOffset)

  const outlook = useMemo(
    () => buildMonthOutlook({
      transactions,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      recurringIncomes,
      contasFixas,
      budgetLimits,
      categories,
      cards,
      monthOffset,
    }),
    [
      transactions,
      cashAccount.saldo_inicial,
      reservedBills,
      recurringIncomes,
      contasFixas,
      budgetLimits,
      categories,
      cards,
      monthOffset,
    ],
  )

  useEffect(() =>
  {
    void fetchBillSettlements()
  }, [fetchBillSettlements])

  const cashTone = resolveCashTone(position.saldoDisponivel, position.saldoProjetadoDisponivel)
  const criticalAlerts = alerts.filter((a) => a.severity === 'urgent' || a.severity === 'caution')

  const kpiSaldo = isFutureMonth ? outlook.saldoPartida : position.saldoDisponivel
  const kpiReceita = isFutureMonth
    ? outlook.receitasPrevistas
    : isPastMonth
      ? receita
      : position.saldoInicial + position.receitasPagas
  const kpiDespesas = isFutureMonth
    ? outlook.compromissos
    : isPastMonth
      ? despesas
      : position.despesasPagas
  const kpiSaldoMes = isFutureMonth ? outlook.sobraParaGastar : saldo

  return (
    <div className="space-y-3 pt-2 sm:pt-3">
      {pastMonthEmpty ? (
        <div className="rounded-sl border border-dashed border-line bg-card px-4 py-8 text-center space-y-2">
          <CalendarOff className="w-8 h-8 mx-auto text-ink-muted opacity-60" aria-hidden />
          <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>
            Sem lançamentos em {monthLabel}
          </p>
          <p className={`text-[12px] leading-relaxed max-w-sm mx-auto ${AXEL_TEXT_SECONDARY}`}>
            Não há movimentos neste mês. Escolha outro período ou lance a partir do mês atual.
          </p>
        </div>
      ) : (
        <>
          <FinanceMonthKpisRow
            saldoDisponivel={kpiSaldo}
            receita={kpiReceita}
            despesas={kpiDespesas}
            saldoMes={kpiSaldoMes}
            balanceToneClass={isFutureMonth
              ? (outlook.tone === 'urgent' ? 'text-urgente' : outlook.tone === 'caution' ? 'text-atencao' : 'text-finance')
              : BALANCE_TONE_TEXT[cashTone]}
            compact
            hideValues={hideValues}
            projectionLabels={isFutureMonth}
            onConfigureSaldo={isFutureMonth ? undefined : () => onNavigate('conta')}
            onReconcile={
              !isFutureMonth && ledgerDupCount > 0
                ? () => void reconcileFinanceLedger()
                : undefined
            }
          />

          {monthOffset === 0 && (
            <FinanceGlobalMoodBanner
              monthLabel={monthLabel}
              monthOffset={monthOffset}
              monthTransactions={monthTransactions}
              allTransactions={transactions}
              saldoInicial={cashAccount.saldo_inicial}
            />
          )}

          <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            {isFutureMonth
              ? `Projeção encadeada · reservado ${maskFinanceValue(hideValues, fmt(position.reservaRestante))}`
              : `${monthLabel} · reservado ${maskFinanceValue(hideValues, fmt(position.reservaRestante))} · projetado ${maskFinanceValue(hideValues, fmt(position.saldoProjetadoDisponivel))}`}
          </p>

          {!isFutureMonth && (
            <FinanceMonthGoalWidget monthTransactions={monthTransactions} monthOffset={monthOffset} />
          )}

          {criticalAlerts.length > 0 && !isFutureMonth && (
            <FinanceAlertsPanel alerts={criticalAlerts} compact onNavigate={onNavigate} />
          )}
        </>
      )}
    </div>
  )
}
