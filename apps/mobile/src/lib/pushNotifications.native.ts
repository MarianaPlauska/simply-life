import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { CadenceNotice, NotifyCadence } from '@simply-life/shared'

const AXEL_CATEGORY = 'axel-actions'

/**
 * Canal próprio. O Android congela importância e Não perturbe no primeiro uso,
 * então um id novo vale mais do que editar o canal antigo.
 * HIGH é notificação de app (ícone e texto). Não é alarme do relógio.
 */
const ALERT_CHANNEL = 'sunfy-avisos-2'

function withAlertChannel(trigger: Notifications.NotificationTriggerInput): Notifications.NotificationTriggerInput
{
  if (Platform.OS !== 'android' || !trigger) return trigger
  return { ...trigger, channelId: ALERT_CHANNEL } as Notifications.NotificationTriggerInput
}

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
    name: 'SunFy',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  })
  await Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
    name: 'Avisos do SunFy',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    sound: 'default',
    // Só passa no Não perturbe depois que a pessoa liga o SunFy na tela do sistema.
    bypassDnd: true,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

/** Aviso imediato para a pessoa confirmar que o celular recebeu. */
export async function sendTestAlert(): Promise<boolean>
{
  const granted = await requestNativePushPermission()
  if (!granted) return false
  await setNativeAndroidChannel()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SunFy',
      body: 'Aviso de teste. Ícone e texto, como qualquer app.',
      sound: 'default',
      color: '#E8734A',
    },
    trigger: withAlertChannel({
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    }),
  })
  return true
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
    trigger: withAlertChannel({
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    }),
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
    trigger: withAlertChannel({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: when }),
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
    trigger: withAlertChannel({
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.round(seconds),
    }),
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
      trigger: withAlertChannel({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.at }),
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
    content: {
      title,
      body,
      sticky: true,
      autoDismiss: false,
      data: { url: '/' },
      ...(Platform.OS === 'android' ? { channelId: ALERT_CHANNEL } : {}),
    },
    trigger: null,
  })
}

export async function clearStickyPlan(): Promise<void>
{
  await Notifications.dismissNotificationAsync(STICKY_ID).catch(() => undefined)
}

const TASK_REMINDER_PREFIX = 'axel-lembrete-'

/**
 * Lembrete pedido pela pessoa (Dump, "lembrar mãe às 18h"): uma vez, na hora dita.
 * A hora foi escolhida por ela, então não é adiada; no silêncio (22h às 8h) chega sem som.
 */
export async function scheduleTaskReminder(input: {
  id: string
  at: Date
  title: string
  body: string
  quiet?: boolean
}): Promise<boolean>
{
  if (input.at.getTime() <= Date.now() + 30000) return false
  const granted = await requestNativePushPermission()
  if (!granted) return false
  const identifier = `${TASK_REMINDER_PREFIX}${input.id}`
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined)
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: input.title,
      body: input.body,
      sound: input.quiet ? false : 'default',
      data: { url: `/task/${input.id}` },
    },
    trigger: withAlertChannel({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: input.at }),
  })
  return true
}

export async function cancelTaskReminder(id: string): Promise<void>
{
  await Notifications.cancelScheduledNotificationAsync(`${TASK_REMINDER_PREFIX}${id}`).catch(() => undefined)
}

const BLOCO_PREFIX = 'mundo-bloco-'

export type BlocoReminder = { key: string; at: Date; title: string; body: string; url: string }

/** Meu Mundo: troca todos os avisos dos blocos pelos da lista (o iOS guarda no máximo 64). */
export async function scheduleBlocoReminders(items: BlocoReminder[]): Promise<void>
{
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => [])
  for (const n of all)
  {
    if (n.identifier.startsWith(BLOCO_PREFIX))
    {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined)
    }
  }
  const upcoming = items
    .filter((i) => i.at.getTime() > Date.now() + 30000)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 40)
  if (!upcoming.length) return
  const granted = await requestNativePushPermission()
  if (!granted) return
  for (const i of upcoming)
  {
    await Notifications.scheduleNotificationAsync({
      identifier: `${BLOCO_PREFIX}${i.key}`,
      content: { title: i.title, body: i.body, sound: 'default', data: { url: i.url } },
      trigger: withAlertChannel({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: i.at }),
    }).catch(() => undefined)
  }
}

const CADENCE_PREFIX = 'axel-cadence-'
/** aviso fixo antigo das 16h; sai de quem já tinha agendado */
const OLD_CURIOSITY_ID = 'axel-curiosity-card'

/** Troca os avisos do ritmo escolhido pelos da lista (hoje e amanhã com conteúdo real). */
export async function scheduleCadenceAlerts(cadence: NotifyCadence, notices: CadenceNotice[] = []): Promise<void>
{
  await Notifications.cancelScheduledNotificationAsync(OLD_CURIOSITY_ID).catch(() => undefined)
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => [])
  for (const n of all)
  {
    if (n.identifier.startsWith(CADENCE_PREFIX))
    {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined)
    }
  }
  if (cadence === 'off' || !notices.length) return
  await setNativeAndroidChannel()
  const perm = await Notifications.getPermissionsAsync()
  if (!perm.granted) return
  for (const n of notices)
  {
    if (n.at.getTime() <= Date.now() + 30000) continue
    await Notifications.scheduleNotificationAsync({
      identifier: `${CADENCE_PREFIX}${n.key}`,
      content: {
        title: n.title,
        body: n.body,
        sound: 'default',
        color: '#E8734A',
        data: { url: n.url },
      },
      trigger: withAlertChannel({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at }),
    }).catch(() => undefined)
  }
}
