import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'

export default function Index()
{
  const userId = useAuthStore((s) => s.userId)
  const mfaPending = useAuthStore((s) => s.mfaPendingFactorId)
  if (!userId || mfaPending) return <Redirect href="/login" />
  return <Redirect href="/(tabs)" />
}
