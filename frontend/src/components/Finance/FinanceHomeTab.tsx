import { useMemo } from 'react'
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Settings2,
  Table2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { FinanceCoachCard } from './overview/FinanceCoachCard'
import { FinanceDailyBriefCard } from './overview/FinanceDailyBriefCard'
import { FinanceMonthCloseRitualCard } from './overview/FinanceMonthCloseRitualCard'
import { computeCashPosition } from '../../lib/financeReservedBills'
import { FinanceQuickPresets } from './FinanceQuickPresets'
import { FinanceBalancePanel } from './FinanceBalancePanel'
import { FinanceSpendingCharts } from './FinanceSpendingCharts'
import { resolveCashTone, BALANCE_TONE_TEXT } from '../../lib/financeBalanceTone'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { formatCategoryPath } from '../../lib/financeCategoryTree'
import type { FinanceAlertTab } from '../../lib/financeAlerts'
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts'
import { FinanceAlertsPanel } from './goals/FinanceAlertsPanel'
import { FinanceMonthOutlookPanel } from './overview/FinanceMonthOutlookPanel'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type FinanceSubTab = 'diario' | 'planilha' | 'cartoes' | 'visao-geral' | 'faturas' | 'config'

interface FinanceHomeTabProps
{
  monthLabel: string
  monthOffset?: number
  receita: number
  despesas: number
  saldo: number
  transactions: Transaction[]
  monthTransactions: Transaction[]
  recentTransactions: Transaction[]
  activeCategories: Category[]
  onNavigate: (tab: FinanceSubTab | FinanceAlertTab) => void
  onManageCategories?: () => void
  onOpenNextMonth?: () => void
  onSetLimits?: () => void
  onConfigure?: () => void
  onNewTransaction?: () => void
}

