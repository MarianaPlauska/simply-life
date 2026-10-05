import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Circle, Rect } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandMark, SunFyWordmark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  welcomeLabel?: string
  compact?: boolean
  width?: number
}

/**
 * Topo do login mobile. Segue o tema: menta clara no modo claro (sem bloco
 * escuro) e petróleo no escuro. Baixo de propósito, para o formulário
 * caber na tela sem rolar.
 */
export function AuthHeader({
  welcomeLabel = 'Passos pequenos.\nSem pressa.\nFeito pra você.',
  compact,
  width: widthProp,
}: Props)
{
  const { colors, space, mode } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw } = useWindowDimensions()
  const width = widthProp ?? vw
  const brandH = (compact ? 196 : 228) + insets.top
  const dark = mode === 'dark'
  const titleSize = compact ? 28 : 32

  return (
    <View style={{ height: brandH, backgroundColor: colors.heroBgDeep }}>
      <Svg
        width={width}
        height={brandH}
        viewBox={`0 0 ${width} ${brandH}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="authWaveBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.heroBg} />
            <Stop offset="1" stopColor={colors.heroBgDeep} />
          </LinearGradient>
          <RadialGradient id="authGlow" cx="78%" cy="30%" rx="50%" ry="45%">
            <Stop offset="0" stopColor={colors.axelFill} stopOpacity={dark ? 0.3 : 0.18} />
            <Stop offset="1" stopColor={colors.heroBgDeep} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={brandH} fill="url(#authWaveBg)" />
        <Rect width={width} height={brandH} fill="url(#authGlow)" />
        <Circle cx={width * 0.86} cy={brandH * 0.24} r={72} fill={colors.brandInk} fillOpacity={dark ? 0.08 : 0.35} />
      </Svg>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.md,
          paddingBottom: space.xl,
          paddingHorizontal: space.lg,
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BrandMark size={36} onFill={dark} />
          <SunFyWordmark color={colors.heroInk} style={{ fontSize: 22, lineHeight: 28, letterSpacing: -0.4 }} />
        </View>
        <Text
          variant="hero"
          style={{ color: colors.heroInk, fontSize: titleSize, letterSpacing: -1, lineHeight: titleSize + 4 }}
        >
          {welcomeLabel.split('\n').map((line, i, all) => (
            <Text
              key={line}
              variant="hero"
              style={{
                color: i === all.length - 1 ? colors.axel : colors.heroInk,
                fontSize: titleSize,
                letterSpacing: -1,
                lineHeight: titleSize + 4,
              }}
            >
              {i === 0 ? line : `\n${line}`}
            </Text>
          ))}
        </Text>
        <Text variant="body" style={{ color: colors.heroMuted, maxWidth: 340, fontSize: 15, lineHeight: 22 }}>
          Nos dias nublados, a gente se vira um pro outro.
        </Text>
      </View>
    </View>
  )
}
