import { View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

export type DonutSegment = {
  color: string
  value: number
  label?: string
}

type Props = {
  segments: DonutSegment[]
  centerLabel: string
  centerValue: string
  size?: number
  strokeWidth?: number
}

/** Donut de gastos - traço fino, gaps leves entre fatias */
export function FinanceDonut({
  segments,
  centerLabel,
  centerValue,
  size = 200,
  strokeWidth = 14,
}: Props)
{
  const { colors } = useTheme()
  const stroke = strokeWidth
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1
  const gap = segments.length > 1 ? Math.min(10, c * 0.012) : 0
  let cursor = 0
  const inner = size - stroke * 2 - 8
  const valueSize =
    centerValue.length > 14 ? 14 : centerValue.length > 11 ? 15 : 17

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.hairline}
          strokeWidth={stroke}
          fill="none"
          opacity={0.55}
        />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {segments.map((seg, i) =>
          {
            const raw = (seg.value / total) * c
            const len = Math.max(0, raw - gap)
            const dash = `${len} ${c - len}`
            const offset = -cursor
            cursor += raw
            return (
              <Circle
                key={`${seg.label ?? i}-${seg.color}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="none"
              />
            )
          })}
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: inner,
        }}
      >
        <Text variant="micro" muted style={{ textAlign: 'center' }}>
          {centerLabel}
        </Text>
        <Text
          variant="bodyStrong"
          style={{
            textAlign: 'center',
            marginTop: 2,
            fontSize: valueSize,
            lineHeight: valueSize + 2,
            letterSpacing: -0.4,
          }}
          numberOfLines={1}
        >
          {centerValue}
        </Text>
      </View>
    </View>
  )
}
