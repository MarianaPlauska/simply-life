import { useCallback, useEffect } from 'react'
import { AppState } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { usePrefsStore } from '../store/prefsStore'

/** Hidrata humor/tarefas/gastos no login e ao voltar ao app. */
export function useDataSync(): void
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const reset = useDataStore((s) => s.reset)
  const hydratePrefs = usePrefsStore((s) => s.hydrate)
  const resetPrefs = usePrefsStore((s) => s.reset)

  const sync = useCallback(() =>
  {
    if (!userId)
    {
      reset()
      resetPrefs()
      return
    }
    void refreshAll({ isGuest })
    void hydratePrefs()
  }, [userId, isGuest, refreshAll, reset, hydratePrefs, resetPrefs])

  useEffect(() =>
  {
    sync()
  }, [sync])

  useEffect(() =>
  {
    const sub = AppState.addEventListener('change', (state) =>
    {
      if (state === 'active' && userId)
      {
        void refreshAll({ isGuest })
      }
    })
    return () => sub.remove()
  }, [userId, isGuest, refreshAll])
}
