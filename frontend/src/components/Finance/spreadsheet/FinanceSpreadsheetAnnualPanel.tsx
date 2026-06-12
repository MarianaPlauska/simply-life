import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AxelChartTooltip } from '../../dashboard/analytics/axelChartConfig'
import { useFinanceChartTheme } from '../../../lib/financeChartTheme'
import type { AnnualKpi, CumulativePoint, MonthlyBarPoint } from '../../../lib/financeSpreadsheetAnalytics'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function KpiCard({
  title,
  kpi,
  variant,
}: {
  title: string
  kpi: AnnualKpi
  variant: 'receita' | 'despesa'
})
{
  const shell = variant === 'receita'
    ? 'bg-concluido/10 border-concluido/25'
    : 'bg-urgente/10 border-urgente/25'

  const valueTone = variant === 'receita' ? 'text-concluido' : 'text-urgente'

  return (
    <div className={`rounded-sl border p-4 ${shell}`}>
      <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">{title}</p>
      <p className={`text-2xl font-display tabular-nums mt-1 ${valueTone}`}>
        {fmt(kpi.real)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div>
          <p className="text-ink-muted uppercase">Meta</p>
          <p className="text-ink tabular-nums">{fmt(kpi.meta)}</p>
        </div>
        <div>
          <p className="text-ink-muted uppercase">Percentual</p>
          <p className={`tabular-nums font-semibold ${valueTone}`}>
            {kpi.percentual.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  )
}

interface FinanceSpreadsheetAnnualPanelProps
{
  year: number
  receitaKpi: AnnualKpi
  despesaKpi: AnnualKpi
  monthly: MonthlyBarPoint[]
  cumulative: CumulativePoint[]
}

export function FinanceSpreadsheetAnnualPanel({
  year,
  receitaKpi,
  despesaKpi,
  monthly,
  cumulative,
}: FinanceSpreadsheetAnnualPanelProps)
{
  const chart = useFinanceChartTheme()

  const yMax = useMemo(() =>
  {
    let max = 0
    for (const row of monthly)
    {
      max = Math.max(max, row.receita, row.despesa)
    }
    return max > 0 ? undefined : 100
  }, [monthly])

  return (
    <div className="space-y-4 pt-2 border-t border-line">
      <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
        Visão anual · {year}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <KpiCard title="Real anual · receitas" kpi={receitaKpi} variant="receita" />
        <KpiCard title="Real anual · despesas" kpi={despesaKpi} variant="despesa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-line rounded-sl bg-card p-4 min-h-[240px]">
          <p className="font-mono text-[9px] uppercase text-ink-muted mb-3">
            Receitas × despesas
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barGap={4} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 9, fill: chart.tick }}
                axisLine={{ stroke: chart.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: chart.tick }}
                axisLine={false}
                tickLine={false}
                width={52}
                domain={yMax ? [0, yMax] : ['auto', 'auto']}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip content={<AxelChartTooltip />} />
              <Bar dataKey="receita" name="Receita" fill={chart.receita} radius={[2, 2, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill={chart.despesa} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-ink-muted">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: chart.receita }} />
              Receita
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-ink-muted">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: chart.despesa }} />
              Despesa
            </span>
          </div>
        </div>

        <div className="border border-line rounded-sl bg-card p-4 min-h-[240px]">
          <p className="font-mono text-[9px] uppercase text-ink-muted mb-3">
            Acumulado anual
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="idx"
                tick={{ fontSize: 8, fill: chart.tick }}
                axisLine={{ stroke: chart.grid }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: chart.tick }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                content={<AxelChartTooltip />}
                labelFormatter={(_, payload) =>
                  (payload?.[0]?.payload as CumulativePoint | undefined)?.label ?? ''
                }
              />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke={chart.accent}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: chart.accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
