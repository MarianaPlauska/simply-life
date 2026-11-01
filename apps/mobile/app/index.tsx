import { Platform } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'

export default function Index()
{
  const userId = useAuthStore((s) => s.userId)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery'))
  )
  {
    return <Redirect href="/reset-password" />
  }

  if (!userId || mfaPending) return <Redirect href="/login" />
  return <Redirect href="/(tabs)" />
}
