import { View, type ViewProps, StyleSheet } from 'react-native'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { useTheme } from '../theme/ThemeProvider'

type Props = ViewProps & {
  tone?: 'default' | 'elevated' | 'widget' | 'hero' | 'inset'
}

export function Card({ children, style, tone = 'default', ...rest }: Props)
{
  const { colors, radius, elevation, mode } = useTheme()
  const widget = tone === 'widget'
  const elevated = tone === 'elevated'
  const hero = tone === 'hero'
  const inset = tone === 'inset'

  const bg = widget
    ? colors.widget
    : inset
      ? colors.canvas
      : elevated || hero
        ? colors.elevated
        : colors.surface

  const useLuminanceOnly = mode === 'dark'
  const shadowStyle = widget || inset
    ? {}
    : hero
      ? useLuminanceOnly
        ? {}
        : elevation.hero
      : elevated
        ? useLuminanceOnly
          ? {}
          : elevation.card
        : useLuminanceOnly
          ? {}
          : elevation.card

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.card,
          padding: COMPONENT_SPEC.Card.padding,
          // Wireframe limpo: cards elevated sem borda dura; hairline só no default/inset
          borderWidth: elevated || hero || widget ? 0 : StyleSheet.hairlineWidth,
          borderColor: inset ? colors.hairline : colors.hairline,
          ...shadowStyle,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}
