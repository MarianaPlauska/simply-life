import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Battery, ChevronRight, Sparkles } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { buildDayCapacity, type CapacityMode } from '../../lib/dayCapacity'
import { computeGamificationProfile } from '../../lib/gamificationProfile'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const MODE_STYLES: Record<CapacityMode, { bar: string; label: string }> = {
  pleno: { bar: 'bg-concluido', label: 'Pleno' },
  equilibrado: { bar: 'bg-accent', label: 'Equilibrado' },
  cuidado: { bar: 'bg-atencao', label: 'Modo cuidado' },
  critico: { bar: 'bg-urgente', label: 'Capacidade baixa' },
}

export function DayCapacityCard()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const userStats = useTaskStore((s) => s.userStats)
  const mood = useMoodOrchestration()

  const profile = computeGamificationProfile(userStats)
  const gated = profile.level < 3

  const hojeTasks = useMemo(
    () => tarefas.filter((t) => resolveTemporalHorizon(t) === 'hoje'),
    [tarefas],
  )

  const capacity = useMemo(
    () => buildDayCapacity({
      hojeTasks,
      dailyScoreCap,
      mood,
      transactions,
      cashAccount,
      reservedBills,
      contasFixas,
      billSettlements,
    }),
    [
      hojeTasks,
      dailyScoreCap,
      mood,
      transactions,
      cashAccount,
      reservedBills,
      contasFixas,
      billSettlements,
    ],
  )

  const style = MODE_STYLES[capacity.mode]

  if (gated)
  {
    return (
      <section className={`${AXEL_BORDERLESS_PANEL} border border-dashed border-line`}>
        <div className="flex items-start gap-3">
          <Battery className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className={`text-sm font-display ${AXEL_TEXT_PRIMARY}`}>
              Capacidade do dia
            </p>
            <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Desbloqueia no nível 3 — complete tarefas e humor para ver seu termômetro de vida.
            </p>
            <Link
              to="/perfil"
              className="inline-flex items-center gap-0.5 mt-2 font-mono text-[10px] uppercase text-accent hover:underline"
            >
              Ver trilha
              <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`${AXEL_BORDERLESS_PANEL} ring-1 ring-accent/20`}
      aria-label="Capacidade do dia"
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-wide text-accent flex items-center gap-1">
            <Battery size={10} />
            Capacidade do dia
          </p>
          <h2 className={`text-base font-display mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
            {style.label} · {capacity.score}%
          </h2>
        </div>
        <span className="shrink-0 font-mono text-[9px] uppercase px-2 py-1 rounded-sl bg-chrome border border-line text-ink-muted">
          {capacity.suggestedImportantTasks} foco{capacity.suggestedImportantTasks !== 1 ? 's' : ''}
        </span>
      </header>

      <div className="h-3 rounded-full bg-chrome border border-line overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-700 ${style.bar}`}
          style={{ width: `${capacity.score}%` }}
        />
      </div>

      <p className={`text-[14px] leading-relaxed ${AXEL_TEXT_PRIMARY} mb-3`}>
        <Sparkles size={12} className="inline mr-1 text-accent align-text-bottom" />
        {capacity.axelPhrase}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {capacity.factors.map((f) => (
          <div key={f.id} className="p-2 rounded-sl bg-chrome/30 border border-line/70 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                {f.label}
              </span>
              <span className={`text-xs font-semibold tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                {f.pct}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-chrome overflow-hidden">
              <div className="h-full bg-accent/70" style={{ width: `${f.pct}%` }} />
            </div>
            <p className={`text-[10px] mt-1 truncate ${AXEL_TEXT_SECONDARY}`}>{f.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
