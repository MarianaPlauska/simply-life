import { type ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'

/** Seção na tela (Saúde) — gap + divisória, sem cartão envolvendo o bloco. */
export function HealthScreenSection({
  children,
  title,
  subtitle,
  dividerTop = false,
}: {
  children: ReactNode
  title?: string
  subtitle?: string
  dividerTop?: boolean
})
{
  const { colors, space } = useTheme()

  return (
    <View
      style={{
        gap: space.md,
        paddingTop: dividerTop ? space.md : 0,
        borderTopWidth: dividerTop ? StyleSheet.hairlineWidth : 0,
        borderTopColor: colors.hairline,
      }}
    >
      {title || subtitle ? (
        <View style={{ gap: 4 }}>
          {title ? (
            <Text variant="caption" muted style={{ fontWeight: '600' }}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="caption" muted>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  )
}
