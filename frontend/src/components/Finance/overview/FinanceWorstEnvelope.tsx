import { useMemo } from 'react'
import {
  buildCategoryBudgetRows,
  budgetRemainingDisplay,
  filterActiveBudgetRows,
  worstBudgetEnvelope,
} from '../../../lib/financeCategoryBudget'
import {
  AXEL_PROGRESS_THICK,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
} from '../../../constants/axelSurfaces'
import type { BudgetLimit, Category, Transaction } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceWorstEnvelopeProps
{
  categories: Category[]
  budgetLimits: BudgetLimit[]
  monthTransactions: Transaction[]
  onConfigure?: () => void
}

/** Pior teto do mês - valor restante em destaque */
export function FinanceWorstEnvelope({
  categories,
  budgetLimits,
  monthTransactions,
  onConfigure,
}: FinanceWorstEnvelopeProps)
{
  const worst = useMemo(
    () =>
    {
      const rows = filterActiveBudgetRows(
        buildCategoryBudgetRows(categories, budgetLimits, monthTransactions),
      )
      return worstBudgetEnvelope(rows)
    },
    [categories, budgetLimits, monthTransactions],
  )

  if (!worst)
  {
    return null
  }

  const display = budgetRemainingDisplay(worst, fmt)
  const tone = worst.alert === 'over'
    ? 'bg-urgente'
    : worst.alert === 'caution'
      ? 'bg-atencao'
      : 'bg-finance'

  return (
    <section aria-label="Envelope do mês">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-muted">Envelope · {worst.nome}</p>
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className={`text-[12px] ${AXEL_TEXT_SECONDARY} hover:text-ink min-h-11`}
          >
            Ajustar
          </button>
        )}
      </div>
      <p className={`mt-1 text-[20px] font-display tabular-nums ${display.tone} ${MODULE_HERO.finance}`}>
        {display.primary}
      </p>
      <p className={`mt-0.5 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
        {display.secondary} · {Math.round(worst.pct)}% usado
      </p>
      <div className={`${AXEL_PROGRESS_THICK} mt-2`}>
        <div
          className={`h-full rounded-sl ${tone}`}
          style={{ width: `${Math.min(100, Math.round(worst.pct))}%` }}
        />
      </div>
    </section>
  )
}
