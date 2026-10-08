import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useWorkspace } from '../../layout/useWorkspace'
import { useTheme } from '../../theme/ThemeProvider'

/** Conteúdo no computador: ocupa a largura (a grade da página divide o espaço); teto só para telas enormes. */
export const DESKTOP_CONTENT_MAX = 2000
export const DESKTOP_GUTTER = 20
/** margem lateral e espaço entre blocos no computador */
export const DESKTOP_PAD_H = 32

/**
 * Container responsivo.
 * Celular: largura útil total. Tablet: teto em useWorkspace. Desktop: ocupa a largura, alinhado à esquerda (site, não coluna de celular).
 */
export function TabShell({ children }: { children: ReactNode })
{
  const { contentMaxWidth, showRail } = useWorkspace()
  const { space } = useTheme()
  const capped = !showRail && contentMaxWidth != null

  return (
    <View
      style={{
        gap: showRail ? 16 : space.xl,
        paddingTop: showRail ? 24 : space.md,
        paddingBottom: showRail ? space.lg : space.md,
        // Celular: o gutter de 20 já vem do Screen
        paddingHorizontal: showRail ? DESKTOP_PAD_H : 0,
        maxWidth: showRail ? DESKTOP_CONTENT_MAX : contentMaxWidth,
        alignSelf: capped ? 'center' : 'stretch',
        width: '100%',
      }}
    >
      {children}
    </View>
  )
}
