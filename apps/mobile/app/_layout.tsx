import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope'
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces'
import { COLOR_DARK } from '@simply-life/ui-tokens'
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { usePushBootstrap } from '../src/hooks/usePushBootstrap'

function RootNavigator()
{
  const { mode, colors } = useTheme()
  const hydrate = useAuthStore((s) => s.hydrate)
  const ready = useAuthStore((s) => s.ready)
  usePushBootstrap()

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  if (!ready)
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="task/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
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

  if (!fontsLoaded)
  {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR_DARK.canvas }}>
        <ActivityIndicator color={COLOR_DARK.axel} />
      </View>
    )
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  )
}
