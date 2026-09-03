/**
 * Cache offline básico - humor e tarefas em memória + AsyncStorage-like (SecureStore/web).
 * Fase 4: stub pronto para hidratar store remoto.
 */
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const KEY = 'simply-life-offline-v1'

async function readRaw(): Promise<string | null>
{
  if (Platform.OS === 'web')
  {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
  }
  return SecureStore.getItemAsync(KEY)
}

async function writeRaw(value: string): Promise<void>
{
  if (Platform.OS === 'web')
  {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, value)
    return
  }
  await SecureStore.setItemAsync(KEY, value)
}

export type OfflineBundle = {
  updatedAt: string
  humorJson: string
  tasksJson: string
}

export async function loadOfflineBundle(): Promise<OfflineBundle | null>
{
  try
  {
    const raw = await readRaw()
    if (!raw) return null
    return JSON.parse(raw) as OfflineBundle
  }
  catch
  {
    return null
  }
}

export async function saveOfflineBundle(bundle: OfflineBundle): Promise<void>
{
  await writeRaw(JSON.stringify(bundle))
}
