import { useGamificationStore } from '../store/gamificationStore'
import { useActivityStore } from '../store/activityStore'
import { useNeuroStore } from '../store/neuroStore'
import { useRewardPulseStore } from '../store/rewardPulseStore'
import { hapticRestDone } from './haptics'

export const XP_TASK_DONE = 12

/**
 * Concluir tarefa: XP, conquista, dia ativo e a recompensa na hora
 * (vibração de sucesso + aviso com a barra do nível). Com "comemorações
 * discretas" ligado fica só a vibração.
 */
export function rewardTaskDone(titulo: string): void
{
  const gam = useGamificationStore.getState()
  const xp = gam.grantXp(XP_TASK_DONE, 'Tarefa concluída', titulo)
  gam.unlockIf('first_task')
  useActivityStore.getState().markAction('task')
  hapticRestDone()
  if (useNeuroStore.getState().quietCelebrations) return
  useRewardPulseStore.getState().show({ title: 'Tarefa concluída', detail: titulo, xp })
}
