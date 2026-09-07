import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const KEY = 'simply-life-mood-prompt-skip'

export async function loadMoodPromptSkipIso(): Promise<string | null>
{
  try
  {
    if (Platform.OS === 'web')
    {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    }
    return await SecureStore.getItemAsync(KEY)
  }
  catch
  {
    return null
  }
}

export async function saveMoodPromptSkipIso(iso: string): Promise<void>
{
  try
  {
    if (Platform.OS === 'web')
    {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, iso)
      return
    }
    await SecureStore.setItemAsync(KEY, iso)
  }
  catch
  {
    /* ignore */
  }
}
