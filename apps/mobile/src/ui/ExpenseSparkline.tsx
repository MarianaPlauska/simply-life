import { View } from 'react-native'
import Svg, { Polyline, Polygon } from 'react-native-svg'
import { useTheme } from '../theme/ThemeProvider'

type Point = { day: number; total: number }

type Props = {
  series: Point[]
  height?: number
  color?: string
}

/**
 * Sparkline de gastos do mês - SVG nativo (Expo).
 * Recharts fica na PWA; aqui usamos react-native-svg já no stack mobile.
 */
export function ExpenseSparkline({ series, height = 72, color }: Props)
{
  const { colors } = useTheme()
  const stroke = color ?? colors.finance
  const w = 220
  const h = height
  const pad = 4
  const values = (series ?? []).map((p) => Number(p?.total) || 0)
  if (values.length < 2)
  {
    return <View style={{ height, width: '100%' }} />
  }

  const max = Math.max(...values, 1)
  const stepX = (w - pad * 2) / (values.length - 1)
  const pts = values.map((v, i) =>
  {
    const x = pad + i * stepX
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  })
  const line = pts.join(' ')
  const area = `${pad},${h - pad} ${line} ${pad + (values.length - 1) * stepX},${h - pad}`

  return (
    <View style={{ height, width: '100%', overflow: 'hidden' }}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <Polygon points={area} fill={stroke} opacity={0.14} />
        <Polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}
