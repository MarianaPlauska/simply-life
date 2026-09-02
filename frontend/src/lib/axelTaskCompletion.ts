import { toast } from 'sonner'
import { hapticTap } from './haptic'
import { celebrateTaskComplete } from './axelCelebration'
import { dismissBillForTask } from './financeBillOrchestrator'
import { isMainQuestTask, mainQuestBonusXp } from './mainQuest'
import { xpFromTaskScore, XP_FOCUS_SESSION } from './xpEconomy'
import { billCanonicalKey, billTaskReferenceKey, isFinanceBillTask } from './financeBillTaskDedup'
import { evaluateProofOfWork } from './proofOfWork'
import { useTaskStore } from '../store/useTaskStore'
import type { TarefaUnificada } from '../types'

// Conclusão de tarefa — XP sempre; ofensiva só com prova de trabalho

const FOCUS_XP_BONUS = XP_FOCUS_SESSION

export async function axelCompleteTask(tarefa: TarefaUnificada): Promise<void>
{
  if (tarefa.status === 'concluida') return

  hapticTap()

  const store = useTaskStore.getState()
  const score = tarefa.score_urgencia ?? 0
  const estimate = store.taskEstimates[tarefa.id] ?? 45
  const elapsed = store.getTaskElapsedSeconds(tarefa.id)
  const proof = evaluateProofOfWork(score, elapsed, estimate)

  const { incremented, streakCount, streakQualified } =
    store.recordStreakOnTaskComplete(proof)

  const focusMinutes = Math.max(1, Math.round(elapsed / 60))

  if (tarefa.id > 0)
  {
    await store.updateTarefa(tarefa.id, { status: 'concluida' })

    const refKey = billTaskReferenceKey(tarefa)
    const canonKey = billCanonicalKey(tarefa)
    if (refKey || canonKey || isFinanceBillTask(tarefa))
    {
      dismissBillForTask(tarefa)
      const { recordBillSettlementFromTask } = await import('../lib/financeBillSettlement')
      await recordBillSettlementFromTask({ ...tarefa, status: 'concluida' })
      const { postBillPaymentFromTask } = await import('../lib/financeTaskPayment')
      await postBillPaymentFromTask(
        { ...tarefa, status: 'concluida' },
        {
          transactions: store.transactions,
          cards: store.cards,
          addTransaction: (t) => store.addTransaction(t),
          markTransactionPaid: (id) => store.markTransactionPaid(id),
          markReservedBillPaid: (id) => store.markReservedBillPaid(id),
        },
      )
      void store.fetchBillSettlements?.()
      void store.fetchTransactions?.()
    }

    if (refKey || canonKey)
    {
      const duplicates = store.tarefas.filter((t) =>
      {
        if (t.id === tarefa.id || t.status === 'concluida') return false
        const tCanon = billCanonicalKey(t)
        if (canonKey && tCanon === canonKey) return true
        return refKey ? billTaskReferenceKey(t) === refKey : false
      })
      for (const dup of duplicates)
      {
        dismissBillForTask(dup)
        await store.updateTarefa(dup.id, { status: 'concluida' })
      }
    }

    const { markNotificationsForCompletedTask } = await import('../lib/notificationResolution')
    await markNotificationsForCompletedTask(tarefa)
    await store.fetchNotificacoes()
  }
  else
  {
    store.patchTarefaLocal(tarefa.id, { status: 'concluida' })
  }

  store.recordAchievement(tarefa.id, tarefa.titulo, focusMinutes, tarefa.created_at)

  const baseXp = xpFromTaskScore(score)
  if (isMainQuestTask(tarefa.id))
  {
    const bonus = mainQuestBonusXp(baseXp)
    await store.addXP('foco', bonus)
  }

  celebrateTaskComplete({
    streakIncremented: incremented,
    streakCount: streakCount,
    mainQuest: isMainQuestTask(tarefa.id),
  })

  if (streakQualified && incremented)
  {
    const streakLabel = streakCount === 1 ? '1 dia de ofensiva' : `${streakCount} dias de ofensiva`
    const mq = isMainQuestTask(tarefa.id) ? ' · Missão principal concluída' : ''
    toast.success(`Tarefa concluída · +${FOCUS_XP_BONUS} XP`, {
      duration: 5500,
      position: 'bottom-right',
      className: 'font-mono text-sm',
      description: `Ofensiva atualizada (${streakLabel})${mq}`,
    })
    return
  }

  if (streakQualified)
  {
    toast.success(`Tarefa concluída · +${FOCUS_XP_BONUS} XP`, {
      duration: 5000,
      position: 'bottom-right',
      className: 'font-mono text-sm',
      description: 'Ofensiva do dia mantida — bom trabalho.',
    })
    return
  }

  toast.success(`Tarefa concluída · +${FOCUS_XP_BONUS} XP`, {
    duration: 5000,
    position: 'bottom-right',
    className: 'font-mono text-sm',
    description: 'Para contar na ofensiva: foque pelo menos 15 min na tarefa ou cumpra o tempo estimado.',
  })
}

export function showFocusRewardToast(earlyFinish: boolean): void
{
  const store = useTaskStore.getState()
  const streakActive = store.hasCompletedTaskToday

  toast.success(
    earlyFinish
      ? `Sessão registrada · +${FOCUS_XP_BONUS} XP`
      : `Sessão de foco · +${FOCUS_XP_BONUS} XP`,
    {
      duration: 5000,
      position: 'bottom-right',
      description: streakActive
        ? 'Você concluiu antes do tempo estimado.'
        : 'Os minutos entram no seu histórico de foco.',
      className: 'font-mono text-sm',
    },
  )
}
