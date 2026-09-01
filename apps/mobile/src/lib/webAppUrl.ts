/**
 * URL do app web (Vite) — destino do gate desktop no Expo web.
 * Produção: https://simply-life.app
 */
export function getWebAppUrl(): string
{
  const fromEnv = (process.env.EXPO_PUBLIC_WEB_APP_URL || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv

  if (__DEV__ && typeof window !== 'undefined' && window.location?.hostname)
  {
    // Em local, o Vite costuma rodar na 5173 na mesma máquina
    return `${window.location.protocol}//${window.location.hostname}:5173`
  }

  return 'https://simply-life.app'
}
