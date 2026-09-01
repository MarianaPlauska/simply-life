import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const KEY = 'auth_remember_email'

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

async function clearRaw(): Promise<void>
{
  if (Platform.OS === 'web')
  {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
    return
  }
  await SecureStore.deleteItemAsync(KEY)
}

export async function loadRememberedEmail(): Promise<string | null>
{
  try
  {
    return await readRaw()
  }
  catch
  {
    return null
  }
}

export async function saveRememberedEmail(email: string | null): Promise<void>
{
  try
  {
    const trimmed = email?.trim() ?? ''
    if (!trimmed)
    {
      await clearRaw()
      return
    }
    await writeRaw(trimmed)
  }
  catch
  {
    /* storage opcional */
  }
}
