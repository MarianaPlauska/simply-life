import { View } from 'react-native'
import Svg, { Rect, Path, Text as SvgText } from 'react-native-svg'
import { COLOR_DARK } from '@simply-life/ui-tokens'
import { Text } from '../ui'
import { useTheme } from '../theme/ThemeProvider'

/** Marca SL - mesmo desenho do favicon.svg (web) */
export function BrandMark({
  size = 72,
  lockup,
  onFill,
}: {
  size?: number
  lockup?: boolean
  /** Sobre fundo cobre - mantém contraste do favicon */
  onFill?: boolean
})
{
  const { colors, space } = useTheme()
  const rx = size * 0.225
  const bg = onFill ? COLOR_DARK.canvas : colors.ink
  const fg = onFill ? COLOR_DARK.ink : colors.canvas
  const smile = colors.axel

  const icon = (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width="32" height="32" rx={7.2 * (size / 32)} fill={bg} />
      <SvgText
        x="16"
        y="20.5"
        textAnchor="middle"
        fontFamily="Manrope_700Bold"
        fontSize="13"
        fontWeight="700"
        fill={fg}
      >
        SL
      </SvgText>
      <Path
        d="M10.5 23.6c2.1 2.1 8.9 2.1 11 0"
        fill="none"
        stroke={smile}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </Svg>
  )

  if (!lockup) return icon

  return (
    <View style={{ alignItems: 'center', gap: space.md }}>
      {icon}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text
          variant="hero"
          style={{
            letterSpacing: -0.6,
            textAlign: 'center',
            color: onFill ? colors.axelOnFill : colors.ink,
          }}
        >
          Simply-Life
        </Text>
        <Text
          variant="caption"
          style={{
            letterSpacing: 0.3,
            textAlign: 'center',
            color: onFill ? 'rgba(26,24,22,0.72)' : colors.inkMuted,
          }}
        >
          OS pessoal · AXEL
        </Text>
      </View>
    </View>
  )
}
