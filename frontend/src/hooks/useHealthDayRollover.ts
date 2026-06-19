import { useEffect, useRef } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { localTodayIso } from '../lib/healthDayBoundary'

/** Recarrega hábitos e humor quando a data local muda (app aberto à meia-noite). */
export function useHealthDayRollover(): void
{
  const dayRef = useRef(localTodayIso())
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchHumorResumo = useTaskStore((s) => s.fetchHumorResumo)

  useEffect(() =>
  {
    const check = () =>
    {
      const today = localTodayIso()
      if (today === dayRef.current)
      {
        return
      }
      dayRef.current = today
      void fetchHabitos()
      void fetchMedicamentos()
      void fetchHumorResumo()
    }

    const intervalId = window.setInterval(check, 60_000)
    const onVisible = () =>
    {
      if (document.visibilityState === 'visible')
      {
        check()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () =>
    {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchHabitos, fetchMedicamentos, fetchHumorResumo])
}
