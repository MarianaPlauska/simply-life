import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from 'react-native-svg'
import { BrandMark } from '../BrandMark'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { LoginProductPreview } from './LoginProductPreview'

/** Landing desktop: preto OLED, cobre AXEL, mock do produto. */
export function LoginBrandPanel()
{
  const { space, colors } = useTheme()

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
          paddingHorizontal: space.xl,
          paddingVertical: space.xl,
          gap: space.md,
        }}
      >
        <BrandMark size={48} onFill />
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            minHeight: 32,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: `${colors.brandInk}73`,
            backgroundColor: `${colors.brandInk}1F`,
            justifyContent: 'center',
          }}
        >
          <Text variant="caption" style={{ color: colors.onBrand, fontWeight: '700' }}>
            Organização sem pressão
          </Text>
        </View>
        <Text
          variant="hero"
          style={{
            color: colors.onBrand,
            fontSize: 48,
            lineHeight: 52,
            letterSpacing: -1.6,
          }}
        >
          {'Organize.\nPlaneje.\n'}
          <Text
            variant="hero"
            style={{ color: colors.axelFill, fontSize: 48, lineHeight: 52, letterSpacing: -1.6 }}
          >
            Simply.
          </Text>
        </Text>
        <Text
          variant="body"
          style={{ color: `${colors.onBrand}C7`, maxWidth: 440, fontSize: 16, lineHeight: 24 }}
        >
          {'Tire da cabeça.\nO resto a gente organiza.'}
        </Text>
        <LoginProductPreview />
      </View>
    </View>
  )
}
