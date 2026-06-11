import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { AnalyticsChartRow } from '../../../data/analyticsMockData'
import { useAxelChartTheme } from '../../../hooks/useAxelChartTheme'
import { AXEL_DISPLAY_STAT, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { AxelChartTooltip, CHART_HEIGHT, type AxelTooltipProps } from './axelChartConfig'
import { EggLimitDots } from './EggLimitDots'

// Evolução de proteína — meta 100g; eixos/grid seguem colorScheme

interface ProteinAreaChartProps
{
  rows: AnalyticsChartRow[]
  meta: number
  eggsToday: number
  eggMax: number
}

export function ProteinAreaChart({ rows, meta, eggsToday, eggMax }: ProteinAreaChartProps)
{
  const theme = useAxelChartTheme()
  const last = rows[rows.length - 1]?.proteina ?? 0
  const fillOpacityTop = theme.isDarkMode ? 0.35 : 0.25

  return (
    <div className="flex flex-col h-full min-h-[280px]">
      <div className="flex items-baseline justify-between mb-2">
        <span className={AXEL_DISPLAY_STAT}>{last}g</span>
        <span className={`font-mono text-[11px] ${AXEL_TEXT_SECONDARY}`}>meta {meta}g</span>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="axelProteinFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity={fillOpacityTop} />
                <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...theme.grid} />
            <XAxis dataKey="label" {...theme.axis} />
            <YAxis {...theme.axis} domain={[0, 100]} />
            <Tooltip content={(props) => <AxelChartTooltip {...(props as AxelTooltipProps)} />} />
            <ReferenceLine y={meta} stroke={theme.refLine} strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="proteina"
              name="Proteína (g)"
              stroke={theme.accent}
              strokeWidth={2}
              fill="url(#axelProteinFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <EggLimitDots consumed={eggsToday} max={eggMax} />
    </div>
  )
}
