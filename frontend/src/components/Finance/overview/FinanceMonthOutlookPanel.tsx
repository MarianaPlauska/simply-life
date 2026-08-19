import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronRight, Equal, Pencil, Sparkles, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import {
  buildMonthOutlook,
  canShiftFinanceMonth,
  FINANCE_MAX_FUTURE_OFFSET,
} from '../../../lib/financeMonthOutlook'
import type { ForecastComparison } from '../../../lib/financeMonthOutlook'
import { filterTransactionsByMonth } from '../../../lib/financeLedger'
import { countLedgerDuplicates } from '../../../lib/financeTransactionDedup'
import {
  hydrateMonthSpendGoals,
  loadMonthSpendGoal,
  monthKeyFromOffset,
  saveMonthSpendGoal,
  clearMonthSpendGoal,
} from '../../../lib/financeMonthSpendGoal'
import { FinanceReconcileButton } from '../FinanceReconcileButton'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import { FinanceTxLabel } from './FinanceTxLabel'
import { MoneyInput } from '../../ui/MoneyInput'
import { formatCentsToBrl, parseMoneyInputToNumber } from '../../../lib/currencyInput'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const TONE_CLASS = {
  ok: 'border-concluido/35 bg-concluido/10 text-concluido',
  caution: 'border-atencao/35 bg-atencao/10 text-atencao',
  urgent: 'border-urgente/35 bg-urgente/10 text-urgente',
} as const

const SOBRA_CLASS = {
  ok: 'text-concluido',
  caution: 'text-atencao',
  urgent: 'text-urgente',
} as const

interface FinanceMonthOutlookPanelProps
{
  monthOffset?: number
  compact?: boolean
  onOpenMonth?: () => void
  showComparison?: boolean
}

