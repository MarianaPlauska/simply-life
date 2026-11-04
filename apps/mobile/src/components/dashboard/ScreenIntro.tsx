import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { SyncHint } from '../SyncHint'
import { useWebDesk } from './web/webBox'

/**
 * Título de tela. Celular: só o título grande (como nos apps nativos), com ícones à direita.
 * A frase explicativa aparece só no computador.
 */
export function ScreenIntro({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  /** ícones de ação na linha do título */
  right?: ReactNode
})
{
  const { space } = useTheme()
  const desk = useWebDesk()

  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 }}>
        <Text variant="section" numberOfLines={1} style={{ flex: 1, fontSize: 28, lineHeight: 34 }}>
          {title}
        </Text>
        {right}
      </View>
      {subtitle && desk ? (
        <Text variant="caption" muted style={{ maxWidth: 600 }}>
          {subtitle}
        </Text>
      ) : null}
      <SyncHint />
    </View>
  )
}
