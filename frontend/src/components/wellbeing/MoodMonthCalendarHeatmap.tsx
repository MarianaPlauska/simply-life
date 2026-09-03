import { useMemo } from 'react'
import type { DiaHumorAgregado } from '../../lib/moodInsights'
import {
  buildCurrentMonthCalendar,
  currentMonthLabel,
  weekdayLabels,
} from '../../lib/moodDistribution'
import { MOOD_HEX, MOODS } from '../../lib/moodConstants'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface MoodMonthCalendarHeatmapProps
{
  agregados: DiaHumorAgregado[]
}

/** Calendário do mês - colunas = dias da semana, linhas = semanas */
export function MoodMonthCalendarHeatmap({ agregados }: MoodMonthCalendarHeatmapProps)
{
  const cells = useMemo(() => buildCurrentMonthCalendar(agregados), [agregados])
  const weeks = Math.ceil(cells.length / 7)
  const monthLabel = currentMonthLabel()

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-[13px] font-medium capitalize ${AXEL_TEXT_PRIMARY}`}>
          {monthLabel}
        </p>
        <p className={`text-[10px] font-mono uppercase ${AXEL_TEXT_SECONDARY}`}>
          Humor por dia
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-0">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdayLabels().map((label) => (
              <span
                key={label}
                className={`text-center text-[9px] font-mono uppercase ${AXEL_TEXT_SECONDARY}`}
              >
                {label}
              </span>
            ))}
          </div>

          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: 'repeat(7, 2rem)',
              gridTemplateRows: `repeat(${weeks}, 2rem)`,
            }}
          >
            {cells.map((cell) =>
            {
              const title = cell.humor
                ? `${new Date(`${cell.date}T12:00:00`).toLocaleDateString('pt-BR')} · ${cell.humor}/5`
                : cell.inMonth
                  ? new Date(`${cell.date}T12:00:00`).toLocaleDateString('pt-BR')
                  : ''
              const bg = cell.humor
                ? MOOD_HEX[cell.humor] ?? 'var(--sl-chrome)'
                : 'var(--sl-chrome)'

              return (
                <div
                  key={cell.date}
                  title={title}
                  className={`rounded-[4px] border transition-transform hover:scale-105 ${
                    cell.inMonth ? 'border-line/50' : 'border-transparent opacity-0 pointer-events-none'
                  }`}
                  style={{
                    backgroundColor: cell.humor ? bg : 'var(--sl-chrome)',
                    opacity: cell.inMonth ? (cell.humor ? 0.92 : 0.35) : 0,
                  }}
                  aria-hidden={!cell.inMonth}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {MOODS.map((m) => (
          <div key={m.value} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: m.hex }} />
            <span className={`text-[10px] ${AXEL_TEXT_SECONDARY}`}>{m.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
