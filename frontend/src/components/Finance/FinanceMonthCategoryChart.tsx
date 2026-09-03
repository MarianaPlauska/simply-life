import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { topMonthlySpendingByCategory } from '../../lib/financeSpendingInsights'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import { useFinanceChartTheme } from '../../lib/financeChartTheme'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY, MODULE_METRIC } from '../../constants/axelSurfaces'
import { CategoryIconCircle } from './categories/CategoryIconCircle'
import { ModuleEmptyState } from '../ui/ModuleEmptyState'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthCategoryChartProps
{
  transactions: Transaction[]
  categories: Category[]
  limit?: number
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { label: string; value: number } }>
})
{
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="border border-line rounded-sl bg-card px-3 py-2 shadow-lg">
      <p className={`text-[11px] ${AXEL_TEXT_PRIMARY}`}>{row.label}</p>
      <p className="font-mono text-[12px] text-finance tabular-nums">{fmt(row.value)}</p>
    </div>
  )
}

/** Top categorias de despesa do mês - rail desktop */
export function FinanceMonthCategoryChart({
  transactions,
  categories,
  limit = 5,
}: FinanceMonthCategoryChartProps)
{
  const chart = useFinanceChartTheme()
  const data = useMemo(
    () => topMonthlySpendingByCategory(transactions, categories, limit),
    [transactions, categories, limit],
  )

  if (data.length === 0)
  {
    return (
      <ModuleEmptyState
        icon={BarChart3}
        tone="finance"
        message={EMPTY_COPY.financeNoCategories}
      />
    )
  }

  const chartData = data.map((d) => ({
    label: d.label,
    value: d.value,
    color: d.color,
    icone: d.icone,
  }))
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div>
      <p className={`mb-2 ${MODULE_METRIC.finance}`}>
        <span className="text-[20px]">{fmt(total)}</span>
        <span className={`text-[11px] font-sans ml-1.5 ${AXEL_TEXT_SECONDARY}`}>no mês</span>
      </p>
      <ul className="space-y-1.5 mb-3">
        {chartData.map((row) => (
          <li key={row.label} className="flex items-center gap-2 min-w-0">
            <CategoryIconCircle
              icone={row.icone ?? 'Wallet'}
              cor={row.color}
              size="sm"
            />
            <span className={`text-[11px] truncate flex-1 ${AXEL_TEXT_PRIMARY}`}>{row.label}</span>
            <span className="text-[11px] font-mono tabular-nums text-finance shrink-0">
              {fmt(row.value)}
            </span>
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 28)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={72}
            tick={{ fill: chart.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            hide
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.grid, opacity: 0.35 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
        Despesas do mês por categoria
      </p>
    </div>
  )
}
