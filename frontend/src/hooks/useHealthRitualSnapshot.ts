import { useEffect, useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { buildHealthRitual, type HealthRitualSnapshot } from '../lib/healthRitual'
import {
  buildHealthRitualInputsFromStore,
  mergeHealthRitualInputs,
  persistHealthRitualCache,
  readHealthRitualCacheToday,
} from '../lib/healthRitualCache'

/**
 * Ritual de saúde com cache local - pinta o estado de hoje antes do fetch remoto.
 */
export function useHealthRitualSnapshot(): HealthRitualSnapshot
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const habitos = useTaskStore((s) => s.habitos)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)

  const cachedToday = useMemo(() => readHealthRitualCacheToday(), [])

  const liveInputs = useMemo(
    () => buildHealthRitualInputsFromStore({
      humorHojeCount: humorHojeLista.length,
      habitos,
      medicamentos,
      medicamentoTomadas,
    }),
    [humorHojeLista.length, habitos, medicamentos, medicamentoTomadas],
  )

  const inputs = useMemo(
    () => mergeHealthRitualInputs(liveInputs, cachedToday),
    [liveInputs, cachedToday],
  )

  const snapshot = useMemo(() => buildHealthRitual(inputs), [inputs])

  useEffect(() =>
  {
    persistHealthRitualCache(liveInputs)
  }, [liveInputs])

  return snapshot
}
