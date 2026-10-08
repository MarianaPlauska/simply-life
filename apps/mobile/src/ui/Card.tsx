import { View, type ViewProps } from 'react-native'
import { COMPONENT_SPEC, type ColorTokens } from '@simply-life/ui-tokens'
import { useWebBox } from '../components/dashboard/web/webBox'
import { useInPanel } from './Panel'
import { useTheme } from '../theme/ThemeProvider'

type ModuleAccent = 'health' | 'axel' | 'finance' | 'tasks'

type Props = ViewProps & {
  tone?: 'default' | 'elevated' | 'widget' | 'hero' | 'inset'
  /** Faixa no topo (módulo), sem pintar o card inteiro */
  accentTop?: ModuleAccent
  /** sem fundo, borda, sombra e recuo: quando o card está dentro de um Panel */
  bare?: boolean
}

function accentColor(colors: ColorTokens, key: ModuleAccent): string
{
  if (key === 'health') return colors.health
  if (key === 'finance') return colors.finance
  if (key === 'tasks') return colors.tasks
  return colors.axel
}

export function Card({ children, style, tone = 'default', accentTop, bare, ...rest }: Props)
{
  const { colors, radius, elevation, mode } = useTheme()
  const webBox = useWebBox()
  const inPanel = useInPanel()
  const widget = tone === 'widget'
  const elevated = tone === 'elevated'
  const hero = tone === 'hero'
  const inset = tone === 'inset'
  const dark = mode === 'dark'

  const bg = widget
    ? colors.featureBg
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
              shadowColor: elevation.hero.shadowColor,
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

  // dentro de um Panel a superfície é do Panel: o cartão não desenha caixa própria
  if (bare || inPanel) return <View style={style} {...rest}>{children}</View>

  // computador (web): mesma caixa de todos os blocos, sem sombra
  if (webBox)
  {
    return (
      <View style={[{ ...webBox, overflow: 'hidden', ...accentStripe }, style]} {...rest}>
        {children}
      </View>
    )
  }

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
