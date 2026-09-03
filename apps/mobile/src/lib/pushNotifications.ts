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
