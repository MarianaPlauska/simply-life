import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useMoodOrchestration } from '../hooks/useMoodOrchestration'
import { syncMainQuest } from './mainQuest'
import { listTarefasAtrasadas } from './notificacaoUtils'
import { bucketByDueDate } from './dueBucket'
import { useHealthRitualSnapshot } from '../hooks/useHealthRitualSnapshot'
import { useCashPosition } from '../hooks/useCashPosition'
import { aguaDisplaySnapshot } from './healthRitual'

/** Prioridade do card central mobile: humor → vencido → agora */
export type DashboardMobilePriority = 'humor' | 'vencido' | 'agora' | 'fallback'

export type DashboardGlanceChip = 'finance' | 'water' | 'care' | 'due'

export function useDashboardMobileLayout()
{
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const transactions = useTaskStore((s) => s.transactions)
  const habitos = useTaskStore((s) => s.habitos)
  const mood = useMoodOrchestration()
  const ritual = useHealthRitualSnapshot()
  const { display: cash } = useCashPosition()

  const alertCtx = useMemo(
    () => ({ settlements: billSettlements, transactions }),
    [billSettlements, transactions],
  )

  const overdueList = useMemo(
    () => listTarefasAtrasadas(storeTarefas, alertCtx),
    [storeTarefas, alertCtx],
  )

  const dueBuckets = useMemo(
    () => bucketByDueDate(storeTarefas.filter((t) => t.status !== 'concluida')),
    [storeTarefas],
  )

  const topTask = useMemo(() =>
  {
    const tasks = storeTarefas.filter((t) => t.status !== 'concluida')
    return syncMainQuest(tasks, mood)
  }, [storeTarefas, mood])

  const priority = useMemo((): DashboardMobilePriority =>
  {
    if (humorHojeLista.length === 0)
    {
      return 'humor'
    }
    if (overdueList.length > 0)
    {
      return 'vencido'
    }
    if (topTask)
    {
      return 'agora'
    }
    return 'fallback'
  }, [humorHojeLista.length, overdueList.length, topTask])

  const aguaHabit = habitos.find((h) => h.tipo === 'agua')
  const aguaSnap = aguaHabit
    ? aguaDisplaySnapshot(aguaHabit.progresso_atual ?? 0, aguaHabit.meta_diaria ?? 8)
    : null

  const dueTotal = dueBuckets.vencido.length + dueBuckets.hoje.length + dueBuckets.esta_semana.length

  const hasFinanceData = transactions.length > 0
    || cash.saldoDisponivel !== 0
    || cash.saldoProjetadoDisponivel !== 0

  const glanceChips = useMemo(() =>
  {
    const chips: DashboardGlanceChip[] = []

    if (hasFinanceData)
    {
      chips.push('finance')
    }
    if (aguaSnap)
    {
      chips.push('water')
    }
    if (ritual.totalApplicable > 0)
    {
      chips.push('care')
    }
    if (dueTotal > 0)
    {
      chips.push('due')
    }

    return chips
  }, [hasFinanceData, aguaSnap, ritual.totalApplicable, dueTotal])

  const showCompactQuickActions = priority === 'fallback' && glanceChips.length < 2

  return {
    priority,
    topTask,
    overdueList,
    overdueCount: overdueList.length,
    dueBuckets,
    glanceChips,
    showCompactQuickActions,
    aguaSnap,
    ritual,
    cash,
  }
}
