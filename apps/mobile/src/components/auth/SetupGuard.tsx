import type { ReactNode } from 'react'
import { Redirect, usePathname } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '../../store/authStore'
import { usePrefsStore } from '../../store/prefsStore'
import { useTheme } from '../../theme/ThemeProvider'

/** Envia para /setup (boas-vindas) até ser concluído. Convidado também passa por elas. */
export function SetupGuard({ children }: { children: ReactNode })
{
  const { colors } = useTheme()
  const pathname = usePathname()
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  const loaded = usePrefsStore((s) => s.loaded)
  const setupAt = usePrefsStore((s) => s.prefs.setup_completed_at)

  if (mfaPending) return <Redirect href="/login" />

  if (!loaded)
  {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.canvas,
        }}
      >
        <ActivityIndicator color={colors.axel} />
      </View>
    )
  }

  if (loaded && !setupAt && pathname !== '/setup')
  {
    return <Redirect href="/setup" />
  }

  return <>{children}</>
}
