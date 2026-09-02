import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

const AXEL_CATEGORY = 'axel-actions'

function readData(notification: Notifications.Notification): {
  url: string | null
  actionToken: string | null
}
{
  const data = (notification.request.content.data || {}) as Record<string, unknown>
  return {
    url: typeof data.url === 'string' ? data.url : null,
    actionToken: typeof data.actionToken === 'string' ? data.actionToken : null,
  }
}

export async function configureNativePush(): Promise<void>
{
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })

  try
  {
    await Notifications.setNotificationCategoryAsync(AXEL_CATEGORY, [
      {
        identifier: 'done',
        buttonTitle: 'Feito',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Soneca',
        options: { opensAppToForeground: false },
      },
    ])
  }
  catch
  {
    /* categorias opcionais */
  }
}

export async function setNativeAndroidChannel(): Promise<void>
{
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Simply-Life',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  })
}

export async function getNativeExpoPushToken(projectId?: string): Promise<string>
{
  const res = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  )
  return res.data
}

export async function requestNativePushPermission(): Promise<boolean>
{
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted')
  {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  return finalStatus === 'granted'
}

export function addNativePushResponseListener(
  handler: (payload: {
    actionIdentifier: string
    url: string | null
    actionToken: string | null
  }) => void,
): () => void
{
  const sub = Notifications.addNotificationResponseReceivedListener((response) =>
  {
    const extra = readData(response.notification)
    handler({
      actionIdentifier: response.actionIdentifier,
      url: extra.url,
      actionToken: extra.actionToken,
    })
  })
  return () => sub.remove()
}

export async function getLastNativePushResponse(): Promise<{
  actionIdentifier: string
  url: string | null
  actionToken: string | null
} | null>
{
  const last = await Notifications.getLastNotificationResponseAsync()
  if (!last) return null
  const extra = readData(last.notification)
  return {
    actionIdentifier: last.actionIdentifier,
    url: extra.url,
    actionToken: extra.actionToken,
  }
}
