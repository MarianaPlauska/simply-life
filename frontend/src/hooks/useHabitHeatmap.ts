import { useEffect, useMemo, useState } from 'react'
import { buildConsistencyCells, type ConsistencyDay } from '../lib/consistencyHeatmap'
import { buildHabitHistoricoDayMap } from '../lib/careChipHeatmap'
import { fetchHabitHistoricoRows } from '../lib/habitHistoricoQuery'

/** Heatmap mensal de um hábito individual */
export function useHabitHeatmap(habitoId: number, weeks = 12): {
  cells: ConsistencyDay[]
  loading: boolean
}
{
  const [rows, setRows] = useState<{ data: string; concluido: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() =>
  {
    let cancelled = false
    setLoading(true)

    void (async () =>
    {
      try
      {
        const data = await fetchHabitHistoricoRows(habitoId, weeks)
        if (!cancelled) setRows(data)
      }
      catch
      {
        if (!cancelled) setRows([])
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
  }, [habitoId, weeks])

  const cells = useMemo(() =>
  {
    const map = buildHabitHistoricoDayMap(rows)
    return buildConsistencyCells(map, weeks, new Date())
  }, [rows, weeks])

  return { cells, loading }
}
