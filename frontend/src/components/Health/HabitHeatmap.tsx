import { useMemo } from 'react'
import { ConsistencyHeatmap } from '../dashboard/ConsistencyHeatmap'
import type { ConsistencyDay } from '../../lib/consistencyHeatmap'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface HabitHeatmapProps
{
  nome: string
  cells: ConsistencyDay[]
  loading?: boolean
}

/** Constância mensal de um hábito - grade compacta */
export function HabitHeatmap({ nome, cells, loading = false }: HabitHeatmapProps)
{
  const hasAny = useMemo(() => cells.some((c) => c.count > 0), [cells])

  if (loading)
  {
    return (
      <p className={`text-[11px] py-1 ${AXEL_TEXT_SECONDARY}`}>Carregando constância…</p>
    )
  }

  if (!hasAny)
  {
    return (
      <p className={`text-[11px] py-0.5 ${AXEL_TEXT_SECONDARY}`}>
        Sem histórico ainda - registre para ver o mapa.
      </p>
    )
  }

  return (
    <ConsistencyHeatmap
      cells={cells}
      tone="health"
      weeks={12}
      label=""
      emptyHint={`Registre ${nome.toLowerCase()} para ver o mapa do mês.`}
      formatTooltip={(day) =>
        `${new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
        })} · ${day.count > 0 ? 'feito' : 'sem registro'}`
      }
      compact
    />
  )
}
