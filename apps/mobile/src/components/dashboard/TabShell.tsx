import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useWorkspace } from '../../layout/useWorkspace'
import { useTheme } from '../../theme/ThemeProvider'

const SHELL_MAX_MOBILE = 480
/** Conteúdo desktop: ~1440px centralizado */
export const DESKTOP_CONTENT_MAX = 1440
export const DESKTOP_GUTTER = 24
export const DESKTOP_PAD_H = 36

/**
 * Container responsivo.
 * Desktop: max 1440px, gutter 24, padding lateral 36.
 */
export function TabShell({ children }: { children: ReactNode })
{
  const { contentMaxWidth, showRail } = useWorkspace()
  const { space } = useTheme()

  return (
    <View
      style={{
        gap: showRail ? DESKTOP_GUTTER : space.xl,
        paddingTop: showRail ? space.lg : space.lg,
        paddingBottom: showRail ? space.xl : space.md,
        paddingHorizontal: showRail ? DESKTOP_PAD_H : space.sm,
        maxWidth: showRail ? DESKTOP_CONTENT_MAX : (contentMaxWidth ?? SHELL_MAX_MOBILE),
        alignSelf: 'center',
        width: '100%',
        flex: showRail ? 1 : undefined,
      }}
    >
      {children}
    </View>
  )
}
