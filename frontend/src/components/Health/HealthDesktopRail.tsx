import type { CuidadosTab } from '../../lib/healthRoute'
import { HealthCareChipHeatmap } from './HealthCareChipHeatmap'
import { HealthWeekSummary } from './HealthWeekSummary'
import { AXEL_DESKTOP_RAIL, AXEL_METRIC_HAIRLINE, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import { moodLabel } from '../../lib/moodConstants'
import { useTaskStore } from '../../store/useTaskStore'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { AxelListRow } from '../ui/AxelListRow'

function formatDay(iso: string): string
{
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
}

/** Histórico e constância - workspace lg+ */
export function HealthDesktopRail({
  activeTab,
  onOpenStats,
}: {
  activeTab: CuidadosTab
  onOpenStats?: () => void
})
{
  const navigate = useNavigate()
  const humorMes = useTaskStore((s) => s.humorMes)
  const entradasRecentes = useTaskStore((s) => s.entradasRecentes)
  const fetchHumorMes = useTaskStore((s) => s.fetchHumorMes)
  const fetchHumorSemana = useTaskStore((s) => s.fetchHumorSemana)
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)

  useEffect(() =>
  {
    void fetchHumorMes()
    void fetchHumorSemana()
    void fetchEntradasRecentes(20)
  }, [fetchHumorMes, fetchHumorSemana, fetchEntradasRecentes])

  const rows = useMemo(() =>
  {
    const items: { key: string; sort: string; title: string; subtitle: string }[] = []

    for (const r of humorMes)
    {
      items.push({
        key: `h-${r.id}`,
        sort: r.created_at ?? `${r.data}T00:00:00`,
        title: moodLabel(r.humor),
        subtitle: formatDay(r.data),
      })
    }

    for (const e of entradasRecentes)
    {
      if (e.prompt_usado?.match(/^Humor:/i)) continue
      items.push({
        key: `j-${e.id}`,
        sort: e.data,
        title: e.conteudo.trim() || 'Nota',
        subtitle: formatDay(e.data),
      })
    }

    return items.sort((a, b) => b.sort.localeCompare(a.sort)).slice(0, 6)
  }, [humorMes, entradasRecentes])

  return (
    <aside className={AXEL_DESKTOP_RAIL} aria-label="Contexto de saúde">
      <HealthCareChipHeatmap active={activeTab} />
      {onOpenStats && (
        <button
          type="button"
          onClick={onOpenStats}
          className="text-[12px] font-medium text-health hover:underline min-h-11 text-left"
        >
          Ver estatísticas completas
        </button>
      )}
      <HealthWeekSummary />
      <section className={AXEL_METRIC_HAIRLINE}>
        <p className="sl-section-label">
          Recente
        </p>
        <p className={`mt-1.5 text-[15px] font-medium ${AXEL_TEXT_PRIMARY}`}>
          Histórico
        </p>
        {rows.length === 0 ? (
          <p className={`text-[12px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
            {EMPTY_COPY.healthHistory}
          </p>
        ) : (
          <ul className="mt-2">
            {rows.map((row) => (
              <AxelListRow
                key={row.key}
                title={row.title}
                subtitle={row.subtitle}
                onClick={() => navigate('/saude#diario')}
              />
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
