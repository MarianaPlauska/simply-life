import { View, type TextStyle } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { BRAND } from '@simply-life/ui-tokens'
import { Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { AxelSun } from './AxelSun'

/**
 * Nome SunFy: o "u" em coral é o sorriso da marca.
 * SUNflower + FY (for you): um girassol pra você.
 */
export function SunFyWordmark({
  style,
  color,
}: {
  style?: TextStyle
  color?: string
})
{
  const { colors } = useTheme()
  return (
    <Text variant="hero" style={[{ color: color ?? colors.ink }, style]} accessibilityLabel="SunFy">
      S
      <Text variant="hero" style={[style, { color: colors.axelFill }]}>u</Text>
      nFy
    </Text>
  )
}

/** Marca SunFy: o Axel, girassol de rosto amigo, sobre petróleo */
export function BrandMark({
  size = 72,
  lockup,
  onFill,
}: {
  size?: number
  lockup?: boolean
  /** Sobre fundo petróleo: dispensa o quadrado de fundo */
  onFill?: boolean
})
{
  const { colors, space } = useTheme()

  const icon = onFill ? (
    <AxelSun size={size} label="SunFy" />
  ) : (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 32 32" style={{ position: 'absolute' }}>
        <Rect width="32" height="32" rx="7.2" fill={BRAND.petroleo} />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AxelSun size={size * 0.84} label="SunFy" />
      </View>
    </View>
  )

  if (!lockup) return icon

  return (
    <View style={{ alignItems: 'center', gap: space.md }}>
      {icon}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <SunFyWordmark
          color={onFill ? colors.onBrand : colors.ink}
          style={{ letterSpacing: -0.6, textAlign: 'center' }}
        />
        <Text
          variant="caption"
          style={{
            letterSpacing: 0.3,
            textAlign: 'center',
            color: onFill ? colors.brandInk : colors.inkMuted,
          }}
        >
          Um girassol pra você
        </Text>
      </View>
    </View>
  )
}
