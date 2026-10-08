import { View } from 'react-native'
import type { IconName } from '../../../ui/Icon'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_DISPLAY_FONT } from './webTypography'

export type WebStatItem = {
  id: string
  label: string
  value: string
  hint?: string
  /** Usado pelo fallback mobile-web (HomeKpiSquares); não é mais desenhado nesta faixa. */
  icon: IconName
  color: string
  onPress?: () => void
}

/**
 * Faixa de indicadores como ficha corrida (label pequeno + numeral serifado),
 * dividida por fios finos — de propósito, o oposto do "cartão com ícone em
 * círculo" que qualquer gerador de dashboard produz por padrão.
 */
export function WebStatRow({ items }: { items: WebStatItem[] })
{
  const { colors } = useTheme()

  // leve: números soltos numa linha, sem caixa nem divisórias
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 48, rowGap: 16, paddingVertical: 4 }}>
      {items.map((item) => (
        <WebHoverable
          key={item.id}
          onPress={item.onPress}
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={webStyle({ gap: 2, minWidth: 0, cursor: item.onPress ? 'pointer' : 'default' })}
        >
          {(hovered: boolean) => (
            <>
              <Text variant="caption" muted numberOfLines={1}>
                {item.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: WEB_DISPLAY_FONT,
                    fontSize: 22,
                    lineHeight: 30,
                    color: hovered && item.onPress ? item.color : colors.ink,
                  }}
                >
                  {item.value}
                </Text>
                {item.hint ? (
                  <Text variant="caption" style={{ color: item.color }} numberOfLines={1}>
                    {item.hint}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </WebHoverable>
      ))}
    </View>
  )
}
