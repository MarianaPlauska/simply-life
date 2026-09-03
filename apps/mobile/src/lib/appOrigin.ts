import { Platform } from 'react-native'

/** Origem usada em redirects OAuth / recovery */
export function appOrigin(): string
{
  if (Platform.OS === 'web' && typeof window !== 'undefined')
  {
    return window.location.origin
  }
  return process.env.EXPO_PUBLIC_APP_URL ?? 'https://simply-life.app'
}