export function FinanceMonthOutlookPanel({
  monthOffset = 1,
  compact = false,
  onOpenMonth,
  showComparison = true,
}: FinanceMonthOutlookPanelProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const categories = useTaskStore((s) => s.categories)
  const cards = useTaskStore((s) => s.cards)

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

  const canOpenFuture = canShiftFinanceMonth(monthOffset, 1)

  const monthDupCount = useMemo(() =>
  {
    const ref = new Date()
    const d = new Date(ref.getFullYear(), ref.getMonth() + monthOffset, 1)
    const monthTx = filterTransactionsByMonth(transactions, d.getFullYear(), d.getMonth())
    return countLedgerDuplicates(monthTx)
  }, [transactions, monthOffset])

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} space-y-6`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <CalendarClock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <h2 className={AXEL_SECTION_TITLE}>{outlook.headline}</h2>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {outlook.isFuture
                ? outlook.monthOffset > 1
                  ? `Projeção encadeada · até +${FINANCE_MAX_FUTURE_OFFSET} meses`
                  : 'Planeje gastos do mês seguinte com base no que já sabe hoje'
                : outlook.detail}
            </p>
          </div>
        </div>
        {onOpenMonth && outlook.isFuture && canOpenFuture && (
          <button
            type="button"
            onClick={onOpenMonth}
            className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] uppercase text-accent hover:underline min-h-[44px] px-2"
          >
            Ver {outlook.monthLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <Kpi
          label={outlook.isFuture ? 'Saldo de partida' : 'Saldo do mês'}
          value={fmt(outlook.isFuture ? outlook.saldoPartida : outlook.sobraParaGastar)}
          icon={Wallet}
          hint={outlook.isFuture ? 'Projetado ao entrar no mês' : 'Receitas − despesas lançadas'}
        />
        <Kpi
          label={outlook.isFuture ? 'Entradas previstas' : 'Receitas'}
          value={fmt(outlook.receitasPrevistas)}
          icon={TrendingUp}
          tone="text-concluido"
        />
        <Kpi
          label={outlook.isFuture ? 'Compromissos' : 'Despesas'}
          value={fmt(outlook.compromissos)}
          icon={TrendingDown}
          tone="text-urgente"
        />
        <Kpi
          label={outlook.isFuture ? 'Sobra p/ gastar' : 'Previsto (fixas)'}
          value={fmt(
            outlook.isFuture
              ? outlook.sobraParaGastar
              : (outlook.comparison?.sobraPrevista ?? 0),
          )}
          icon={Sparkles}
          tone={outlook.isFuture ? SOBRA_CLASS[outlook.tone] : AXEL_TEXT_PRIMARY}
          highlight={outlook.isFuture}
        />
      </div>

      {outlook.isFuture && outlook.sugestaoGastoDiario != null && outlook.sobraParaGastar > 0 && (
        <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
          ~{fmt(outlook.sugestaoGastoDiario)}/dia em {outlook.diasNoMes} dias — referência para PIX e gastos do dia a dia
        </p>
      )}

      <div className={`flex items-start gap-2 rounded-sl border px-3 py-2.5 ${TONE_CLASS[outlook.tone]}`}>
        <Sparkles size={14} className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed break-words">{outlook.detail}</p>
      </div>

      {!outlook.isFuture && showComparison && outlook.comparison && !compact && (
        <>
          <ComparisonBlock
            comparison={outlook.comparison}
            monthOffset={monthOffset}
            dupCount={monthDupCount}
          />
          {(outlook.receitasItens.length > 0 || outlook.compromissosItens.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outlook.receitasItens.length > 0 && (
                <ItemList title="Receitas lançadas" items={outlook.receitasItens} empty="" positive withNotes />
              )}
              {outlook.compromissosItens.length > 0 && (
                <ItemList
                  title="Despesas lançadas"
                  items={outlook.compromissosItens}
                  empty=""
                  withNotes
                  headerAction={monthDupCount > 0 ? <FinanceReconcileButton label="Limpar dup." /> : undefined}
                  dupHint={monthDupCount > 0 ? `${monthDupCount} duplicata(s) no mês — lista já deduplicada` : undefined}
                />
              )}
            </div>
          )}
        </>
      )}

      {!compact && outlook.isFuture && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ItemList title="Entradas" items={outlook.receitasItens} empty="Nenhuma receita recorrente" positive />
          <ItemList title="Compromissos" items={outlook.compromissosItens} empty="Nenhuma conta fixa ou fatura no mês" />
        </div>
      )}
    </section>
  )
}

function ComparisonBlock({
  comparison,
  monthOffset,
  dupCount,
}: {
  comparison: ForecastComparison
  monthOffset: number
  dupCount: number
})
{
  const monthKey = monthKeyFromOffset(monthOffset)
  const [spendGoal, setSpendGoal] = useState(() => loadMonthSpendGoal(monthKey))
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')

  useEffect(() =>
  {
    void hydrateMonthSpendGoals()
    setSpendGoal(loadMonthSpendGoal(monthKey))
  }, [monthKey])

  const startGoalEdit = () =>
  {
    setGoalDraft(spendGoal ? formatCentsToBrl(Math.round(spendGoal.valorAlvo * 100)) : '')
    setEditingGoal(true)
  }

  const saveGoal = () =>
  {
    const val = parseMoneyInputToNumber(goalDraft)
    if (Number.isNaN(val) || val <= 0)
    {
      clearMonthSpendGoal(monthKey)
      setSpendGoal(null)
    }
    else
    {
      setSpendGoal(saveMonthSpendGoal(monthKey, val))
    }
    setEditingGoal(false)
  }

  const metaGasto = spendGoal?.valorAlvo ?? null
  const deltaMeta = metaGasto != null ? comparison.compromissosReais - metaGasto : null

  return (
    <div className="border border-line rounded-sl overflow-hidden bg-card/50">
      <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-line bg-chrome/40 ${AXEL_TEXT_SECONDARY}`}>
        <p className="font-mono text-[9px] uppercase">Previsto vs real</p>
        {dupCount > 0 && (
          <span className="font-mono text-[8px] text-urgente uppercase">
            {dupCount} dup. no histórico
          </span>
        )}
      </div>

      <div className="px-3 py-2.5 border-b border-line bg-chrome/20 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Target size={12} className="text-accent shrink-0" />
            <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
              Meta de gastos do mês
            </p>
          </div>
          {!editingGoal && (
            <button
              type="button"
              onClick={startGoalEdit}
              className="inline-flex items-center gap-0.5 font-mono text-[8px] uppercase text-accent hover:underline shrink-0"
            >
              <Pencil size={10} />
              {metaGasto != null ? 'Editar' : 'Definir'}
            </button>
          )}
        </div>

        {editingGoal ? (
          <div className="flex gap-2">
            <MoneyInput
              value={goalDraft}
              onChange={setGoalDraft}
              placeholder="Ex.: 2500"
              className="flex-1 text-[12px] min-h-[36px]"
            />
            <button
              type="button"
              onClick={saveGoal}
              className="px-2.5 py-1.5 rounded-sl bg-accent text-white font-mono text-[9px] uppercase min-h-[36px]"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditingGoal(false)}
              className="px-2.5 py-1.5 rounded-sl border border-line font-mono text-[9px] uppercase min-h-[36px]"
            >
              Cancelar
            </button>
          </div>
        ) : metaGasto != null ? (
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-[11px] tabular-nums">
              <span className={AXEL_TEXT_SECONDARY}>
                Teto <span className={`${AXEL_TEXT_PRIMARY} font-medium`}>{fmt(metaGasto)}</span>
              </span>
              <span className={AXEL_TEXT_SECONDARY}>
                Gasto <span className={`font-medium ${comparison.compromissosReais > metaGasto ? 'text-urgente' : 'text-concluido'}`}>
                  {fmt(comparison.compromissosReais)}
                </span>
              </span>
            </div>
            {deltaMeta != null && (
              <div className={`flex items-center justify-center rounded-sl border px-3 py-2 ${
                deltaMeta > 0
                  ? 'border-urgente/35 bg-urgente/10'
                  : 'border-concluido/40 bg-concluido/12'
              }`}
              >
                <span className={`font-display text-base sm:text-lg tabular-nums font-semibold ${
                  deltaMeta > 0 ? 'text-urgente' : 'text-concluido'
                }`}
                >
                  {deltaMeta > 0
                    ? `Estourou ${fmt(deltaMeta)}`
                    : `Sobrou ${fmt(Math.abs(deltaMeta))}`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>
            Defina quanto pretende gastar no mês — comparamos com o real ao final.
          </p>
        )}
      </div>

      <div className="divide-y divide-line">
        <CompareRow
          label="Receitas"
          previsto={comparison.receitasPrevistas}
          real={comparison.receitasReais}
          delta={comparison.deltaReceitas}
          positiveIsGood
        />
        <CompareRow
          label="Despesas"
          previsto={comparison.compromissosPrevistos}
          real={comparison.compromissosReais}
          delta={comparison.deltaCompromissos}
          positiveIsGood={false}
        />
        <CompareRow
          label="Saldo"
          previsto={comparison.sobraPrevista}
          real={comparison.saldoReal}
          delta={comparison.deltaSaldo}
          positiveIsGood
          highlight
        />
      </div>
    </div>
  )
}

