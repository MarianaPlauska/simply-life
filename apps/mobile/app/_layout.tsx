import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope'
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces'
import { colorsFor } from '@simply-life/ui-tokens'
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { pingPresence } from '../src/lib/presence'
import { useGamificationStore } from '../src/store/gamificationStore'
import { useActivityStore } from '../src/store/activityStore'
import { usePrefsStore } from '../src/store/prefsStore'
import { readColorSchemeSync } from '../src/lib/sync/prefs'
import { CelebrationOverlay } from '../src/components/dashboard/CelebrationOverlay'
import { TaskEvolveSheet } from '../src/components/kanban/TaskEvolveSheet'
import { usePushBootstrap } from '../src/hooks/usePushBootstrap'

function RootNavigator()
{
  const { mode, colors } = useTheme()
  const hydrate = useAuthStore((s) => s.hydrate)
  const ready = useAuthStore((s) => s.ready)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  const hydrateXp = useGamificationStore((s) => s.hydrate)
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const hydrateActivity = useActivityStore((s) => s.hydrate)
  const markOpen = useActivityStore((s) => s.markOpen)
  usePushBootstrap()

  useEffect(() =>
  {
    void hydrate()
    hydrateXp()
    hydrateActivity()
  }, [hydrate, hydrateXp, hydrateActivity])

  useEffect(() =>
  {
    if (!userId) return
    markOpen()
  }, [userId, markOpen])

  useEffect(() =>
  {
    if (!userId || isGuest) return
    void pingPresence()
    const id = setInterval(() => void pingPresence(), 45_000)
    return () => clearInterval(id)
  }, [userId, isGuest])

  if (!ready || !prefsLoaded)
  {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.axel} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="tokens-preview" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="google-callback" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="join/[code]" />
        <Stack.Screen name="parceiro/[code]" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="configuracoes" />
        <Stack.Screen name="axel/historico" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="preferencias" />
        <Stack.Screen
          name="personalizar-inicio"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="inteligencia" />
        <Stack.Screen name="relatorios" />
        <Stack.Screen name="calendario" />
        <Stack.Screen name="anotacoes" />
        <Stack.Screen name="foco" />
        <Stack.Screen name="ofensiva" />
        <Stack.Screen name="tcc/thought-record" />
        <Stack.Screen name="tcc/behavioral-activation" />
        <Stack.Screen name="tcc/gradual-exposure" />
        <Stack.Screen
          name="task/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="pasta/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
      <CelebrationOverlay />
      <TaskEvolveSheet />
    </>
  )
}

export default function RootLayout()
{
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Fraunces_500Medium,
  })

  const splash = colorsFor(readColorSchemeSync() ?? 'light')

  if (!fontsLoaded)
  {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: splash.canvas }}>
        <ActivityIndicator color={splash.axel} />
      </View>
    )
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  )
}
