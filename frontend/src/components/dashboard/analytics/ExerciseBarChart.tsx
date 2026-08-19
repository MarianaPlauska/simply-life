import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { AnalyticsChartRow } from '../../../data/analyticsMockData'
import { useAxelChartTheme } from '../../../hooks/useAxelChartTheme'
import { AXEL_DISPLAY_STAT, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { AxelChartTooltip, axelChartCursorFill, CHART_HEIGHT, type AxelTooltipProps } from './axelChartConfig'

// Modo Academia — barras com fill/stroke dependentes do tema

interface ExerciseBarChartProps
{
  rows: AnalyticsChartRow[]
  consistencyPct: number
}

export function ExerciseBarChart({ rows, consistencyPct }: ExerciseBarChartProps)
{
  const theme = useAxelChartTheme()
  const totalMin = rows.reduce((s, r) => s + r.treinoMin, 0)

  return (
    <div className="flex flex-col h-full min-h-[280px]">
      <div className="flex items-baseline justify-between mb-2">
        <span className={AXEL_DISPLAY_STAT}>
          {totalMin}m
        </span>
        <span className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>{consistencyPct}% consistência</span>
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid {...theme.grid} />
          <XAxis dataKey="label" {...theme.axis} />
          <YAxis {...theme.axis} unit="m" />
          <Tooltip
            content={(props) => <AxelChartTooltip {...(props as AxelTooltipProps)} />}
            cursor={{ fill: axelChartCursorFill(theme.isDarkMode) }}
          />
          <Bar
            dataKey="treinoMin"
            name="Treino (min)"
            fill={theme.exercise.fill}
            stroke={theme.exercise.stroke}
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
