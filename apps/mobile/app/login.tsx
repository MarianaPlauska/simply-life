import { useState } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { Redirect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen } from '../src/ui'
import { AuthHeader } from '../src/components/auth/AuthHeader'
import { LoginForm, type AuthMode } from '../src/components/auth/LoginForm'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'

const SHELL_MAX = 440
const PAD_X = 24

/** Login mobile-only — telas ≥1024px no web são interceptadas pelo DesktopWebRedirect */
export default function LoginScreen()
{
  const { space } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw, height: winH } = useWindowDimensions()
  const userId = useAuthStore((s) => s.userId)
  const [mode, setMode] = useState<AuthMode>('login')

  if (userId) return <Redirect href="/(tabs)" />

  const shellMax = Math.min(vw, SHELL_MAX)
  const contentPad = vw > SHELL_MAX ? Math.max((vw - SHELL_MAX) / 2, 0) : 0
  const minH = Math.max(winH - insets.top, 640)

  const headerTitle = mode === 'login' ? 'Entrar' : 'Criar conta'
  const headerSubtitle =
    mode === 'login' ? 'Use seu email e senha.' : 'Crie sua conta para sincronizar.'

  return (
    <Screen scroll tabBarInset={false} padded={false} style={{ flexGrow: 1, minHeight: minH }}>
      <View
        style={{
          flexGrow: 1,
          width: '100%',
          maxWidth: SHELL_MAX,
          alignSelf: 'center',
          overflow: 'hidden',
          marginHorizontal: contentPad > 0 ? 0 : undefined,
        }}
      >
        <AuthHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          compact={mode === 'register'}
          width={shellMax}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flexGrow: 1,
            paddingHorizontal: PAD_X,
            paddingBottom: Math.max(insets.bottom, space.lg),
          }}
        >
          <LoginForm mode={mode} onModeChange={setMode} showHeading={false} />
        </KeyboardAvoidingView>
      </View>
    </Screen>
  )
}
