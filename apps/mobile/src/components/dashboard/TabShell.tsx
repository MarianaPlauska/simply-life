import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useWorkspace } from '../../layout/useWorkspace'
import { useTheme } from '../../theme/ThemeProvider'

const SHELL_MAX_MOBILE = 480
/** Teto opcional em layouts centrados (não usado na sidebar desktop). */
export const DESKTOP_CONTENT_MAX = 1360
export const DESKTOP_GUTTER = 20
export const DESKTOP_PAD_H = 28

/**
 * Container responsivo.
 * Celular: 480. Desktop com sidebar: largura total do painel principal.
 */
export function TabShell({ children }: { children: ReactNode })
{
  const { contentMaxWidth, showRail } = useWorkspace()
  const { space } = useTheme()

  return (
    <View
      style={{
        gap: showRail ? DESKTOP_GUTTER : space.md,
        paddingTop: showRail ? space.md : space.sm,
        paddingBottom: showRail ? space.lg : space.sm,
        paddingHorizontal: showRail ? DESKTOP_PAD_H : space.sm,
        maxWidth: showRail ? undefined : (contentMaxWidth ?? SHELL_MAX_MOBILE),
        alignSelf: showRail ? 'stretch' : 'center',
        width: '100%',
      }}
    >
      {children}
    </View>
  )
}
