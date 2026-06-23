import { toast } from 'sonner'
import { celebrateTaskComplete } from './axelCelebration'
import { isMainQuestTask, mainQuestBonusXp } from './mainQuest'
import { evaluateProofOfWork } from './proofOfWork'
import { useTaskStore } from '../store/useTaskStore'
import type { TarefaUnificada } from '../types'

// Conclusão de tarefa — XP sempre; ofensiva só com prova de trabalho

const FOCUS_XP_BONUS = 50

export async function axelCompleteTask(tarefa: TarefaUnificada): Promise<void>
{
  if (tarefa.status === 'concluida') return

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
  }
  else
  {
    store.patchTarefaLocal(tarefa.id, { status: 'concluida' })
    const xpAmount = Math.max(15, Math.round(score || 25))
    await store.addXP('foco', xpAmount)
  }

  store.recordAchievement(tarefa.id, tarefa.titulo, focusMinutes)

  const baseXp = Math.max(15, Math.round(score || 25))
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
