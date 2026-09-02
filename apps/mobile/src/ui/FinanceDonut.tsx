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

/** Donut de gastos — visual de app financeiro nativo */
export function FinanceDonut({
  segments,
  centerLabel,
  centerValue,
  size = 200,
  strokeWidth = 22,
}: Props)
{
  const { colors } = useTheme()
  const stroke = strokeWidth
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1
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
          stroke={colors.elevated}
          strokeWidth={stroke}
          fill="none"
        />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {segments.map((seg, i) =>
          {
            const len = (seg.value / total) * c
            const dash = `${len} ${c - len}`
            const offset = -cursor
            cursor += len
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
                strokeLinecap="butt"
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
