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
import { AxelChartTooltip, CHART_HEIGHT, type AxelTooltipProps } from './axelChartConfig'

// Hidratação — barras verticais; grid/eixos reagem ao tema

interface WaterBarChartProps
{
  rows: AnalyticsChartRow[]
}

export function WaterBarChart({ rows }: WaterBarChartProps)
{
  const theme = useAxelChartTheme()
  const total = rows.reduce((s, r) => s + r.aguaLitros, 0)
  const avg = rows.length ? total / rows.length : 0

  return (
    <div className="flex flex-col h-full min-h-[280px]">
      <div className="flex items-baseline justify-between mb-2">
        <span className={AXEL_DISPLAY_STAT}>
          {avg.toFixed(1)}L
        </span>
        <span className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>média / bucket</span>
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid {...theme.grid} />
          <XAxis dataKey="label" {...theme.axis} />
          <YAxis {...theme.axis} unit="L" />
          <Tooltip content={(props) => <AxelChartTooltip {...(props as AxelTooltipProps)} />} />
          <Bar
            dataKey="aguaLitros"
            name="Água (L)"
            fill={theme.waterBar}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
