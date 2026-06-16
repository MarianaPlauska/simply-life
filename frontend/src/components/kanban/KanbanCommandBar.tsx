import { Activity, AlertTriangle, Brain, HeartPulse, Loader2, Zap } from 'lucide-react'
import { computeMentalLoad } from '../../lib/energyOrchestration'
import { readOrchestrationMetrics } from '../../lib/contextRationale'
import type { MoodOrchestrationContext } from '../../lib/moodOrchestration'
import { AXEL_KANBAN_COMMAND } from '../../constants/axelKanbanTheme'
import {
  AXEL_BTN_PRIMARY,
  AXEL_CHROME_PLANE,
  AXEL_DISPLAY_STAT,
  AXEL_PROGRESS_THICK,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

// Faixa de comando Kanban — KPIs densos no padrão do dashboard

interface KanbanCommandBarProps
{
  tarefas: TarefaUnificada[]
  hojeTasks: TarefaUnificada[]
  hojeCount: number
  dailyScoreCap: number
  baseDailyCap?: number
  mood?: MoodOrchestrationContext | null
  gargalos: number
  intelligenceOn: boolean
  onRecalculate: () => void
  loading?: boolean
}

function KpiCell({
  label,
  value,
  hint,
  variant = 'default',
}: {
  label: string
  value: string
  hint?: string
  variant?: 'default' | 'urgent' | 'ok' | 'warn'
})
{
  const valueClass =
    variant === 'urgent'
      ? 'text-urgente'
      : variant === 'warn'
        ? 'text-atencao'
        : variant === 'ok'
          ? 'text-concluido'
          : AXEL_TEXT_PRIMARY

  return (
    <div className="px-4 py-3 border-r border-line last:border-r-0 min-w-[88px] flex-1">
      <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
        {label}
      </p>
      <p className={`${AXEL_DISPLAY_STAT} text-lg mt-0.5 leading-none ${valueClass}`}>
        {value}
      </p>
      {hint && (
        <p className={`font-mono text-[10px] mt-1 truncate ${AXEL_TEXT_SECONDARY}`}>{hint}</p>
      )}
    </div>
  )
}

export function KanbanCommandBar({
  tarefas,
  hojeTasks,
  hojeCount,
  dailyScoreCap,
  baseDailyCap,
  mood = null,
  gargalos,
  intelligenceOn,
  onRecalculate,
  loading = false,
}: KanbanCommandBarProps)
{
  const metrics = readOrchestrationMetrics()
  const critical = tarefas.filter((t) => (t.score_urgencia ?? 0) > 90).length
  const avgScore = tarefas.length
    ? Math.round(tarefas.reduce((s, t) => s + (t.score_urgencia ?? 0), 0) / tarefas.length)
    : 0
  const load = computeMentalLoad(hojeTasks, dailyScoreCap, mood)
  const fillPct = Math.min(100, load.percent)
  const capHint =
    baseDailyCap && baseDailyCap !== dailyScoreCap
      ? `ajustado · base ${baseDailyCap}`
      : `cap ${dailyScoreCap} pts`
  const fillClass =
    load.level === 'overload'
      ? 'bg-urgente'
      : load.level === 'warning'
        ? 'bg-atencao'
        : 'bg-accent'
  const minutes = metrics.minutesSaved > 0 ? `${metrics.minutesSaved}m` : '—'

  return (
    <section className={AXEL_KANBAN_COMMAND} aria-label="Comando do pipeline">
      <div className={`flex flex-wrap items-stretch ${AXEL_CHROME_PLANE} border-b border-line`}>
        <KpiCell label="Pipeline" value={String(tarefas.length)} hint="demandas ativas" />
        <KpiCell
          label="Hoje"
          value={String(hojeCount)}
          hint={capHint}
          variant={hojeCount > 8 ? 'warn' : 'default'}
        />
        {mood && (
          <KpiCell
            label="Bem-estar"
            value={mood.humorMedia != null ? `${mood.humorMedia}` : '—'}
            hint={mood.profileLabel}
            variant={
              mood.profile === 'recuperacao' ? 'urgent'
                : mood.profile === 'cuidado' ? 'warn'
                  : mood.profile === 'sem_registro' ? 'warn'
                    : 'ok'
            }
          />
        )}
        <div className="px-4 py-3 border-r border-line min-w-[140px] flex-[1.2]">
          <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
            Carga mental
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-lg font-display tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
              {load.sum}
            </span>
            <span className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>/ {load.cap}</span>
          </div>
          <div className={`mt-2 ${AXEL_PROGRESS_THICK} h-1.5`} title={load.tooltip}>
            <div
              className={`h-full rounded-sl transition-all duration-500 ${fillClass}`}
              style={{ width: `${fillPct}%` }}
              role="progressbar"
              aria-valuenow={load.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        <KpiCell label="Score médio" value={String(avgScore)} />
        <KpiCell
          label="Críticos"
          value={String(critical)}
          variant={critical > 0 ? 'urgent' : 'default'}
        />
        <KpiCell
          label="Gargalos"
          value={String(gargalos)}
          variant={gargalos > 0 ? 'warn' : 'default'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider px-2 py-1 border rounded-sl ${
              intelligenceOn
                ? 'border-concluido/30 text-concluido bg-concluido/5'
                : 'border-line text-ink-muted bg-chrome'
            }`}
          >
            <Brain className="w-3 h-3" strokeWidth={1.75} />
            {intelligenceOn ? 'Orquestração ativa' : 'Standby'}
          </span>
          {mood?.hasMoodToday && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-accent border border-accent/25 px-2 py-1 rounded-sl bg-accent-muted/40">
              <HeartPulse className="w-3 h-3" strokeWidth={1.75} />
              {mood.profileLabel}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
            <Activity className="w-3 h-3" strokeWidth={1.75} />
            Economia {minutes}
          </span>
          {(critical > 0 || gargalos > 0) && (
            <span className={`inline-flex items-center gap-1 font-mono text-[10px] text-atencao`}>
              <AlertTriangle className="w-3 h-3" strokeWidth={1.75} />
              {critical > 0 && `${critical} crítico${critical > 1 ? 's' : ''}`}
              {critical > 0 && gargalos > 0 && ' · '}
              {gargalos > 0 && `${gargalos} atrasado${gargalos > 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onRecalculate}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide disabled:opacity-40 shrink-0 ${AXEL_BTN_PRIMARY}`}
          aria-busy={loading}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Zap className="w-3 h-3" strokeWidth={1.75} />
          )}
          Recalcular prioridades
        </button>
      </div>
    </section>
  )
}
