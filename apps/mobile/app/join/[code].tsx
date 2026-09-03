import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { acceptFriendInvite } from '@simply-life/shared'
import { Screen, Text, PrimaryButton } from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useAuthStore } from '../../src/store/authStore'
import { supabase } from '../../src/lib/supabase'

export default function JoinFriendScreen()
{
  const { space } = useTheme()
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() =>
  {
    if (!code || !userId || isGuest || mfaPending) return
    let cancelled = false
    setStatus('loading')
    void acceptFriendInvite(supabase as never, String(code)).then((result) =>
    {
      if (cancelled) return
      setMessage(result.message)
      setStatus(result.ok ? 'done' : 'error')
      if (result.ok)
      {
        setTimeout(() => router.replace('/(tabs)'), 1200)
      }
    })
    return () =>
    {
      cancelled = true
    }
  }, [code, userId, isGuest, mfaPending, router])

  const loggedIn = Boolean(userId) && !isGuest && !mfaPending

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: space.md,
          paddingHorizontal: space.lg,
        }}
      >
        <Text variant="hero" style={{ textAlign: 'center' }}>
          Convite ao Círculo
        </Text>
        {!loggedIn ? (
          <>
            <Text variant="body" muted style={{ textAlign: 'center' }}>
              Faça login ou crie sua conta para aceitar o convite {String(code || '').toUpperCase()}.
            </Text>
            <PrimaryButton
              label="Entrar no Simply-Life"
              onPress={() => router.replace('/login')}
            />
          </>
        ) : status === 'loading' || status === 'idle' ? (
          <>
            <ActivityIndicator />
            <Text variant="body" muted>
              Conectando ao Círculo…
            </Text>
          </>
        ) : (
          <>
            <Text variant="body" style={{ textAlign: 'center' }}>
              {message}
            </Text>
            <PrimaryButton label="Ir ao início" onPress={() => router.replace('/(tabs)')} />
          </>
        )}
      </View>
    </Screen>
  )
}
