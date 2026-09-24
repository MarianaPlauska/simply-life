/** Stub web - Expo Push só existe no iOS/Android. */
export async function requestNativePushPermission(): Promise<boolean>
{
  return false
}

export async function configureNativePush(): Promise<void>
{
}

export async function getNativeExpoPushToken(projectId?: string): Promise<string>
{
  throw new Error('Push nativo indisponível no web')
}

export function addNativePushResponseListener(
  _handler: (payload: {
    actionIdentifier: string
    url: string | null
    actionToken: string | null
  }) => void,
): () => void
{
  return () => undefined
}

export async function getLastNativePushResponse(): Promise<{
  actionIdentifier: string
  url: string | null
  actionToken: string | null
} | null>
{
  return null
}

export async function setNativeAndroidChannel(): Promise<void>
{
}

/** Web: sem notificação local agendada (o card da noite aparece na Home). */
export async function scheduleEveningPlanReminder(_hour: number, _minute: number): Promise<boolean>
{
  return false
}

export async function cancelEveningPlanReminder(): Promise<void>
{
}

export async function scheduleMorningFirstStep(_when: Date, _firstStep: string): Promise<void>
{
}

export async function scheduleFocusEnd(_seconds: number, _taskTitle: string | null): Promise<void>
{
}

export async function cancelFocusEnd(): Promise<void>
{
}

export async function scheduleTransitionAlerts(_alerts: { at: Date; title: string; body: string }[]): Promise<void>
{
}

export async function showStickyPlan(_title: string, _body: string): Promise<void>
{
}

export async function clearStickyPlan(): Promise<void>
{
}
