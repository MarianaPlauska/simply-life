import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { AnalyticsChartRow } from '../../../data/analyticsMockData'
import { useAxelChartTheme } from '../../../hooks/useAxelChartTheme'
import { AXEL_DISPLAY_STAT, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { AxelChartTooltip, CHART_HEIGHT, type AxelTooltipProps } from './axelChartConfig'

// Produtividade — linhas concluídas vs abertas; cores do tema

interface ProductivityLineChartProps
{
  rows: AnalyticsChartRow[]
  orchestrationScore: number
}

export function ProductivityLineChart({ rows, orchestrationScore }: ProductivityLineChartProps)
{
  const theme = useAxelChartTheme()
  const totalDone = rows.reduce((s, r) => s + r.concluidas, 0)

  return (
    <div className="flex flex-col h-full min-h-[280px]">
      <div className="flex items-baseline justify-between mb-2">
        <span className={AXEL_DISPLAY_STAT}>
          {orchestrationScore}
        </span>
        <span className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>{totalDone} concluídas no período</span>
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid {...theme.grid} />
          <XAxis dataKey="label" {...theme.axis} />
          <YAxis {...theme.axis} />
          <Tooltip content={(props) => <AxelChartTooltip {...(props as AxelTooltipProps)} />} />
          <Legend wrapperStyle={theme.legendStyle} iconType="line" />
          <Line
            type="monotone"
            dataKey="concluidas"
            name="Concluídas"
            stroke={theme.productivity.completed}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, fill: theme.productivity.completed }}
          />
          <Line
            type="monotone"
            dataKey="abertas"
            name="Abertas"
            stroke={theme.productivity.open}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
