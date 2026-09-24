import { View, type ViewProps } from 'react-native'
import { COMPONENT_SPEC, type ColorTokens } from '@simply-life/ui-tokens'
import { useTheme } from '../theme/ThemeProvider'

type ModuleAccent = 'health' | 'axel' | 'finance' | 'tasks'

type Props = ViewProps & {
  tone?: 'default' | 'elevated' | 'widget' | 'hero' | 'inset'
  /** Faixa no topo (módulo), sem pintar o card inteiro */
  accentTop?: ModuleAccent
}

function accentColor(colors: ColorTokens, key: ModuleAccent): string
{
  if (key === 'health') return colors.health
  if (key === 'finance') return colors.finance
  if (key === 'tasks') return colors.tasks
  return colors.axel
}

export function Card({ children, style, tone = 'default', accentTop, ...rest }: Props)
{
  const { colors, radius, elevation, mode } = useTheme()
  const widget = tone === 'widget'
  const elevated = tone === 'elevated'
  const hero = tone === 'hero'
  const inset = tone === 'inset'
  const dark = mode === 'dark'

  const bg = widget
    ? colors.widget
    : inset
      ? colors.canvas
      : elevated || hero
        ? colors.elevated
        : colors.surface

  const useRim = !widget && !inset
  const rim = useRim
    ? {
        borderWidth: 1,
        borderColor: colors.cardRim,
      }
    : {}

  // Escuro: sombra forte parece “adesivo”; contorno + superfície bastam.
  const shadowStyle =
    widget || inset
      ? {}
      : dark
        ? hero
          ? {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 2,
            }
          : {}
        : hero
          ? elevation.hero
          : elevation.card

  const accentStripe = accentTop
    ? {
        borderTopWidth: 3,
        borderTopColor: accentColor(colors, accentTop),
      }
    : {}

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.card,
          padding: COMPONENT_SPEC.Card.padding,
          overflow: 'hidden',
          ...rim,
          ...shadowStyle,
          ...accentStripe,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}
