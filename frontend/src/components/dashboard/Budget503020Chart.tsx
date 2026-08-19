import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { computeRule503020, filterTransactionsForMonth } from '../../utils/rule503020'

// Mini gráfico de barras — meta vs real da regra 50-30-20 (tokens do sistema)

interface BudgetCategory
{
  id: string
  label: string
  meta: number
  real: number
  realVar: '--sl-chart-real-a' | '--sl-chart-real-b' | '--sl-chart-real-c'
}

const BAR_MAX_H = 56
const META = { nec: 50, des: 30, res: 20 }

function buildCategories(
  pctNecessidades: number,
  pctDesejos: number,
  pctPoupanca: number,
): BudgetCategory[]
{
  return [
    {
      id: 'nec',
      label: 'Nec.',
      meta: META.nec,
      real: pctNecessidades,
      realVar: '--sl-chart-real-a',
    },
    {
      id: 'des',
      label: 'Des.',
      meta: META.des,
      real: pctDesejos,
      realVar: '--sl-chart-real-b',
    },
    {
      id: 'res',
      label: 'Res.',
      meta: META.res,
      real: pctPoupanca,
      realVar: '--sl-chart-real-c',
    },
  ]
}

export function Budget503020Chart()
{
  const transactions = useTaskStore((s) => s.transactions)
  const categories = useTaskStore((s) => s.categories)

  const rule = useMemo(() =>
  {
    const monthTx = filterTransactionsForMonth(transactions)
    const receita = monthTx
      .filter((t) => t.tipo === 'receita')
      .reduce((s, t) => s + t.valor, 0)
    const despesas = monthTx
      .filter((t) => t.tipo === 'despesa')
      .reduce((s, t) => s + t.valor, 0)
    const activeCategories = categories.filter((c) => c.tipo === 'despesa')

    return computeRule503020({
      receita,
      despesas,
      monthTx,
      activeCategories,
    })
  }, [transactions, categories])

  const chartCategories = buildCategories(
    rule.pctNecessidades,
    rule.pctDesejos,
    rule.pctPoupanca,
  )

  return (
    <div aria-label="Gráfico da regra 50-30-20: meta versus gasto real">
      <div className="flex items-end justify-between gap-2 sm:gap-4 h-[72px] mb-3">
        {chartCategories.map((cat) =>
        {
          const metaH = Math.max(4, Math.round((cat.meta / 100) * BAR_MAX_H))
          const realH = Math.max(4, Math.round((Math.min(cat.real, 100) / 100) * BAR_MAX_H))

          return (
            <div key={cat.id} className="flex-1 flex flex-col items-center min-w-0">
              <div className="flex items-end justify-center gap-1.5 h-[56px] w-full">
                <div
                  className="w-[38%] max-w-[14px] rounded-t-sm border"
                  style={{
                    height: metaH,
                    backgroundColor: 'var(--sl-chart-meta)',
                    borderColor: 'var(--sl-chart-meta-border)',
                  }}
                  title={`Meta ${cat.meta}%`}
                  aria-hidden="true"
                />
                <div
                  className="w-[38%] max-w-[14px] rounded-t-sm"
                  style={{
                    height: realH,
                    backgroundColor: `var(${cat.realVar})`,
                  }}
                  title={`Real ${cat.real.toFixed(0)}%`}
                  aria-hidden="true"
                />
              </div>
              <span className="mt-2 text-[11px] text-ink-muted tabular-nums truncate w-full text-center">
                {cat.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted tracking-tight">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-sm border"
            style={{
              backgroundColor: 'var(--sl-chart-meta)',
              borderColor: 'var(--sl-chart-meta-border)',
            }}
          />
          Meta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-accent" />
          Gasto real
        </span>
        {chartCategories.map((cat) => (
          <span key={cat.id} className="tabular-nums">
            {cat.label} {cat.real.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  )
}
