/** Sentry só sobe se houver DSN — Hobby sem chave não quebra o boot */

export function initSentry(): void
{
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || typeof window === 'undefined')
  {
    return
  }

  void import('@sentry/react').then((Sentry) =>
  {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.12,
    })
  }).catch(() =>
  {
    /* pacote ausente no build local */
  })
}
