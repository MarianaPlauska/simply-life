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

const EVENING_ID = 'axel-evening-plan'
const MORNING_ID = 'axel-morning-first-step'

/** Lembrete diário local do ritual da noite (não depende de servidor). */
export async function scheduleEveningPlanReminder(hour: number, minute: number): Promise<boolean>
{
  const granted = await requestNativePushPermission()
  if (!granted) return false
  await Notifications.cancelScheduledNotificationAsync(EVENING_ID).catch(() => undefined)
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ID,
    content: {
      title: 'Planejar amanhã, com calma',
      body: 'Uns 3 minutos para o Axel deixar o seu amanhã do tamanho certo.',
      data: { url: '/planejar-amanha' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
  return true
}

export async function cancelEveningPlanReminder(): Promise<void>
{
  await Notifications.cancelScheduledNotificationAsync(EVENING_ID).catch(() => undefined)
}

/** Uma vez, na manhã do dia planejado: só o primeiro passo, sem lista. */
export async function scheduleMorningFirstStep(when: Date, firstStep: string): Promise<void>
{
  if (when.getTime() <= Date.now()) return
  const granted = await requestNativePushPermission()
  if (!granted) return
  await Notifications.cancelScheduledNotificationAsync(MORNING_ID).catch(() => undefined)
  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_ID,
    content: {
      title: 'Seu primeiro passo de hoje',
      body: firstStep,
      data: { url: '/' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  })
}

const FOCUS_END_ID = 'axel-focus-end'

/** Aviso de fim do timer mesmo com o app em segundo plano. */
export async function scheduleFocusEnd(seconds: number, taskTitle: string | null): Promise<void>
{
  await Notifications.cancelScheduledNotificationAsync(FOCUS_END_ID).catch(() => undefined)
  if (seconds < 5) return
  const perm = await Notifications.getPermissionsAsync()
  if (!perm.granted) return
  await Notifications.scheduleNotificationAsync({
    identifier: FOCUS_END_ID,
    content: {
      title: 'O tempo do foco acabou',
      body: taskTitle ? `${taskTitle}: pode parar aqui ou continuar mais um pouco.` : 'Pode parar aqui ou continuar mais um pouco.',
      data: { url: '/foco' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(seconds) },
  })
}

export async function cancelFocusEnd(): Promise<void>
{
  await Notifications.cancelScheduledNotificationAsync(FOCUS_END_ID).catch(() => undefined)
}

const TRANSITION_PREFIX = 'axel-trans-'
const STICKY_ID = 'axel-sticky-plan'

/** Avisos antes das próximas atividades de hoje (substitui os anteriores). */
export async function scheduleTransitionAlerts(alerts: { at: Date; title: string; body: string }[]): Promise<void>
{
  const perm = await Notifications.getPermissionsAsync()
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => [])
  await Promise.all(all
    .filter((n) => n.identifier.startsWith(TRANSITION_PREFIX))
    .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined)))
  if (!perm.granted) return
  const now = Date.now()
  let i = 0
  for (const a of alerts)
  {
    if (a.at.getTime() <= now + 30000) continue
    await Notifications.scheduleNotificationAsync({
      identifier: `${TRANSITION_PREFIX}${i}`,
      content: { title: a.title, body: a.body, data: { url: '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.at },
    })
    i += 1
    if (i >= 20) break
  }
}

/** Android: notificação fixa "Agora · Depois" (alternativa grátis ao widget no Expo Go). */
export async function showStickyPlan(title: string, body: string): Promise<void>
{
  if (Platform.OS !== 'android') return
  const perm = await Notifications.getPermissionsAsync()
  if (!perm.granted) return
  await Notifications.scheduleNotificationAsync({
    identifier: STICKY_ID,
    content: { title, body, sticky: true, autoDismiss: false, data: { url: '/' } },
    trigger: null,
  })
}

export async function clearStickyPlan(): Promise<void>
{
  await Notifications.dismissNotificationAsync(STICKY_ID).catch(() => undefined)
}
