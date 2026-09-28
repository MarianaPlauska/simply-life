import { useEffect } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { useWorkoutStore } from '../../../store/workoutStore'

/** Carrega o local e sincroniza (logado) ao abrir qualquer tela do treino. */
export function useWorkoutHydrate(): boolean
{
  const isGuest = useAuthStore((s) => s.isGuest)
  const hydrate = useWorkoutStore((s) => s.hydrate)
  const hydrated = useWorkoutStore((s) => s.hydrated)
  useEffect(() =>
  {
    void hydrate(isGuest)
  }, [hydrate, isGuest])
  return hydrated
}
