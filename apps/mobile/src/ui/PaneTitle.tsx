import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from './Text'

/**
 * Título de aba interna (Hoje, Feitas, Rotina, Pastas, Prazos...).
 * Hierarquia única: PaneTitle (Fraunces 22/30) › Text "section" (Lexend) › Text "bodyStrong" para rótulos de grupo.
 */
export function PaneTitle({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  /** Botão ou chip alinhado à direita do título */
  action?: ReactNode
  /** Linhas extras de legenda abaixo do subtítulo */
  children?: ReactNode
})
{
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text variant="hero" style={{ fontSize: 22, lineHeight: 30, letterSpacing: -0.25 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
      {action}
    </View>
  )
}
