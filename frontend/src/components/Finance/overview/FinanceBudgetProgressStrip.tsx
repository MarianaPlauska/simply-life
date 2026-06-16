import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  buildCategoryBudgetRows,
  filterActiveBudgetRows,
  budgetAlertLabel,
} from '../../../lib/financeCategoryBudget'
import { AXEL_PROGRESS_THICK, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import type { BudgetLimit, Category, Transaction } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceBudgetProgressStripProps
{
  categories: Category[]
  budgetLimits: BudgetLimit[]
  monthTransactions: Transaction[]
  onConfigure?: () => void
}

// Barras de orçamento por categoria — padrão Mobills/YNAB (top categorias do mês)

export function FinanceBudgetProgressStrip({
  categories,
  budgetLimits,
  monthTransactions,
  onConfigure,
}: FinanceBudgetProgressStripProps)
{
  const rows = useMemo(() =>
  {
    const all = buildCategoryBudgetRows(categories, budgetLimits, monthTransactions)
    return filterActiveBudgetRows(all).slice(0, 4)
  }, [categories, budgetLimits, monthTransactions])

  if (rows.length === 0) return null

  return (
    <section className="rounded-sl border border-line bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Orçamento por categoria
        </p>
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="font-mono text-[8px] uppercase text-accent hover:underline"
          >
            Ajustar limites
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {rows.map((row) =>
        {
          const tone = row.alert === 'over'
            ? 'bg-urgente'
            : row.alert === 'caution'
              ? 'bg-atencao'
              : 'bg-accent'
          return (
            <li key={row.id}>
              <div className="flex justify-between items-baseline gap-2 mb-0.5">
                <span className={`text-[11px] truncate ${AXEL_TEXT_PRIMARY}`}>{row.nome}</span>
                <span className={`font-mono text-[9px] tabular-nums shrink-0 ${
                  row.alert === 'over' ? 'text-urgente' : AXEL_TEXT_SECONDARY
                }`}>
                  {fmt(row.gasto)} / {fmt(row.limite)}
                </span>
              </div>
              <div className={AXEL_PROGRESS_THICK}>
                <div
                  className={`h-full rounded-sl transition-all ${tone}`}
                  style={{ width: `${Math.min(100, row.pct)}%` }}
                />
              </div>
              {row.alert !== 'ok' && (
                <p className={`font-mono text-[8px] mt-0.5 flex items-center gap-1 ${
                  row.alert === 'over' ? 'text-urgente' : 'text-atencao'
                }`}>
                  <AlertTriangle size={9} />
                  {budgetAlertLabel(row.alert)}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
