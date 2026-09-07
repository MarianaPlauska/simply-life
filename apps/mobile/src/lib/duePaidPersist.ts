import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const KEY = 'simply-life-due-paid-v1'

function normalize(raw: unknown): Record<string, true>
{
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, true> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>))
  {
    if (v) out[k] = true
  }
  return out
}

export async function loadDuePaid(): Promise<Record<string, true>>
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      const raw = localStorage.getItem(KEY)
      return raw ? normalize(JSON.parse(raw)) : {}
    }
    const raw = await SecureStore.getItemAsync(KEY)
    return raw ? normalize(JSON.parse(raw)) : {}
  }
  catch
  {
    return {}
  }
}

export async function saveDuePaid(keys: Record<string, true>): Promise<void>
{
  const payload = JSON.stringify(keys)
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
  {
    localStorage.setItem(KEY, payload)
    return
  }
  await SecureStore.setItemAsync(KEY, payload)
}
