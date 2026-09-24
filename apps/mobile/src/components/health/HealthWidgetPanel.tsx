import { type ReactNode } from 'react'
import { View, type ViewStyle } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

type SectionProps = {
  children: ReactNode
  title?: string
  lead?: string
  dividerTop?: boolean
  inset?: boolean
}

/** Painel contínuo do módulo Saúde — mesma “mesa” visual da Home (widget). */
export function HealthWidgetPanel({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
})
{
  const { colors, radius } = useTheme()

  return (
    <View
      style={{
        borderRadius: radius.card,
        backgroundColor: colors.widget,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardRim,
        ...style,
      }}
    >
      {children}
    </View>
  )
}

export function HealthWidgetSection({
  children,
  title,
  lead,
  dividerTop = false,
  inset = false,
  chrome = false,
}: SectionProps & { chrome?: boolean })
{
  const { colors, space } = useTheme()

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: chrome ? 20 : inset ? space.md : 20,
        gap: chrome ? space.md : space.md,
        borderTopWidth: dividerTop ? 1 : 0,
        borderTopColor: colors.cardRim,
        backgroundColor: inset ? 'rgba(0, 0, 0, 0.22)' : 'transparent',
      }}
    >
      {title || lead ? (
        <View style={{ gap: 4 }}>
          {title ? (
            <Text variant="caption" style={{ color: colors.widgetMuted, fontWeight: '600' }}>
              {title}
            </Text>
          ) : null}
          {lead ? (
            <Text variant="title" style={{ color: colors.widgetInk, fontSize: 22, lineHeight: 28 }}>
              {lead}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  )
}
