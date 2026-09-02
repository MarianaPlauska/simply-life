import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  /** Título decorativo no topo colorido (ex.: Welcome) — opcional */
  welcomeLabel?: string
  compact?: boolean
  width?: number
}

/**
 * Header auth mobile — layout da ref (topo com padrão + onda).
 * Cores: acento AXEL no bloco; form branco fica abaixo.
 */
export function AuthHeader({ welcomeLabel, compact, width: widthProp }: Props)
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const width = widthProp ?? vw
  const h = (compact ? 220 : 280) + insets.top
  const headerBg = colors.axel
  const pattern = 'rgba(255,255,255,0.14)'

  // Onda suave (como a ref) — desce do lado esquerdo e sobe à direita
  const waveY = h - 48
  const curve = `
    M 0,0
    H ${width}
    V ${waveY - 20}
    C ${width * 0.75},${waveY + 36} ${width * 0.35},${waveY - 8} 0,${waveY + 28}
    Z
  `

  return (
    <View style={{ height: h, marginBottom: -36 }}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.canvas }]} />
      <Svg
        width={width}
        height={h}
        viewBox={`0 0 ${width} ${h}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="authHero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={headerBg} />
            <Stop offset="1" stopColor={colors.axelHover} />
          </LinearGradient>
        </Defs>
        <Path d={curve} fill="url(#authHero)" />
        {/* Topografia sutil — linhas/curvas da ref */}
        <Path
          d={`M ${width * 0.05},${h * 0.22} Q ${width * 0.25},${h * 0.12} ${width * 0.45},${h * 0.24} T ${width * 0.95},${h * 0.18}`}
          stroke={pattern}
          strokeWidth={1.2}
          fill="none"
        />
        <Path
          d={`M ${width * 0.08},${h * 0.34} Q ${width * 0.3},${h * 0.22} ${width * 0.55},${h * 0.36} T ${width * 0.98},${h * 0.28}`}
          stroke={pattern}
          strokeWidth={1.2}
          fill="none"
        />
        <Path
          d={`M ${width * 0.02},${h * 0.46} Q ${width * 0.28},${h * 0.34} ${width * 0.5},${h * 0.48} T ${width * 0.92},${h * 0.4}`}
          stroke={pattern}
          strokeWidth={1}
          fill="none"
        />
        <Circle cx={width * 0.72} cy={h * 0.28} r={48} fill="rgba(255,255,255,0.06)" />
        <Circle cx={width * 0.18} cy={h * 0.4} r={32} fill="rgba(255,255,255,0.05)" />
      </Svg>

      {welcomeLabel ? (
        <View
          style={{
            paddingTop: insets.top + space.xl,
            paddingHorizontal: space.xl,
            justifyContent: 'flex-end',
            flex: 1,
            paddingBottom: 64,
          }}
        >
          <Text
            variant="hero"
            style={{
              color: colors.axelOnFill,
              fontSize: 36,
              letterSpacing: -0.8,
            }}
          >
            {welcomeLabel}
          </Text>
          <Text
            variant="body"
            style={{ color: 'rgba(247,246,242,0.78)', marginTop: 8, maxWidth: 260 }}
          >
            Humor, tarefas e finanças — no seu ritmo.
          </Text>
        </View>
      ) : null}
    </View>
  )
}
