import { Activity, AlertTriangle, Brain, Loader2, Zap } from 'lucide-react'
import { readOrchestrationMetrics } from '../../lib/contextRationale'
import { OrionMentalLoadBar } from './OrionMentalLoadBar'
import { ORION_KANBAN_HEALTH } from '../../constants/orionKanbanTheme'
import {
  ORION_BTN_PRIMARY,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'
import type { TarefaUnificada } from '../../types'

interface OrionSystemHealthBarProps
{
  intelligenceOn: boolean
  gargalos: number
  tarefas: TarefaUnificada[]
  hojeTasks?: TarefaUnificada[]
  dailyScoreCap?: number
  onRecalculate: () => void
  loading?: boolean
  refreshKey?: number
}

export function OrionSystemHealthBar({
  intelligenceOn,
  gargalos,
  tarefas,
  hojeTasks = [],
  dailyScoreCap = 400,
  onRecalculate,
  loading = false,
  refreshKey = 0,
}: OrionSystemHealthBarProps)
{
  void refreshKey
  const metrics = readOrchestrationMetrics()
  const critical = tarefas.filter((t) => (t.score_urgencia ?? 0) > 90).length
  const avgScore = tarefas.length
    ? Math.round(tarefas.reduce((s, t) => s + (t.score_urgencia ?? 0), 0) / tarefas.length)
    : 0
  const minutes = metrics.minutesSaved > 0 ? `${metrics.minutesSaved}m` : '—'

  return (
    <section
      className={`w-full p-3 ${ORION_KANBAN_HEALTH}`}
      role="status"
      aria-label="Saúde do pipeline"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <Brain
              className={`w-4 h-4 shrink-0 ${intelligenceOn ? 'text-accent' : 'text-ink-muted'}`}
              strokeWidth={1.75}
            />
            <div>
              <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${ORION_TEXT_SECONDARY}`}>
                Orquestração
              </p>
              <p className={`text-xs ${ORION_TEXT_PRIMARY}`}>
                <span className={intelligenceOn ? 'text-concluido' : 'text-ink-muted'}>
                  {intelligenceOn ? 'Ativo' : 'Standby'}
                </span>
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-line hidden sm:block" aria-hidden />

          <MetricCell label="Score médio" value={String(avgScore)} />
          <OrionMentalLoadBar hojeTasks={hojeTasks} cap={dailyScoreCap} />
          <MetricCell label="Críticos" value={String(critical)} alert={critical > 0} />
          <MetricCell label="Gargalos" value={String(gargalos)} alert={gargalos > 0} />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 font-mono text-[10px] tabular-nums ${ORION_TEXT_SECONDARY}`}>
            <Activity className="w-3 h-3" />
            <span>Economia {minutes}</span>
          </div>

          <button
            type="button"
            onClick={onRecalculate}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide disabled:opacity-40 ${ORION_BTN_PRIMARY}`}
            aria-busy={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            Recalcular
          </button>
        </div>
      </div>
    </section>
  )
}

function MetricCell({
  label,
  value,
  alert = false,
}: {
  label: string
  value: string
  alert?: boolean
})
{
  return (
    <div className="min-w-[72px]">
      <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${ORION_TEXT_SECONDARY} flex items-center gap-1`}>
        {alert && <AlertTriangle className="w-2.5 h-2.5 text-atencao" />}
        {label}
      </p>
      <p className={`text-[13px] font-display tabular-nums ${alert ? 'text-atencao' : ORION_TEXT_PRIMARY}`}>
        {value}
      </p>
    </div>
  )
}