export function FinanceHomeTab({
  monthLabel,
  monthOffset = 0,
  receita,
  despesas,
  transactions,
  monthTransactions,
  recentTransactions,
  activeCategories,
  onNavigate,
  onManageCategories,
  onOpenNextMonth,
  onSetLimits,
  onConfigure,
  onNewTransaction,
}: FinanceHomeTabProps)
{
  const isFutureMonth = monthOffset > 0
  const cards = useTaskStore((s) => s.cards)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const alerts = useFinanceAlerts(monthTransactions)

  const position = useMemo(
    () => computeCashPosition(transactions, cashAccount.saldo_inicial, reservedBills),
    [transactions, cashAccount.saldo_inicial, reservedBills],
  )

  const cashTone = resolveCashTone(position.saldoDisponivel, position.saldoProjetadoDisponivel)

  const shortcuts = [
    { id: 'config' as const, label: 'Configurar', hint: 'Conta · cartões · fixas', icon: Settings2 },
    { id: 'diario' as const, label: 'Diário', hint: 'Anotar o dia', icon: BookOpen },
    { id: 'cartoes' as const, label: 'Cartões', hint: `${cards.length} cadastrado(s)`, icon: CreditCard },
    { id: 'planilha' as const, label: 'Planilha', hint: 'Excel + gráficos', icon: Table2 },
    { id: 'visao-geral' as const, label: 'Análise', hint: '50-30-20 · gráficos', icon: TrendingUp },
  ]

  const nextMonthOffset = monthOffset + 1

  return (
    <div className="space-y-4">
      {/* Hero — primeira coisa ao entrar */}
      <section className="relative rounded-sl border border-line bg-card">
        <div
          className="absolute inset-0 overflow-hidden rounded-sl bg-gradient-to-br from-accent/8 via-transparent to-chrome/40 pointer-events-none"
          aria-hidden
        />
        <div className="relative p-3 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 w-full">
              <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
                {isFutureMonth ? `Previsão · ${monthLabel}` : `Centro financeiro · ${monthLabel}`}
              </p>
              <p className={`text-2xl sm:text-3xl md:text-4xl font-display tabular-nums mt-2 break-all sm:break-normal ${BALANCE_TONE_TEXT[cashTone]}`}>
                {fmt(position.saldoDisponivel)}
              </p>
              <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
                {isFutureMonth
                  ? `Saldo atual · previsão do mês em ${monthLabel}`
                  : 'Disponível agora · saldo inicial + lançamentos no caixa − reservas'}
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                {onConfigure && (
                  <button
                    type="button"
                    onClick={onConfigure}
                    className="font-mono text-[9px] uppercase text-accent hover:underline min-h-[44px] sm:min-h-0 inline-flex items-center gap-1"
                  >
                    <Settings2 size={11} />
                    Configurar conta e cartões
                  </button>
                )}
                {onManageCategories && (
                  <button
                    type="button"
                    onClick={onManageCategories}
                    className="font-mono text-[9px] uppercase text-accent hover:underline min-h-[44px] sm:min-h-0"
                  >
                    Categorias
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:gap-6 shrink-0">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp size={12} className="text-concluido" />
                  <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Entrou</span>
                </div>
                <p className="font-display text-base sm:text-lg tabular-nums text-concluido break-all sm:break-normal">
                  {fmt(receita)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown size={12} className="text-urgente" />
                  <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Saiu</span>
                </div>
                <p className="font-display text-base sm:text-lg tabular-nums text-urgente break-all sm:break-normal">
                  {fmt(despesas)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 sm:mt-5">
            <div className="border border-line rounded-sl bg-chrome/50 px-3 py-2">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Caixa</p>
              <p className={`text-sm font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                {fmt(position.saldoCorrente)}
              </p>
            </div>
            <div className="border border-line rounded-sl bg-chrome/50 px-3 py-2">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Reservado</p>
              <p className="text-sm font-display tabular-nums text-atencao">
                {fmt(position.reservaRestante)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 border border-line rounded-sl bg-chrome/50 px-3 py-2">
              <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Projetado livre</p>
              <p className={`text-sm font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                {fmt(position.saldoProjetadoDisponivel)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!isFutureMonth && <FinanceDailyBriefCard />}

      {!isFutureMonth && <FinanceMonthCloseRitualCard onSetLimits={onSetLimits} />}

      {/* Axel — logo abaixo do saldo */}
      {!isFutureMonth && onSetLimits && (
        <FinanceCoachCard
          monthTransactions={monthTransactions}
          onSetLimits={onSetLimits}
          onConfigure={onConfigure}
        />
      )}

      <FinanceBalancePanel
        transactions={transactions}
        onConfigure={onConfigure}
        onNewBill={onNewTransaction}
      />

      {alerts.length > 0 && (
        <FinanceAlertsPanel
          alerts={alerts}
          compact
          onNavigate={onNavigate}
        />
      )}

      {!isFutureMonth && (
        <>
          <FinanceMonthOutlookPanel monthOffset={monthOffset} compact showComparison={false} />
          {onOpenNextMonth && (
            <FinanceMonthOutlookPanel
              monthOffset={nextMonthOffset}
              compact
              onOpenMonth={onOpenNextMonth}
              showComparison={false}
            />
          )}
        </>
      )}

      {isFutureMonth && (
        <FinanceMonthOutlookPanel monthOffset={monthOffset} />
      )}

      <FinanceSpendingCharts
        transactions={transactions}
        activeCategories={activeCategories}
      />

      <section className={AXEL_BORDERLESS_PANEL}>
        <FinanceQuickPresets />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {shortcuts.map(({ id, label, hint, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`${AXEL_BORDERLESS_PANEL} text-left flex flex-col gap-2 min-h-[88px] ${AXEL_ROW_HOVER}`}
          >
            <Icon size={18} className="text-accent" strokeWidth={1.75} />
            <div>
              <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>{label}</p>
              <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>{hint}</p>
            </div>
            <ArrowRight size={14} className="text-ink-muted mt-auto" />
          </button>
        ))}
      </section>

      <section className={AXEL_BORDERLESS_PANEL}>
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-accent" />
            <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Últimos lançamentos
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('diario')}
            className="font-mono text-[9px] uppercase text-accent hover:underline"
          >
            Ver diário
          </button>
        </header>
        <ul className="divide-y divide-line">
          {recentTransactions.length === 0 && (
            <li className={`py-6 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Nenhum lançamento ainda — use os atalhos acima
            </li>
          )}
          {recentTransactions.map((t) =>
          {
            const cat = t.categoria_id
              ? formatCategoryPath(activeCategories, t.categoria_id)
              : t.categoria
            return (
              <li
                key={t.id}
                className={`flex items-center justify-between gap-3 py-2.5 ${AXEL_ROW_HOVER}`}
              >
                <div className="min-w-0">
                  <p className={`text-sm truncate ${AXEL_TEXT_PRIMARY}`}>{t.descricao}</p>
                  <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                    {t.data.slice(0, 10).split('-').reverse().join('/')}
                    {cat ? ` · ${cat}` : ''}
                  </p>
                </div>
                <span className={`font-mono text-[12px] tabular-nums shrink-0 ${
                  t.tipo === 'receita'
                    ? 'text-concluido'
                    : t.tipo === 'investimento'
                      ? 'text-accent'
                      : 'text-urgente'
                }`}>
                  {t.tipo === 'receita' ? '+' : '−'}{fmt(t.valor)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
