import { useState } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native'
import { Redirect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BREAKPOINT } from '@simply-life/ui-tokens'
import { Screen, Text } from '../src/ui'
import { AuthHeader } from '../src/components/auth/AuthHeader'
import { LoginBrandPanel } from '../src/components/auth/LoginBrandPanel'
import { LoginForm, type AuthMode } from '../src/components/auth/LoginForm'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'

const PAD_X = 22

/** Login - mobile: marca compacta + form; desktop: split-screen */
export default function LoginScreen()
{
  const { colors, space, mode, setMode } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: vw, height: winH } = useWindowDimensions()
  const isDesktop = vw >= BREAKPOINT.desktop
  const userId = useAuthStore((s) => s.userId)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  if (userId && !mfaPending) return <Redirect href="/(tabs)" />

  const minH = Math.max(winH - insets.top, 640)

  const toggleTheme = () =>
  {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
  }

  if (isDesktop)
  {
    return (
      <View style={{ flex: 1, flexDirection: 'row', minHeight: minH, backgroundColor: colors.canvas }}>
        <View style={{ flex: 0.46, minWidth: 360 }}>
          <LoginBrandPanel />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 0.54,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: space.xxl,
            paddingVertical: Math.max(insets.top, space.xl),
            paddingBottom: Math.max(insets.bottom, space.xl),
            backgroundColor: colors.canvas,
          }}
        >
          <View style={{ width: '100%', maxWidth: 420, gap: space.md }}>
            <Pressable
              onPress={toggleTheme}
              accessibilityLabel={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              style={{
                alignSelf: 'flex-end',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            >
              <Ionicons
                name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={colors.axel}
              />
              <Text variant="caption" style={{ fontWeight: '700' }}>
                {mode === 'dark' ? 'Escuro' : 'Claro'}
              </Text>
            </Pressable>
            <View
              style={{
                width: '100%',
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: space.xl,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            >
              <LoginForm mode={authMode} onModeChange={setAuthMode} showHeading />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  // Mobile / tablet < desktop - marca no topo + form full-width
  return (
    <Screen scroll tabBarInset={false} padded={false} style={{ flexGrow: 1, minHeight: minH }}>
      <View
        style={{
          flexGrow: 1,
          width: '100%',
          backgroundColor: colors.canvas,
        }}
      >
        <View style={{ position: 'relative' }}>
          <AuthHeader
            welcomeLabel={authMode === 'login' ? 'Bem-vindo' : 'Olá'}
            compact={authMode === 'register'}
            width={vw}
          />
          <Pressable
            onPress={toggleTheme}
            accessibilityLabel={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            style={{
              position: 'absolute',
              right: 16,
              top: Math.max(insets.top, 8) + 8,
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color="#F2EDE6"
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flexGrow: 1,
            paddingHorizontal: PAD_X,
            paddingTop: space.lg,
            paddingBottom: Math.max(insets.bottom, space.lg),
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            marginTop: -12,
            minHeight: winH * 0.62,
          }}
        >
          <Text variant="caption" muted style={{ marginBottom: space.sm }}>
            {mode === 'dark' ? 'Modo escuro' : 'Modo claro'}
          </Text>
          <LoginForm mode={authMode} onModeChange={setAuthMode} showHeading variant="wave" />
        </KeyboardAvoidingView>
      </View>
    </Screen>
  )
}