function CompareRow({
  label,
  previsto,
  real,
  delta,
  positiveIsGood,
  highlight,
}: {
  label: string
  previsto: number
  real: number
  delta: number
  positiveIsGood: boolean
  highlight?: boolean
})
{
  const isGood = positiveIsGood ? delta >= 0 : delta <= 0
  const DeltaIcon = delta === 0 ? Equal : delta > 0 ? ArrowUpRight : ArrowDownRight
  const deltaClass = delta === 0
    ? AXEL_TEXT_SECONDARY
    : isGood
      ? 'text-concluido'
      : 'text-urgente'

  return (
    <div className={`px-3 py-2.5 text-[11px] border-b border-line/60 last:border-b-0 ${highlight ? 'bg-chrome/20' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1">
        <span className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>{label}</span>
        <span className={`inline-flex items-center gap-0.5 font-mono tabular-nums text-[11px] font-medium ${deltaClass}`}>
          <DeltaIcon size={12} />
          {delta >= 0 ? '+' : ''}{fmt(delta)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 tabular-nums text-[11px]">
        <span className={AXEL_TEXT_SECONDARY}>
          Previsto <span className={`font-medium ${AXEL_TEXT_PRIMARY}`}>{fmt(previsto)}</span>
        </span>
        <span className={AXEL_TEXT_SECONDARY}>
          Real <span className={`font-medium ${AXEL_TEXT_PRIMARY}`}>{fmt(real)}</span>
        </span>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  highlight,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string; size?: number }>
  tone?: string
  hint?: string
  highlight?: boolean
})
{
  return (
    <div className="border border-line rounded-sl bg-chrome/30 px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1 mb-1">
        <Icon size={11} className="text-accent shrink-0" />
        <p className={`font-mono text-[9px] uppercase truncate ${AXEL_TEXT_SECONDARY}`}>{label}</p>
      </div>
      <p className={`${highlight ? 'text-lg' : 'text-base'} font-display tabular-nums break-all sm:break-normal ${
        tone ?? AXEL_TEXT_PRIMARY
      }`}
      >
        {value}
      </p>
      {hint && (
        <p className={`font-mono text-[8px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{hint}</p>
      )}
    </div>
  )
}

