import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useWorkspace } from '../../layout/useWorkspace'
import { useTheme } from '../../theme/ThemeProvider'

const SHELL_MAX = 480

/**
 * Container responsivo.
 * Desktop: painel SoftTech — ocupa a largura ao lado da rail, padding generoso, gap de sections.
 */
export function TabShell({ children }: { children: ReactNode })
{
  const { contentMaxWidth, showRail } = useWorkspace()
  const { space } = useTheme()

  return (
    <View
      style={{
        gap: showRail ? space.xl : space.md + 4,
        paddingTop: showRail ? space.xl : space.sm,
        paddingBottom: showRail ? space.xl : undefined,
        paddingHorizontal: showRail ? space.xl + 8 : 2,
        maxWidth: showRail ? undefined : (contentMaxWidth ?? SHELL_MAX),
        alignSelf: showRail ? 'stretch' : 'center',
        width: '100%',
        flex: showRail ? 1 : undefined,
      }}
    >
      {children}
    </View>
  )
}
