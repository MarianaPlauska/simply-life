import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from 'react-native-svg'
import { BrandMark, SunFyWordmark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { LoginProductPreview } from './LoginProductPreview'

type Props = {
  /** Ajusta alturas e tipografia em telas de notebook (altura menor) sem diminuir em monitores grandes */
  compact?: boolean
}

/** Landing desktop: petróleo, o Axel girassol, manifesto SunFy e mock do produto. */
export function LoginBrandPanel({ compact = false }: Props)
{
  const { space, colors } = useTheme()
  const heroSize = compact ? 36 : 44
  const heroLine = compact ? 40 : 48

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: colors.brandDeep }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="brandBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={colors.brandDeep} />
          </LinearGradient>
          <RadialGradient id="brandAccent" cx="52%" cy="58%" rx="42%" ry="36%">
            <Stop offset="0" stopColor={colors.axelFill} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={colors.axelFill} stopOpacity={0.18} />
            <Stop offset="1" stopColor={colors.brandDeep} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#brandBg)" />
        <Rect width="100%" height="100%" fill="url(#brandAccent)" />
        <Circle cx="14%" cy="18%" r="90" fill={colors.brandInk} fillOpacity={0.1} />
        <Circle cx="88%" cy="82%" r="140" fill={colors.brandInk} fillOpacity={0.07} />
      </Svg>

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: compact ? space.xl : space.xxl,
          paddingVertical: compact ? space.md : space.xl,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: compact ? 500 : 560,
            gap: compact ? 10 : 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BrandMark size={compact ? 38 : 46} onFill />
            <SunFyWordmark
              color={colors.onBrand}
              style={{
                fontSize: compact ? 24 : 28,
                lineHeight: compact ? 30 : 34,
                letterSpacing: -0.6,
              }}
            />
          </View>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: compact ? 10 : 12,
              minHeight: compact ? 28 : 32,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: `${colors.brandInk}73`,
              backgroundColor: `${colors.brandInk}1F`,
              justifyContent: 'center',
            }}
          >
            <Text variant="caption" style={{ color: colors.onBrand, fontWeight: '700' }}>
              Um girassol pra você
            </Text>
          </View>
          <Text
            variant="hero"
            style={{
              color: colors.onBrand,
              fontSize: heroSize,
              lineHeight: heroLine,
              letterSpacing: compact ? -1.2 : -1.5,
            }}
          >
            {'Passos pequenos.\nSem pressa.\n'}
            <Text
              variant="hero"
              style={{
                color: colors.axelFill,
                fontSize: heroSize,
                lineHeight: heroLine,
                letterSpacing: compact ? -1.2 : -1.5,
              }}
            >
              Nunca sozinho.
            </Text>
          </Text>
          <Text
            variant="body"
            style={{
              color: `${colors.onBrand}C7`,
              maxWidth: 440,
              fontSize: compact ? 14 : 16,
              lineHeight: compact ? 20 : 24,
            }}
          >
            {'Nos dias nublados, os girassóis se viram uns para os outros.\nO SunFy é esse girassol pra você.'}
          </Text>
          <LoginProductPreview compact={compact} />
        </View>
      </View>
    </View>
  )
}
