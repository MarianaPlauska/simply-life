import { useMemo } from 'react'
import type { AcademyHeatmapDay } from '../../../lib/academyAnalytics'
import { ConsistencyHeatmap } from '../ConsistencyHeatmap'
import {
  buildConsistencyCells,
  type ConsistencyDay,
} from '../../../lib/consistencyHeatmap'

interface AcademyHeatmapProps
{
  days: AcademyHeatmapDay[]
  weeks?: number
}

export function AcademyHeatmap({ days, weeks = 12 }: AcademyHeatmapProps)
{
  const cells = useMemo(
    () =>
    {
      const byDate: Record<string, ConsistencyDay> = {}
      for (const d of days)
      {
        byDate[d.date] = { date: d.date, count: d.count, value: d.volume }
      }
      return buildConsistencyCells(byDate, weeks)
    },
    [days, weeks],
  )

  return (
    <ConsistencyHeatmap
      cells={cells}
      tone="health"
      weeks={weeks}
      label="Dias treinados"
      emptyHint="Finalize treinos no Modo Academia para preencher o mapa de constância."
      formatTooltip={(day) =>
        day.count > 0
          ? `${day.date}: ${day.count} sessão(ões) · ${Math.round(day.value)} kg vol.`
          : `${day.date}: sem treino`
      }
    />
  )
}
