import { Redirect } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'

export default function Index()
{
  const userId = useAuthStore((s) => s.userId)
  if (!userId) return <Redirect href="/login" />
  return <Redirect href="/(tabs)" />
}
