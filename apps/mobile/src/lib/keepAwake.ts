import { useEffect } from 'react'
import { Platform } from 'react-native'

type WakeLockSentinel = { release: () => Promise<void> }

/** Mantém a tela ligada no treino. Na PWA usa Wake Lock; some se o browser recusar. */
export function useKeepAwake(): void
{
  useEffect(() =>
  {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return

    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () =>
    {
      try
      {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
        }
        const sent = await nav.wakeLock?.request('screen')
        if (!sent) return
        if (cancelled)
        {
          await sent.release()
          return
        }
        lock = sent
      }
      catch
      {
        /* sem permissão ou API ausente */
      }
    }

    void acquire()
    const onVis = () =>
    {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVis)

    return () =>
    {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release()
    }
  }, [])
}
