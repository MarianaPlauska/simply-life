import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useFinanceChartTheme } from '../../../lib/financeChartTheme'
import { AXEL_TEXT_SECONDARY, AXEL_METRIC_HAIRLINE } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthChartsCompactProps
{
  pieChartData: { name: string; value: number; color: string }[]
  areaChartData: { mes: string; receita: number; gastos: number }[]
}

export function FinanceMonthChartsCompact({
  pieChartData,
  areaChartData,
}: FinanceMonthChartsCompactProps)
{
  const chart = useFinanceChartTheme()

  return (
    <section className={`${AXEL_METRIC_HAIRLINE} space-y-3`}>
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-accent shrink-0" />
        <div>
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Visão do mês
          </p>
          <p className={`text-[11px] text-ink`}>Categorias e evolução · 6 meses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-[140px]">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt(Number(v ?? 0))}
                  contentStyle={{
                    backgroundColor: chart.card,
                    border: `1px solid ${chart.line}`,
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={`h-full flex items-center justify-center text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Sem gastos por categoria
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-1">
            {pieChartData.slice(0, 4).map((e) => (
              <span key={e.name} className={`font-mono text-[8px] ${AXEL_TEXT_SECONDARY}`}>
                {e.name}
              </span>
            ))}
          </div>
        </div>

        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: chart.tick }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => fmt(Number(v ?? 0))}
                contentStyle={{
                  backgroundColor: chart.card,
                  border: `1px solid ${chart.line}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke={chart.receita}
                fill={chart.receita}
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke={chart.despesa}
                fill={chart.despesa}
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
