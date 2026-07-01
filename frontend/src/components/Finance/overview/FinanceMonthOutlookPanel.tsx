import { useMemo, type ComponentType } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronRight, Equal, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import {
  buildMonthOutlook,
  canShiftFinanceMonth,
  FINANCE_MAX_FUTURE_OFFSET,
} from '../../../lib/financeMonthOutlook'
import type { ForecastComparison } from '../../../lib/financeMonthOutlook'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import { FinanceTxLabel } from './FinanceTxLabel'

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

  const outlook = useMemo(
    () => buildMonthOutlook({
      transactions,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      recurringIncomes,
      contasFixas,
      budgetLimits,
      categories,
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
      monthOffset,
    ],
  )

  const canOpenFuture = canShiftFinanceMonth(monthOffset, 1)

  return (
    <section className={AXEL_BORDERLESS_PANEL}>
      <header className="flex flex-wrap items-start justify-between gap-2 mb-3">
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

      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
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
        <p className={`font-mono text-[10px] mt-3 ${AXEL_TEXT_SECONDARY}`}>
          ~{fmt(outlook.sugestaoGastoDiario)}/dia em {outlook.diasNoMes} dias — referência para PIX e gastos do dia a dia
        </p>
      )}

      <div className={`mt-3 flex items-start gap-2 rounded-sl border px-3 py-2.5 ${TONE_CLASS[outlook.tone]}`}>
        <Sparkles size={14} className="shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed break-words">{outlook.detail}</p>
      </div>

      {!outlook.isFuture && showComparison && outlook.comparison && !compact && (
        <>
          <ComparisonBlock comparison={outlook.comparison} />
          {(outlook.receitasItens.length > 0 || outlook.compromissosItens.length > 0) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outlook.receitasItens.length > 0 && (
                <ItemList title="Receitas lançadas" items={outlook.receitasItens} empty="" positive withNotes />
              )}
              {outlook.compromissosItens.length > 0 && (
                <ItemList title="Despesas lançadas" items={outlook.compromissosItens} empty="" withNotes />
              )}
            </div>
          )}
        </>
      )}

      {!compact && outlook.isFuture && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ItemList title="Entradas" items={outlook.receitasItens} empty="Nenhuma receita recorrente" positive />
          <ItemList title="Compromissos" items={outlook.compromissosItens} empty="Nenhuma conta fixa ou fatura no mês" />
        </div>
      )}
    </section>
  )
}

function ComparisonBlock({ comparison }: { comparison: ForecastComparison })
{
  return (
    <div className="mt-4 border border-line rounded-sl overflow-hidden">
      <p className={`font-mono text-[9px] uppercase px-3 py-2 border-b border-line bg-chrome/40 ${AXEL_TEXT_SECONDARY}`}>
        Previsto vs real
      </p>
      <ul className="divide-y divide-line">
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
      </ul>
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
    <li className={`px-3 py-2.5 text-[11px] ${highlight ? 'bg-chrome/20' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>{label}</span>
        <span className={`inline-flex items-center gap-0.5 font-mono tabular-nums text-[10px] ${deltaClass}`}>
          <DeltaIcon size={12} />
          {delta >= 0 ? '+' : ''}{fmt(delta)}
        </span>
      </div>
      <div className="flex justify-between gap-3 tabular-nums">
        <span className={AXEL_TEXT_SECONDARY}>
          Prev. <span className={AXEL_TEXT_PRIMARY}>{fmt(previsto)}</span>
        </span>
        <span className={AXEL_TEXT_SECONDARY}>
          Real <span className={AXEL_TEXT_PRIMARY}>{fmt(real)}</span>
        </span>
      </div>
    </li>
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
}: {
  title: string
  items: { label: string; valor: number; hint?: string }[]
  empty: string
  positive?: boolean
  withNotes?: boolean
})
{
  return (
    <div className="border border-line rounded-sl overflow-hidden">
      <p className={`font-mono text-[9px] uppercase px-3 py-2 border-b border-line bg-chrome/40 ${AXEL_TEXT_SECONDARY}`}>
        {title}
      </p>
      <ul className="divide-y divide-line max-h-[180px] overflow-y-auto">
        {items.length === 0 && empty && (
          <li className={`px-3 py-4 text-[11px] text-center ${AXEL_TEXT_SECONDARY}`}>{empty}</li>
        )}
        {items.map((item) => (
          <li
            key={`${item.label}-${item.valor}-${item.hint ?? ''}`}
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
    </div>
  )
}
