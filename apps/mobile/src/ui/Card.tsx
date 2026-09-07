import { View, type ViewProps } from 'react-native'
import { COMPONENT_SPEC } from '@simply-life/ui-tokens'
import { useTheme } from '../theme/ThemeProvider'

type Props = ViewProps & {
  tone?: 'default' | 'elevated' | 'widget' | 'hero' | 'inset'
}

export function Card({ children, style, tone = 'default', ...rest }: Props)
{
  const { colors, radius, elevation } = useTheme()
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

  const shadowStyle = widget || inset ? {} : hero ? elevation.hero : elevation.card

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.card,
          padding: COMPONENT_SPEC.Card.padding,
          borderWidth: 0,
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
