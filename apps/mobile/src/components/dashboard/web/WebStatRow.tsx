import { View } from 'react-native'
import type { Ionicons } from '@expo/vector-icons'
import { Text } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_DISPLAY_FONT } from './webTypography'
import { WEB_CARD_BORDER, WEB_ROW_DIVIDER } from './webPalette'

export type WebStatItem = {
  id: string
  label: string
  value: string
  hint?: string
  /** Usado pelo fallback mobile-web (HomeKpiSquares); não é mais desenhado nesta faixa. */
  icon: keyof typeof Ionicons.glyphMap
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

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 14,
        backgroundColor: colors.elevated,
        borderWidth: 1,
        borderColor: WEB_CARD_BORDER,
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) => (
        <WebHoverable
          key={item.id}
          onPress={item.onPress}
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={(hovered) => webStyle({
            flex: 1,
            minWidth: 0,
            paddingVertical: 18,
            paddingHorizontal: 20,
            gap: 10,
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: WEB_ROW_DIVIDER,
            backgroundColor: hovered && item.onPress ? colors.surface : 'transparent',
            cursor: item.onPress ? 'pointer' : 'default',
          })}
        >
          {(hovered: boolean) => (
            <>
              <Text
                variant="micro"
                muted
                numberOfLines={1}
                style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}
              >
                {item.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: WEB_DISPLAY_FONT,
                    fontSize: 28,
                    lineHeight: 32,
                    color: colors.ink,
                    flexShrink: 1,
                  }}
                >
                  {item.value}
                </Text>
                {item.hint ? (
                  <Text variant="micro" style={{ color: item.color, fontSize: 11 }} numberOfLines={1}>
                    {item.hint}
                  </Text>
                ) : null}
              </View>
              <View
                style={{
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: hovered && item.onPress ? item.color : WEB_ROW_DIVIDER,
                }}
              />
            </>
          )}
        </WebHoverable>
      ))}
    </View>
  )
}