function ItemList({
  title,
  items,
  empty,
  positive,
  withNotes,
  headerAction,
  dupHint,
}: {
  title: string
  items: { id?: number; label: string; valor: number; hint?: string }[]
  empty: string
  positive?: boolean
  withNotes?: boolean
  headerAction?: ReactNode
  dupHint?: string
})
{
  const PAGE_SIZE = 5
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageSafe = Math.min(page, pageCount - 1)
  const slice = items.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE)

  useEffect(() =>
  {
    setPage(0)
  }, [items.length, title])

  return (
    <div className="border border-line rounded-sl overflow-hidden flex flex-col max-h-[min(320px,45vh)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line bg-chrome/40">
        <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
          {title}
        </p>
        {headerAction}
      </div>
      {dupHint && (
        <p className="px-3 py-1.5 text-[9px] text-urgente border-b border-line/60 bg-urgente/5">
          {dupHint}
        </p>
      )}
      <ul className="divide-y divide-line flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {items.length === 0 && empty && (
          <li className={`px-3 py-4 text-[11px] text-center ${AXEL_TEXT_SECONDARY}`}>{empty}</li>
        )}
        {slice.map((item) => (
          <li
            key={item.id ?? `${item.label}-${item.valor}-${item.hint ?? ''}`}
            className={`flex items-center justify-between gap-2 px-3 py-2 text-[11px] ${AXEL_ROW_HOVER}`}
          >
            <div className="min-w-0 flex-1">
              {withNotes && item.hint ? (
                <FinanceTxLabel label={item.label} observacao={item.hint} className="text-[11px]" />
              ) : (
                <p className={`truncate ${AXEL_TEXT_PRIMARY}`}>{item.label}</p>
              )}
              {item.hint && !withNotes && (
                <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>{item.hint}</p>
              )}
            </div>
            <span className={`font-mono tabular-nums shrink-0 ${
              positive ? 'text-concluido' : 'text-urgente'
            }`}
            >
              {positive ? '+' : '−'}{fmt(item.valor)}
            </span>
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-line bg-chrome/30 shrink-0">
          <button
            type="button"
            disabled={pageSafe <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="font-mono text-[8px] uppercase text-ink-muted disabled:opacity-40 min-h-[36px] px-2"
          >
            Anterior
          </button>
          <span className={`font-mono text-[8px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {pageSafe + 1}/{pageCount}
          </span>
          <button
            type="button"
            disabled={pageSafe >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="font-mono text-[8px] uppercase text-ink-muted disabled:opacity-40 min-h-[36px] px-2"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
