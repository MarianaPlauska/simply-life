import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useWorkspace } from '../../layout/useWorkspace'
import { useTheme } from '../../theme/ThemeProvider'

/** Teto opcional em layouts centrados (não usado na sidebar desktop). */
export const DESKTOP_CONTENT_MAX = 1360
export const DESKTOP_GUTTER = 20
export const DESKTOP_PAD_H = 28

/**
 * Container responsivo.
 * Celular: largura útil total. Tablet: teto em useWorkspace. Desktop: painel cheio.
 */
export function TabShell({ children }: { children: ReactNode })
{
  const { contentMaxWidth, showRail } = useWorkspace()
  const { space } = useTheme()
  const capped = !showRail && contentMaxWidth != null

  return (
    <View
      style={{
        gap: showRail ? DESKTOP_GUTTER : space.md,
        paddingTop: showRail ? space.md : space.sm,
        paddingBottom: showRail ? space.lg : space.sm,
        paddingHorizontal: showRail ? DESKTOP_PAD_H : space.sm,
        maxWidth: showRail ? undefined : contentMaxWidth,
        alignSelf: showRail || !capped ? 'stretch' : 'center',
        width: '100%',
      }}
    >
      {children}
    </View>
  )
}
