import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) =>
  {
    if (Platform.OS === 'web')
    {
      return Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) =>
  {
    if (Platform.OS === 'web')
    {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
      return Promise.resolve()
    }
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) =>
  {
    if (Platform.OS === 'web')
    {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
      return Promise.resolve()
    }
    return SecureStore.deleteItemAsync(key)
  },
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured = Boolean(url && anon)

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anon || 'placeholder',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  },
)
