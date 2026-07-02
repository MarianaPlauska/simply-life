import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Battery, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(false)
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
      <section className={`${AXEL_BORDERLESS_PANEL} border border-dashed border-line p-2.5 sm:p-3`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Battery className="w-4 h-4 shrink-0 text-ink-muted" />
          <p className={`text-[12px] flex-1 min-w-0 ${AXEL_TEXT_SECONDARY}`}>
            Capacidade do dia — desbloqueia no <span className="text-accent">nível 3</span>
          </p>
          <Link
            to="/perfil"
            className="shrink-0 inline-flex items-center gap-0.5 font-mono text-[9px] uppercase text-accent hover:underline"
          >
            Trilha
            <ChevronRight size={10} />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} p-2.5 sm:p-3`} aria-label="Capacidade do dia">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Battery size={14} className="shrink-0 text-accent" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[9px] uppercase tracking-wide text-accent">
                Capacidade
              </p>
              <span className={`text-xs font-display tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                {style.label} · {capacity.score}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden border border-line bg-chrome">
              <div
                className={`h-full transition-all duration-700 ${style.bar}`}
                style={{ width: `${capacity.score}%` }}
              />
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
        <p className={`text-[12px] leading-snug mt-2 line-clamp-2 ${AXEL_TEXT_SECONDARY}`}>
          {capacity.axelPhrase}
        </p>
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2.5 border-t border-line">
          {capacity.factors.map((f) => (
            <div key={f.id} className="sl-stat-chip p-1.5 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={`font-mono text-[8px] uppercase truncate ${AXEL_TEXT_SECONDARY}`}>
                  {f.label.split(' ')[0]}
                </span>
                <span className={`text-[10px] font-semibold tabular-nums ${AXEL_TEXT_PRIMARY}`}>
                  {f.pct}%
                </span>
              </div>
              <p className={`text-[9px] truncate text-ink-muted`}>{f.detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
