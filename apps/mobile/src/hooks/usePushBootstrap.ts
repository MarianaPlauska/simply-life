import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import {
  handlePushActionAsync,
  registerExpoPushAsync,
} from '../lib/pushRegister'
import { mapPushUrlToRoute } from '../lib/pushDeepLink'
import {
  addNativePushResponseListener,
  getLastNativePushResponse,
} from '../lib/pushNotifications'

function navigateFromPush(
  router: ReturnType<typeof useRouter>,
  userId: string | null,
  url: string | null,
)
{
  const route = url ? mapPushUrlToRoute(url) : null
  if (route && userId) router.push(route as never)
}

/** Registra token Expo após login e navega a partir do payload `url`. */
export function usePushBootstrap(): void
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const router = useRouter()
  const registeredFor = useRef<string | null>(null)

  useEffect(() =>
  {
    if (!userId || isGuest || Platform.OS === 'web') return
    if (registeredFor.current === userId) return
    registeredFor.current = userId
    void registerExpoPushAsync()
  }, [userId, isGuest])

  useEffect(() =>
  {
    if (Platform.OS === 'web') return

    void getLastNativePushResponse().then((last) =>
    {
      if (last && userId) navigateFromPush(router, userId, last.url)
    })

    return addNativePushResponseListener((payload) =>
    {
      if ((payload.actionIdentifier === 'done' || payload.actionIdentifier === 'snooze')
        && payload.actionToken)
      {
        void handlePushActionAsync(payload.actionIdentifier, payload.actionToken)
        return
      }
      navigateFromPush(router, userId, payload.url)
    })
  }, [router, userId])
}
