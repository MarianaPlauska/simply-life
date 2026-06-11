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
    const streakLabel = `Ofensiva ${streakCount} ${streakCount === 1 ? 'dia' : 'dias'}!`
    const mq = isMainQuestTask(tarefa.id) ? ` · Main Quest +${mainQuestBonusXp(baseXp)} XP` : ''
    toast.success(`+${FOCUS_XP_BONUS} XP | ${streakLabel}`, {
      duration: 3200,
      position: 'bottom-right',
      className: 'font-mono text-sm',
      description: `Prova de trabalho validada${mq}`,
    })
    return
  }

  if (streakQualified)
  {
    toast.success(`+${FOCUS_XP_BONUS} XP | Ofensiva mantida!`, {
      duration: 2800,
      position: 'bottom-right',
      className: 'font-mono text-sm',
    })
    return
  }

  const hints: string[] = []
  if (!proof.scoreOk) hints.push(`score > 70 (atual ${Math.round(score)})`)
  if (!proof.focusOk)
  {
    hints.push(
      `timer ≥ 15 min ou estimativa cumprida (${proof.focusMinutesOnTask} min registrados)`,
    )
  }

  toast.success(`+${FOCUS_XP_BONUS} XP | Tarefa concluída`, {
    duration: 3600,
    position: 'bottom-right',
    className: 'font-mono text-sm',
    description: `Sem ofensiva: ${hints.join(' · ')}`,
  })
}

export function showFocusRewardToast(earlyFinish: boolean): void
{
  const store = useTaskStore.getState()
  const streakActive = store.hasCompletedTaskToday

  toast.success(
    earlyFinish
      ? `+${FOCUS_XP_BONUS} XP | Sessão registrada`
      : `+${FOCUS_XP_BONUS} XP | Sessão de foco registrada`,
    {
      duration: 2800,
      position: 'bottom-right',
      description: streakActive
        ? 'Bônus por concluir antes do estimado'
        : 'Minutos contam no heatmap',
      className: 'font-mono text-sm',
    },
  )
}
