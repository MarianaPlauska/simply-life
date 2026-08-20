import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import { buildDayCapacity } from '../../lib/dayCapacity'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { resolveAxelPresence } from '../../lib/axelPresence'
import { buildMorningBrief } from '../../lib/morningBrief'
import { AxelMoodFace } from '../axel/AxelMoodFace'
import { DashboardAxelFocus } from './DashboardAxelFocus'

interface DashboardCommandBarProps
{
  greeting: string
  firstName: string
  onOpenTask?: (taskId: number) => void
}

export function DashboardCommandBar({
  greeting,
  firstName,
  onOpenTask,
}: DashboardCommandBarProps)
{
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const transactions = useTaskStore((s) => s.transactions)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const mood = useMoodOrchestration()

  const tarefas = useMemo(() => mergeDashboardTasks(storeTarefas), [storeTarefas])
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

  const hasMoodToday = humorHojeLista.length > 0
  const humorHoje = humorHojeLista[humorHojeLista.length - 1]?.humor ?? 3
  const presence = resolveAxelPresence({
    hasMoodToday,
    moodLevel: humorHoje,
    capacityMode: capacity.mode,
  })
  const brief = useMemo(
    () => buildMorningBrief(hojeTasks, dailyScoreCap, mood),
    [hojeTasks, dailyScoreCap, mood],
  )
  const phrase = brief.headline || capacity.axelPhrase

  return (
    <section aria-label="Mensagem do AXEL">
      <div className="flex items-start gap-2.5">
        <AxelMoodFace
          level={humorHoje}
          presence={presence}
          size={36}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="sl-eyebrow text-axel">AXEL</p>
          <h1 className="font-display font-medium text-[1.35rem] sm:text-[1.5rem] leading-[1.2] text-ink mt-0.5">
            {firstName ? `${greeting}, ${firstName}.` : `${greeting}.`}
          </h1>
          <p className="sl-voice-copy text-ink mt-1">
            {phrase}
          </p>
          <p className="text-[12px] sm:text-[13px] text-ink-muted mt-1 leading-relaxed">
            {brief.loadLine}
          </p>
        </div>
      </div>
      <DashboardAxelFocus onOpenTask={onOpenTask} />
    </section>
  )
}
