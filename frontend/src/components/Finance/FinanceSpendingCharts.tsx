import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, CreditCard } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  getCurrentWeekRange,
  topCardSpending,
  topWeeklySpendingByCategory,
} from '../../lib/financeSpendingInsights'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { useFinanceChartTheme } from '../../lib/financeChartTheme'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceSpendingChartsProps
{
  transactions: Transaction[]
  activeCategories: Category[]
  compact?: boolean
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
      <p className="font-mono text-[12px] text-urgente tabular-nums">{fmt(row.value)}</p>
    </div>
  )
}

export function FinanceSpendingCharts({
  transactions,
  activeCategories,
  compact = false,
}: FinanceSpendingChartsProps)
{
  const chartHeight = compact ? 160 : 220
  const chart = useFinanceChartTheme()
  const cards = useTaskStore((s) => s.cards)
  const activeCards = cards.filter((c) => c.status === 'ativo')
  const [selectedCardId, setSelectedCardId] = useState<string>(
    activeCards[0]?.id ?? '',
  )

  const week = useMemo(() => getCurrentWeekRange(), [])
  const weekData = useMemo(
    () => topWeeklySpendingByCategory(transactions, activeCategories),
    [transactions, activeCategories],
  )

  const cardData = useMemo(() =>
  {
    if (!selectedCardId) return []
    return topCardSpending(transactions, selectedCardId, activeCategories, {
      start: week.start,
      end: week.end,
    })
  }, [transactions, selectedCardId, activeCategories, week])

  const weekTotal = weekData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
      <section className={`${AXEL_BORDERLESS_PANEL}`}>
        <header className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-accent" />
            <div>
              <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
                Maiores gastos da semana
              </p>
              <p className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>{week.label}</p>
            </div>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-urgente">
            {fmt(weekTotal)}
          </span>
        </header>

        {weekData.length === 0 ? (
          <p className={`py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Sem gastos nesta semana ainda
          </p>
        ) : (
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} layout="vertical" margin={{ left: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fontSize: 10, fill: chart.tick }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {weekData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className={`${AXEL_BORDERLESS_PANEL}`}>
        <header className="mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-accent" />
            <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
              Gastos por cartão · semana
            </p>
          </div>
          {activeCards.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeCards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCardId(c.id)}
                  className={`px-2.5 py-1 rounded-sl font-mono text-[10px] uppercase ${
                    selectedCardId === c.id ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          ) : (
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Cadastre um cartão na aba Cartões
            </p>
          )}
        </header>

        {activeCards.length === 0 || cardData.length === 0 ? (
          <p className={`py-8 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            {activeCards.length === 0
              ? 'Nenhum cartão cadastrado'
              : 'Nenhum gasto neste cartão na semana'}
          </p>
        ) : (
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardData} layout="vertical" margin={{ left: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fontSize: 10, fill: chart.tick }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {cardData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
