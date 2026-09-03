import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { parseAuthCallbackParams } from '@simply-life/shared'
import { Screen, Text, PrimaryButton } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'

/** Troca o code do Google/Supabase pela sessão */
export default function AuthCallbackScreen()
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const completeSessionFromUrl = useAuthStore((s) => s.completeSessionFromUrl)
  const userId = useAuthStore((s) => s.userId)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  const [error, setError] = useState('')

  useEffect(() =>
  {
    if (typeof window === 'undefined') return
    const params = parseAuthCallbackParams(window.location.href)
    if (params.error)
    {
      setError('Autorização cancelada ou recusada.')
      return
    }
    void completeSessionFromUrl(window.location.href).then((res) =>
    {
      if (res.error) setError(res.error)
    })
  }, [completeSessionFromUrl])

  if (userId && !mfaPending && !error) return <Redirect href="/(tabs)" />
  if (mfaPending) return <Redirect href="/login" />

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md }}>
        {error ? (
          <>
            <Text variant="section">Não foi possível entrar</Text>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              {error}
            </Text>
            <PrimaryButton label="Voltar ao login" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.axel} />
            <Text variant="body" muted>
              Conectando sua conta…
            </Text>
          </>
        )}
      </View>
    </Screen>
  )
}
