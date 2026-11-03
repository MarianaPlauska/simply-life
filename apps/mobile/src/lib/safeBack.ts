import { Platform } from 'react-native'

type BackRouter = {
  canGoBack?: () => boolean
  back: () => void
  replace: (href: never) => void
}

function currentPath(): string
{
  if (typeof window === 'undefined') return ''
  return window.location.pathname + window.location.search
}

/**
 * Volta de verdade. No navegador o back() do roteador muitas vezes não muda a página,
 * então se a URL continuar igual a gente abre o destino de reserva.
 */
export function safeBack(router: BackRouter, fallback: string): void
{
  const before = currentPath()
  const leave = () =>
  {
    if (currentPath() === before) router.replace(fallback as never)
  }

  if (router.canGoBack?.())
  {
    router.back()
    if (Platform.OS === 'web') setTimeout(leave, 80)
    return
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history.length > 1)
  {
    window.history.back()
    setTimeout(leave, 80)
    return
  }

  router.replace(fallback as never)
}
