import { useEffect, useMemo } from 'react'
import { CalendarOff, Landmark, PiggyBank, Receipt, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useCashPosition } from '../../hooks/useCashPosition'
import { resolveCashTone, outlookToneToBalance } from '../../lib/financeBalanceTone'
import { countLedgerDuplicates } from '../../lib/financeTransactionDedup'
import { buildMonthOutlook, monthHasLedgerData } from '../../lib/financeMonthOutlook'
import { maskFinanceValue } from '../../lib/financeHideValues'
import { FinanceMonthKpisRow } from './overview/FinanceMonthKpisRow'
import { FinanceGlobalMoodBanner } from './FinanceGlobalMoodBanner'
import {
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  AXEL_PAGE_SHELL_READING,
  AXEL_DESKTOP_WORKSPACE,
} from '../../constants/axelSurfaces'
import { FinanceHomeRail } from './FinanceHomeRail'
import type { FinanceAlertTab } from '../../lib/financeAlerts'
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts'
import { FinanceAlertsPanel } from './goals/FinanceAlertsPanel'
import { FinanceMonthGoalWidget } from './overview/FinanceMonthGoalWidget'
import { FinanceWorstEnvelope } from './overview/FinanceWorstEnvelope'
import { FinanceBudgetProgressStrip } from './overview/FinanceBudgetProgressStrip'
import { FinanceSpendHeatmap } from './FinanceSpendHeatmap'
import { FinanceRecentTransactions } from './FinanceRecentTransactions'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
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
  const setFinanceCaptureOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const setNewTransactionOpen = useTaskStore((s) => s.setNewTransactionModalOpen)
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
    <div className={`${AXEL_PAGE_SHELL_READING} ${AXEL_DESKTOP_WORKSPACE} pt-2 sm:pt-3`}>
      <div className="space-y-3 min-w-0">
      {pastMonthEmpty ? (
        <div className="border-t-[0.5px] border-line py-4 text-center space-y-1.5">
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
            stabilityTone={isFutureMonth ? outlookToneToBalance(outlook.tone) : cashTone}
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

          {!isFutureMonth && (
            <div className="xl:hidden space-y-3">
              <FinanceWorstEnvelope
                categories={categories}
                budgetLimits={budgetLimits}
                monthTransactions={monthTransactions}
                onConfigure={() => onNavigate('visao-geral')}
              />
              <FinanceBudgetProgressStrip
                categories={categories}
                budgetLimits={budgetLimits}
                monthTransactions={monthTransactions}
                onConfigure={() => onNavigate('visao-geral')}
              />
            </div>
          )}

          {!isFutureMonth && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <HomeMoneyAction
                icon={Receipt}
                label="Gasto"
                onClick={() => setFinanceCaptureOpen(true)}
              />
              <HomeMoneyAction
                icon={PiggyBank}
                label="Ganho"
                onClick={() => setNewTransactionOpen(true, 'receita')}
              />
              <HomeMoneyAction
                icon={Wallet}
                label="Saldo"
                onClick={() => onNavigate('conta')}
              />
              <HomeMoneyAction
                icon={Landmark}
                label="A pagar"
                onClick={() => onNavigate('faturas')}
              />
            </div>
          )}

          {!isFutureMonth && !pastMonthEmpty && (
            <FinanceRecentTransactions
              transactions={monthTransactions}
              categories={categories}
              hideValues={hideValues}
              onOpenLedger={() => onNavigate('diario')}
            />
          )}

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
            <div className="xl:hidden">
              <FinanceSpendHeatmap transactions={monthTransactions} compact />
            </div>
          )}

          {!isFutureMonth && (
            <DashboardCollapsible
              title="Mais"
              subtitle="Meta do mês e avisos"
              borderless
              defaultOpen={false}
            >
              <FinanceMonthGoalWidget monthTransactions={monthTransactions} monthOffset={monthOffset} />
              {criticalAlerts.length > 0 && (
                <FinanceAlertsPanel alerts={criticalAlerts} compact onNavigate={onNavigate} />
              )}
            </DashboardCollapsible>
          )}
        </>
      )}
      </div>
      <FinanceHomeRail
        transactions={monthTransactions}
        categories={categories}
        budgetLimits={budgetLimits}
        onNavigate={onNavigate}
      />
    </div>
  )
}

function HomeMoneyAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Receipt
  label: string
  onClick: () => void
})
{
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 min-h-11 px-2 rounded-sl border border-line text-[13px] text-ink hover:bg-chrome"
    >
      <Icon className="w-3.5 h-3.5 shrink-0 text-finance" strokeWidth={1.75} />
      {label}
    </button>
  )
}
