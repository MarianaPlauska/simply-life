import { useMemo } from 'react'
import { Battery } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { buildDayCapacity, type CapacityMode } from '../../lib/dayCapacity'

const MODE_STYLES: Record<CapacityMode, { label: string }> = {
  pleno: { label: 'Dia tranquilo' },
  equilibrado: { label: 'Dia equilibrado' },
  cuidado: { label: 'Dia cheio' },
  critico: { label: 'Dia sobrecarregado' },
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
  const mood = useMoodOrchestration()

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

  return (
    <div
      className="inline-flex max-w-full items-center gap-2 rounded-pill border border-line bg-card px-2.5 py-1.5 text-ui-caption text-ink-muted"
      title={capacity.axelPhrase}
      aria-label={`Como está seu dia: ${style.label}, ${capacity.score}%`}
    >
      <Battery size={14} className="shrink-0 text-accent" aria-hidden="true" />
      <span className="font-medium text-ink">Como está seu dia:</span>
      <span className="truncate">{style.label}</span>
    </div>
  )
}
