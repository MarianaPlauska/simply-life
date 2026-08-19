import { useEffect, useMemo, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  ANALYTICS_TIMEFRAME_LABELS,
  type AnalyticsTimeframe,
} from '../../data/analyticsMockData'
import { buildAnalyticsBundle, hasAnalyticsData } from '../../lib/buildAnalyticsBundle'
import {
  maxLoadByExercise,
  monthlyPRs,
  sessoesConcluidasPeriodo,
  timeframeDays,
  topExerciciosPorVolume,
  totalVolumePeriodo,
  trainingHeatmap,
} from '../../lib/academyAnalytics'
import {
  AXEL_ANALYTICS_CARD,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { ExerciseBarChart } from './analytics/ExerciseBarChart'
import { AcademyLoadTrendChart } from './analytics/AcademyLoadTrendChart'
import { AcademyPRTable } from './analytics/AcademyPRTable'
import { AcademyHeatmap } from './analytics/AcademyHeatmap'

interface AcademyAnalyticsSectionProps
{
  compact?: boolean
  className?: string
}

export function AcademyAnalyticsSection({ compact = false, className = '' }: AcademyAnalyticsSectionProps)
{
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(compact ? '1W' : '1M')
  const habitos = useTaskStore((s) => s.habitos)
  const tarefas = useTaskStore((s) => s.tarefas)
  const sessoes = useTaskStore((s) => s.sessoesTreinoAnalytics)
  const fetchSessoesTreinoAnalytics = useTaskStore((s) => s.fetchSessoesTreinoAnalytics)

  useEffect(() =>
  {
    void fetchSessoesTreinoAnalytics(180)
  }, [fetchSessoesTreinoAnalytics])

  const bundle = useMemo(
    () => buildAnalyticsBundle({ habitos, tarefas, sessoesTreino: sessoes }, timeframe),
    [habitos, tarefas, sessoes, timeframe],
  )

  const days = timeframeDays(timeframe)
  const mesAtual = new Date().toISOString().slice(0, 7)
  const prs = useMemo(() => monthlyPRs(sessoes, mesAtual), [sessoes, mesAtual])
  const loadSeries = useMemo(() => maxLoadByExercise(sessoes, mesAtual), [sessoes, mesAtual])
  const topEx = useMemo(() => topExerciciosPorVolume(sessoes, 3), [sessoes])
  const heatmap = useMemo(
    () => trainingHeatmap(sessoes, new Date().getFullYear()),
    [sessoes],
  )

  const volumeTotal = totalVolumePeriodo(sessoes, days)
  const sessoesOk = sessoesConcluidasPeriodo(sessoes, days)
  const hasData = hasAnalyticsData(bundle) || sessoes.length > 0

  return (
    <section className={`space-y-4 ${className}`} aria-label="Analytics de academia">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent flex items-center gap-1">
            <Dumbbell size={12} />
            Academia
          </p>
          <h3 className={`font-display text-lg mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
            Saúde &amp; treino
          </h3>
          {!compact && (
            <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Minutos, volume, PRs e constância — dados das sessões finalizadas.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
          {ANALYTICS_TIMEFRAME_LABELS.map(({ id, label }) =>
          {
            const active = timeframe === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTimeframe(id)}
                className={active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {!hasData ? (
        <p className={`text-sm py-6 text-center border border-dashed border-line rounded-sl ${AXEL_TEXT_SECONDARY}`}>
          Finalize treinos no Modo Academia — gráficos aparecem aqui com minutos, volume e PRs reais.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 font-mono text-center">
            <div className="rounded-sl border border-line bg-card py-2 px-1">
              <p className="text-[16px] text-ink tabular-nums">{sessoesOk}</p>
              <p className="text-[10px] uppercase text-ink-muted">sessões</p>
            </div>
            <div className="rounded-sl border border-line bg-card py-2 px-1">
              <p className="text-[16px] text-ink tabular-nums">{bundle.exerciseConsistencyPct}%</p>
              <p className="text-[10px] uppercase text-ink-muted">constância</p>
            </div>
            <div className="rounded-sl border border-line bg-card py-2 px-1">
              <p className="text-[16px] text-ink tabular-nums">{Math.round(volumeTotal)}</p>
              <p className="text-[10px] uppercase text-ink-muted">kg·rep</p>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-2'} gap-4`}>
            <article className={`${AXEL_ANALYTICS_CARD} flex flex-col`}>
              <h4 className={`text-[13px] font-semibold mb-2 ${AXEL_TEXT_PRIMARY}`}>
                Minutos por período
              </h4>
              <ExerciseBarChart
                rows={bundle.rows}
                consistencyPct={bundle.exerciseConsistencyPct}
              />
            </article>

            {!compact && (
              <article className={`${AXEL_ANALYTICS_CARD} flex flex-col`}>
                <h4 className={`text-[13px] font-semibold mb-2 ${AXEL_TEXT_PRIMARY}`}>
                  Mapa de constância
                </h4>
                <AcademyHeatmap days={heatmap} weeks={timeframe === '1W' ? 4 : 12} />
              </article>
            )}

            {!compact && topEx.length > 0 && (
              <article className={`${AXEL_ANALYTICS_CARD} flex flex-col`}>
                <h4 className={`text-[13px] font-semibold mb-2 ${AXEL_TEXT_PRIMARY}`}>
                  Evolução de carga
                </h4>
                <div className="space-y-4">
                  {topEx.map((ex) => (
                    <AcademyLoadTrendChart
                      key={ex.id}
                      series={loadSeries}
                      exercicioId={ex.id}
                      exercicioNome={ex.nome}
                    />
                  ))}
                </div>
              </article>
            )}

            {!compact && (
              <article className={`${AXEL_ANALYTICS_CARD} flex flex-col`}>
                <h4 className={`text-[13px] font-semibold mb-2 ${AXEL_TEXT_PRIMARY}`}>
                  PRs do mês
                </h4>
                <AcademyPRTable prs={prs} />
              </article>
            )}
          </div>
        </>
      )}
    </section>
  )
}
