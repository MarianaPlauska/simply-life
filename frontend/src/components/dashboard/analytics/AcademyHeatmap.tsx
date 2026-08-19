import { useMemo } from 'react'
import type { AcademyHeatmapDay } from '../../../lib/academyAnalytics'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

interface AcademyHeatmapProps
{
  days: AcademyHeatmapDay[]
  weeks?: number
}

export function AcademyHeatmap({ days, weeks = 12 }: AcademyHeatmapProps)
{
  const grid = useMemo(() =>
  {
    const map = new Map(days.map((d) => [d.date, d]))
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const totalDays = weeks * 7
    const cells: { date: string; count: number; volume: number }[] = []

    for (let i = totalDays - 1; i >= 0; i--)
    {
      const d = new Date(end)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const hit = map.get(iso)
      cells.push({
        date: iso,
        count: hit?.count ?? 0,
        volume: hit?.volume ?? 0,
      })
    }
    return cells
  }, [days, weeks])

  const maxCount = Math.max(...grid.map((c) => c.count), 1)

  if (days.length === 0)
  {
    return (
      <p className={`text-[12px] py-2 ${AXEL_TEXT_SECONDARY}`}>
        Finalize treinos no Modo Academia para preencher o mapa de constância.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1" role="img" aria-label="Mapa de dias treinados">
        {grid.map((cell) =>
        {
          const intensity = cell.count / maxCount
          return (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} sessão(ões) · ${Math.round(cell.volume)} kg vol.`}
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] border border-line/40 shrink-0"
              style={{
                backgroundColor: cell.count > 0
                  ? `color-mix(in srgb, var(--sl-accent) ${Math.round(25 + intensity * 65)}%, transparent)`
                  : 'var(--sl-chrome)',
              }}
            />
          )
        })}
      </div>
      <p className={`text-[11px] font-mono ${AXEL_TEXT_SECONDARY}`}>
        Últimas {weeks} semanas — intensidade = sessões no dia
      </p>
    </div>
  )
}
