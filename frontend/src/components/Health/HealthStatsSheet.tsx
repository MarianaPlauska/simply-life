import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flame, Trophy, X } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import { DonutChart, type DonutSlice } from '../ui/DonutChart'
import {
  AXEL_METRIC_HAIRLINE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  MODULE_HERO,
} from '../../constants/axelSurfaces'

const RITUAL_COLORS: Record<string, string> = {
  humor: '#9B8BB8',
  agua: '#5B9BD5',
  medicamentos: '#7FA37A',
}

interface HealthStatsSheetProps
{
  open: boolean
  onClose: () => void
}

function formatDay(key: string): string
{
  return new Date(`${key.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
}

/** Estatísticas de saúde - donut do ritual + recordes de streak */
export function HealthStatsSheet({ open, onClose }: HealthStatsSheetProps)
{
  const snapshot = useHealthRitualSnapshot()
  const habitosStreaks = useTaskStore((s) => s.habitosStreaks)
  const fetchHabitosStreaks = useTaskStore((s) => s.fetchHabitosStreaks)
  const [mounted, setMounted] = useState(false)

  useEffect(() =>
  {
    setMounted(true)
  }, [])

  useEffect(() =>
  {
    if (!open) return
    void fetchHabitosStreaks()
  }, [open, fetchHabitosStreaks])

  const donutItems = useMemo((): DonutSlice[] =>
  {
    return snapshot.items
      .filter((item) => item.applies)
      .map((item) => ({
        id: item.id,
        label: item.label,
        value: item.done ? 1 : Math.max(0.12, item.progress),
        color: RITUAL_COLORS[item.id] ?? '#7FA37A',
      }))
  }, [snapshot.items])

  const sortedStreaks = useMemo(
    () => [...habitosStreaks].sort((a, b) => b.streak_dias - a.streak_dias),
    [habitosStreaks],
  )

  const topRecord = useMemo(
    () => sortedStreaks.reduce((max, s) => Math.max(max, s.recorde_dias), 0),
    [sortedStreaks],
  )

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end lg:items-stretch justify-center lg:justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-stats-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-md lg:max-w-lg flex flex-col overflow-hidden rounded-t-sl lg:rounded-none border border-line bg-card shadow-2xl max-h-[min(90dvh,40rem)] lg:max-h-full lg:h-full mb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:mb-0">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
          <div>
            <h2 id="health-stats-title" className={`text-[15px] font-medium ${AXEL_TEXT_PRIMARY}`}>
              Estatísticas
            </h2>
            <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Ritual de hoje e constância dos hábitos
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-sl hover:bg-chrome text-ink-muted min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">
          <section>
            <p className="sl-section-label">Ritual de hoje</p>
            <div className="mt-3 flex items-center gap-4">
              <DonutChart
                items={donutItems}
                size={112}
                centerLabel={`${snapshot.percent}%`}
              />
              <ul className="flex-1 min-w-0 space-y-2">
                {snapshot.items.filter((i) => i.applies).map((item) => (
                  <li key={item.id} className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: RITUAL_COLORS[item.id] ?? '#7FA37A' }}
                      aria-hidden
                    />
                    <span className={`text-[12px] truncate flex-1 ${AXEL_TEXT_PRIMARY}`}>
                      {item.label}
                    </span>
                    <span className={`text-[11px] tabular-nums shrink-0 ${
                      item.done ? 'text-health' : AXEL_TEXT_SECONDARY
                    }`}>
                      {item.done ? 'ok' : `${Math.round(item.progress * 100)}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={AXEL_METRIC_HAIRLINE}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="sl-section-label">Recordes de streak</p>
              {topRecord > 0 && (
                <span className={`text-[11px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                  melhor: {topRecord}d
                </span>
              )}
            </div>

            {sortedStreaks.length === 0 ? (
              <p className={`text-[13px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
                Registre hábitos para ver sequências aqui.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {sortedStreaks.map((row) =>
                {
                  const isRecord = row.recorde_dias > 0 && row.recorde_dias === topRecord
                  return (
                    <li
                      key={row.habito_id}
                      className="flex items-center gap-3 rounded-sl border border-line/70 bg-card/40 px-3 py-2.5"
                    >
                      <span className={`shrink-0 ${row.streak_dias > 0 ? 'text-health' : 'text-ink-muted'}`}>
                        {isRecord ? <Trophy className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                          {row.nome_exibicao}
                        </p>
                        {row.ultima_data && (
                          <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                            Último: {formatDay(row.ultima_data)}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[16px] font-display tabular-nums ${MODULE_HERO.health}`}>
                          {row.streak_dias}d
                        </p>
                        <p className={`text-[10px] font-mono ${AXEL_TEXT_SECONDARY}`}>
                          recorde {row.recorde_dias}d
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
