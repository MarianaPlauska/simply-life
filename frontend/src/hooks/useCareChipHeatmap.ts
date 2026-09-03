import { useEffect, useMemo, useState } from 'react'
import type { CuidadosTab } from '../lib/healthRoute'
import { useTaskStore } from '../store/useTaskStore'
import { fetchHabitHistoricoRows } from '../lib/habitHistoricoQuery'
import {
  buildCareChipCells,
  buildHabitHistoricoDayMap,
  buildMedicationDayMap,
  buildTrainingDayMap,
  careChipEmptyHint,
  careChipLabel,
  habitForCareTab,
} from '../lib/careChipHeatmap'
import type { ConsistencyDay } from '../lib/consistencyHeatmap'

/** Heatmap do chip ativo - alimenta a rail de Saúde no desktop */
export function useCareChipHeatmap(active: CuidadosTab): {
  cells: ConsistencyDay[]
  label: string
  emptyHint: string
  loading: boolean
}
{
  const habitos = useTaskStore((s) => s.habitos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const sessoesTreinoAnalytics = useTaskStore((s) => s.sessoesTreinoAnalytics)
  const fetchSessoesTreinoAnalytics = useTaskStore((s) => s.fetchSessoesTreinoAnalytics)

  const [habitRows, setHabitRows] = useState<{ data: string; concluido: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() =>
  {
    void fetchSessoesTreinoAnalytics(84)
  }, [fetchSessoesTreinoAnalytics])

  useEffect(() =>
  {
    const hab = habitForCareTab(active, habitos)
    if (!hab)
    {
      setHabitRows([])
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () =>
    {
      try
      {
        const data = await fetchHabitHistoricoRows(hab.id, 12)
        if (!cancelled) setHabitRows(data)
      }
      catch
      {
        if (!cancelled) setHabitRows([])
      }
      finally
      {
        if (!cancelled) setLoading(false)
      }
    })()

    return () =>
    {
      cancelled = true
    }
  }, [active, habitos])

  const cells = useMemo(() =>
  {
    if (active === 'academia')
    {
      const map = buildTrainingDayMap(sessoesTreinoAnalytics)
      return buildCareChipCells(active, map)
    }
    if (active === 'medicamentos')
    {
      const map = buildMedicationDayMap(medicamentoTomadas)
      return buildCareChipCells(active, map)
    }
    const map = buildHabitHistoricoDayMap(habitRows)
    return buildCareChipCells(active, map)
  }, [active, habitRows, medicamentoTomadas, sessoesTreinoAnalytics])

  return {
    cells,
    label: careChipLabel(active),
    emptyHint: careChipEmptyHint(active),
    loading,
  }
}
