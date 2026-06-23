import { useEffect, useRef } from 'react'
import type { AcademyPhase } from './useAcademySession'
import {
  acquireAcademyWakeLock,
  notifyRestComplete,
  releaseAcademyWakeLock,
  resetAcademyTabTitle,
  setRestTabTitle,
} from '../lib/academyRestTimer'

interface UseAcademyRestAlertsOptions
{
  phase: AcademyPhase
  restSecondsLeft: number
  proximoExercicio: string | null
  enabled: boolean
}

// Mantém tela acesa, título da aba e notificação ao fim do descanso

export function useAcademyRestAlerts({
  phase,
  restSecondsLeft,
  proximoExercicio,
  enabled,
}: UseAcademyRestAlertsOptions): void
{
  const prevPhase = useRef<AcademyPhase>('idle')
  const notifiedRef = useRef(false)

  useEffect(() =>
  {
    if (!enabled)
    {
      void releaseAcademyWakeLock()
      resetAcademyTabTitle()
      return
    }

    if (phase === 'rest')
    {
      void acquireAcademyWakeLock()
      if (proximoExercicio)
      {
        setRestTabTitle(restSecondsLeft, proximoExercicio)
      }
    }
    else
    {
      void releaseAcademyWakeLock()
      resetAcademyTabTitle()
      notifiedRef.current = false
    }

    return () =>
    {
      void releaseAcademyWakeLock()
      resetAcademyTabTitle()
    }
  }, [enabled, phase, proximoExercicio, restSecondsLeft])

  useEffect(() =>
  {
    if (!enabled)
    {
      return
    }

    const eraRest = prevPhase.current === 'rest'
    prevPhase.current = phase

    if (eraRest && phase === 'working' && proximoExercicio && !notifiedRef.current)
    {
      notifiedRef.current = true
      void notifyRestComplete(proximoExercicio)
    }
  }, [enabled, phase, proximoExercicio])
}
