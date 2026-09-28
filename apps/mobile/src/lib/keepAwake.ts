import { useEffect } from 'react'
import { Platform } from 'react-native'

type WakeLockSentinel = { release: () => Promise<void> }

/** Mantém a tela ligada no treino. Nativo: expo-keep-awake. PWA: Wake Lock; some se o browser recusar. */
export function useKeepAwake(): void
{
  useEffect(() =>
  {
    if (Platform.OS !== 'web')
    {
      // Nativo: expo-keep-awake vem com o expo; se faltar no build, segue sem travar a tela
      const tag = `sl-keep-awake-${Math.random().toString(36).slice(2, 8)}`
      let mod: { activateKeepAwakeAsync?: (t?: string) => Promise<void>; deactivateKeepAwake?: (t?: string) => Promise<void> } | null = null
      try
      {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        mod = require('expo-keep-awake')
        void mod?.activateKeepAwakeAsync?.(tag).catch(() => undefined)
      }
      catch
      {
        mod = null
      }
      return () =>
      {
        try
        {
          void mod?.deactivateKeepAwake?.(tag)?.catch?.(() => undefined)
        }
        catch
        {
          /* ignore */
        }
      }
    }
    if (typeof navigator === 'undefined') return

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
