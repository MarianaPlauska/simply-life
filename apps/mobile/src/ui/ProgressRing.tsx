import { View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'
import { Text } from './Text'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  progress: number
  size?: number
  strokeWidth?: number
  color: string
  showLabel?: boolean
  centerLabel?: string
}

export function ProgressRing({
  progress,
  size = 34,
  strokeWidth = 3.5,
  color,
  showLabel = true,
  centerLabel,
}: Props)
{
  const { colors } = useTheme()
  const pct = Math.max(0, Math.min(100, Number(progress) || 0))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const filled = (pct / 100) * c

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${filled} ${c - filled}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {showLabel ? (
        <Text
          variant="micro"
          style={{
            position: 'absolute',
            fontSize: centerLabel ? (size >= 72 ? 22 : 14) : 9,
            fontWeight: '700',
            color,
            letterSpacing: centerLabel ? -0.4 : 0,
          }}
        >
          {centerLabel ?? String(Math.round(pct))}
        </Text>
      ) : null}
    </View>
  )
}
