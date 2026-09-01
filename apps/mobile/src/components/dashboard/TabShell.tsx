import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useWorkspace } from '../../layout/useWorkspace'
import { useTheme } from '../../theme/ThemeProvider'

const SHELL_MAX = 480

/** Container responsivo — mobile-first, centralizado na web */
export function TabShell({ children }: { children: ReactNode })
{
  const { contentMaxWidth } = useWorkspace()
  const { space } = useTheme()

  return (
    <View
      style={{
        gap: space.md + 4,
        paddingTop: space.sm,
        paddingHorizontal: 2,
        maxWidth: contentMaxWidth ?? SHELL_MAX,
        alignSelf: 'center',
        width: '100%',
      }}
    >
      {children}
    </View>
  )
}
