import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Circle, Rect } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  welcomeLabel?: string
  compact?: boolean
  width?: number
}

/** Topo do login mobile: preto OLED + cobre, no espírito da landing. */
export function AuthHeader({
  welcomeLabel = 'Organize.\nPlaneje.\nSimply.',
  compact,
  width: widthProp,
}: Props)
{
  const { colors, space } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const width = widthProp ?? vw
  const brandH = (compact ? 250 : 320) + insets.top

  return (
    <View style={{ height: brandH, backgroundColor: '#050403' }}>
      <Svg
        width={width}
        height={brandH}
        viewBox={`0 0 ${width} ${brandH}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="authWaveBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#120E0C" />
            <Stop offset="1" stopColor="#050403" />
          </LinearGradient>
          <RadialGradient id="authGlow" cx="50%" cy="42%" rx="55%" ry="40%">
            <Stop offset="0" stopColor={colors.axel} stopOpacity={0.48} />
            <Stop offset="1" stopColor="#050403" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={brandH} fill="url(#authWaveBg)" />
        <Rect width={width} height={brandH} fill="url(#authGlow)" />
        <Circle cx={width * 0.82} cy={brandH * 0.22} r={80} fill="rgba(232,115,74,0.14)" />
        <Circle cx={width * 0.12} cy={brandH * 0.5} r={48} fill="rgba(232,115,74,0.1)" />
      </Svg>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.md,
          paddingBottom: space.lg,
          paddingHorizontal: space.lg,
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >
        <BrandMark size={40} onFill />
        <Text
          variant="hero"
          style={{
            color: '#F7F3EE',
            fontSize: compact ? 30 : 36,
            letterSpacing: -1.2,
            lineHeight: compact ? 34 : 40,
          }}
        >
          {welcomeLabel.split('\n').map((line, i, all) => (
            <Text
              key={line}
              variant="hero"
              style={{
                color: i === all.length - 1 ? colors.axel : '#F7F3EE',
                fontSize: compact ? 30 : 36,
                letterSpacing: -1.2,
                lineHeight: compact ? 34 : 40,
              }}
            >
              {i === 0 ? line : `\n${line}`}
            </Text>
          ))}
        </Text>
        <Text
          variant="body"
          style={{
            color: 'rgba(245,241,236,0.82)',
            maxWidth: 340,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {'O essencial do seu dia, numa tela só.\nHumor, treino, tarefas e contas.'}
        </Text>
      </View>
    </View>
  )
}
