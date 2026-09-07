import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Circle,
  Rect,
} from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  welcomeLabel?: string
  compact?: boolean
  width?: number
}

/** Topo do login - onda cobre AXEL + Bem-vindo (ref. wave, nossas cores) */
export function AuthHeader({
  welcomeLabel = 'Bem-vindo',
  compact,
  width: widthProp,
}: Props)
{
  const { colors, space, mode } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const width = widthProp ?? vw
  const brandH = (compact ? 220 : 280) + insets.top
  const waveY = brandH - 36
  const isDark = mode === 'dark'
  const copper = colors.axel
  const copperDeep = isDark ? '#B85A38' : colors.axelHover

  const wavePath = [
    `M0,${waveY}`,
    `C${width * 0.22},${waveY + 28} ${width * 0.38},${waveY - 18} ${width * 0.55},${waveY + 6}`,
    `C${width * 0.72},${waveY + 28} ${width * 0.86},${waveY - 8} ${width},${waveY + 14}`,
    `L${width},${brandH}`,
    `L0,${brandH}`,
    'Z',
  ].join(' ')

  return (
    <View style={{ height: brandH }}>
      <Svg
        width={width}
        height={brandH}
        viewBox={`0 0 ${width} ${brandH}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="authWaveBg" x1="0" y1="0" x2="0.2" y2="1">
            <Stop offset="0" stopColor={copper} />
            <Stop offset="0.55" stopColor={copperDeep} />
            <Stop offset="1" stopColor={isDark ? colors.elevated : copper} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={brandH} fill="url(#authWaveBg)" />
        {/* Contornos leves no espírito da referência */}
        <Circle cx={width * 0.78} cy={brandH * 0.28} r={90} fill="rgba(255,255,255,0.08)" />
        <Circle cx={width * 0.18} cy={brandH * 0.42} r={56} fill="rgba(255,255,255,0.06)" />
        <Circle cx={width * 0.92} cy={brandH * 0.55} r={40} fill="rgba(0,0,0,0.06)" />
        <Path
          d={`M${width * 0.1},${brandH * 0.2} Q${width * 0.35},${brandH * 0.12} ${width * 0.55},${brandH * 0.26} T${width * 0.95},${brandH * 0.18}`}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.2}
          fill="none"
        />
        <Path
          d={`M${width * 0.05},${brandH * 0.34} Q${width * 0.3},${brandH * 0.28} ${width * 0.5},${brandH * 0.4} T${width * 0.9},${brandH * 0.32}`}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          fill="none"
        />
        <Path d={wavePath} fill={colors.surface} />
      </Svg>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.lg,
          paddingBottom: space.xl + 28,
          paddingHorizontal: space.lg,
          justifyContent: 'flex-end',
          gap: space.md,
        }}
      >
        <BrandMark size={44} onFill />
        <Text
          variant="hero"
          style={{
            color: '#F5F1EC',
            fontSize: compact ? 32 : 40,
            letterSpacing: -1.2,
            lineHeight: compact ? 36 : 44,
          }}
        >
          {welcomeLabel}
        </Text>
        <Text
          variant="body"
          style={{
            color: 'rgba(245,241,236,0.88)',
            maxWidth: 320,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Humor, água, tarefas e finanças em um só lugar. O AXEL prioriza o essencial e reduz o ruído do dia.
        </Text>
      </View>
    </View>
  )
}
