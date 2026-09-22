/** Volta na pilha se existir tela anterior; senão troca para o fallback. */
export function safeBack(
  router: {
    canGoBack?: () => boolean
    back: () => void
    replace: (href: never) => void
  },
  fallback: string,
): void
{
  if (router.canGoBack?.())
  {
    router.back()
    return
  }
  router.replace(fallback as never)
}
