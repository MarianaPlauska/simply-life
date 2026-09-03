import { ConsistencyHeatmap } from '../dashboard/ConsistencyHeatmap'
import { useCareChipHeatmap } from '../../hooks/useCareChipHeatmap'
import type { CuidadosTab } from '../../lib/healthRoute'
import { AXEL_METRIC_HAIRLINE, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface HealthCareChipHeatmapProps
{
  active: CuidadosTab
}

/** Constância do chip selecionado - rail Saúde */
export function HealthCareChipHeatmap({ active }: HealthCareChipHeatmapProps)
{
  const { cells, label, emptyHint, loading } = useCareChipHeatmap(active)

  return (
    <section className={AXEL_METRIC_HAIRLINE}>
      <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
        Constância
      </p>
      <p className="text-[13px] font-medium text-ink mt-1">
        {label}
      </p>
      {loading ? (
        <p className={`text-[12px] mt-2 ${AXEL_TEXT_SECONDARY}`}>Carregando…</p>
      ) : (
        <div className="mt-2">
          <ConsistencyHeatmap
            cells={cells}
            tone="health"
            weeks={12}
            label=""
            emptyHint={emptyHint}
            formatTooltip={(day) =>
              `${new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
              })} · ${day.count > 0 ? 'registrado' : 'sem registro'}`
            }
            compact
          />
        </div>
      )}
    </section>
  )
}
