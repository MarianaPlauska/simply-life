import { View, type TextStyle } from 'react-native'
import { Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { SunFyMark } from './SunFyMark'

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

/** Marca SunFy: o símbolo "tudo se volta pra você" (o Axel é o personagem, não a marca) */
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

  const icon = onFill ? <SunFyMark size={size} /> : <SunFyMark size={size} tile />

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
