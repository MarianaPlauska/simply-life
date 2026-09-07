import { View } from 'react-native'
import Svg, { Polyline, Polygon } from 'react-native-svg'
import { useTheme } from '../theme/ThemeProvider'

type Point = { day: number; total: number }

type Props = {
  series: Point[]
  incomeSeries?: Point[]
  height?: number
  color?: string
  incomeColor?: string
}

function polylineOf(values: number[], w: number, h: number, pad: number, max: number): string
{
  const stepX = (w - pad * 2) / Math.max(values.length - 1, 1)
  return values
    .map((v, i) =>
    {
      const x = pad + i * stepX
      const y = h - pad - (v / max) * (h - pad * 2)
      return `${x},${y}`
    })
    .join(' ')
}

/**
 * Sparkline de gastos do mês - SVG nativo (Expo).
 * Série opcional de receita (linha segunda).
 */
export function ExpenseSparkline({
  series,
  incomeSeries,
  height = 72,
  color,
  incomeColor,
}: Props)
{
  const { colors } = useTheme()
  const stroke = color ?? colors.finance
  const incomeStroke = incomeColor ?? colors.health
  const w = 220
  const h = height
  const pad = 4
  const values = (series ?? []).map((p) => Number(p?.total) || 0)
  const incomeValues = (incomeSeries ?? []).map((p) => Number(p?.total) || 0)
  if (values.length < 2 && incomeValues.length < 2)
  {
    return <View style={{ height, width: '100%' }} />
  }

  const max = Math.max(...values, ...incomeValues, 1)
  const line = values.length >= 2 ? polylineOf(values, w, h, pad, max) : ''
  const incomeLine = incomeValues.length >= 2 ? polylineOf(incomeValues, w, h, pad, max) : ''
  const stepX = (w - pad * 2) / Math.max(values.length - 1, 1)
  const area = line
    ? `${pad},${h - pad} ${line} ${pad + (values.length - 1) * stepX},${h - pad}`
    : ''

  return (
    <View style={{ height, width: '100%', overflow: 'hidden' }}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {area ? <Polygon points={area} fill={stroke} opacity={0.14} /> : null}
        {line ? (
          <Polyline
            points={line}
            fill="none"
            stroke={stroke}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {incomeLine ? (
          <Polyline
            points={incomeLine}
            fill="none"
            stroke={incomeStroke}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  )
}
