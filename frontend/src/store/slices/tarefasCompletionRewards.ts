import type { TarefaUnificada } from '../../types'
import { supabase } from '../../lib/supabase'
import {
  qualifiesForDeepWorkStreak,
  incrementMorningDeepWorkCount,
  wasDeepWorkBonusGrantedToday,
  markDeepWorkBonusGranted,
  isMorningDeepWorkWindow,
} from '../../utils/deepWork'
import { xpFromTaskScore } from '../../lib/xpEconomy'
import { GOLD_PER_TASK, parseMedoNotas, xpWithFear } from '../../lib/goldEconomy'
import { rememberTaskGrant } from '../../lib/taskRewardLedger'

type StoreGet = () => Record<string, unknown>
type StoreSet = (fn: (s: Record<string, unknown>) => Record<string, unknown>) => void

export async function applyTaskCompletionRewards(
  oldTarefa: TarefaUnificada | undefined,
  get: StoreGet,
  set: StoreSet,
): Promise<void>
{
  if (!oldTarefa) return

  const xpAmount = xpWithFear(
    xpFromTaskScore(oldTarefa.score_urgencia ?? 20),
    parseMedoNotas(oldTarefa.notas_locais),
  )
  const anyGet = get()

  if (typeof anyGet.addXP === 'function')
  {
    const granted = await (anyGet.addXP as (m: string, n: number) => Promise<number>)('foco', xpAmount)
    if (typeof anyGet.addGold === 'function')
    {
      await (anyGet.addGold as (n: number) => Promise<number>)(GOLD_PER_TASK)
    }
    rememberTaskGrant(oldTarefa.id, { xp: granted || xpAmount, ouro: GOLD_PER_TASK })
  }

  if (typeof anyGet.incrementQuestProgress === 'function')
  {
    await (anyGet.incrementQuestProgress as (t: string, v: number) => Promise<void>)(
      'Concluir 1 tarefa do Kanban',
      1,
    )
  }

  if (!qualifiesForDeepWorkStreak(oldTarefa.score_urgencia))
  {
    return
  }

  const stats = anyGet.userStats as { id?: string; streak_foco?: number } | null | undefined
  if (!stats?.id)
  {
    return
  }

  const newStreakFoco = (stats.streak_foco || 0) + 1
  const morningCount = incrementMorningDeepWorkCount()

  if (morningCount >= 3 && !wasDeepWorkBonusGrantedToday())
  {
    markDeepWorkBonusGranted()
    if (typeof anyGet.addXP === 'function')
    {
      await (anyGet.addXP as (m: string, n: number) => Promise<void>)('foco', 50)
    }
    const { toast } = await import('sonner')
    toast.success('Deep Work Matinal (+50 XP)', {
      description: '3 tarefas críticas concluídas antes do meio-dia.',
    })
    await supabase.from('user_stats').update({ streak_foco: 0 }).eq('id', stats.id)
    set((s) => ({
      ...s,
      userStats: s.userStats
        ? { ...(s.userStats as object), streak_foco: 0 }
        : null,
    }))
    return
  }

  if (newStreakFoco === 3 && isMorningDeepWorkWindow())
  {
    if (typeof anyGet.addXP === 'function')
    {
      await (anyGet.addXP as (m: string, n: number) => Promise<void>)('foco', 50)
    }
    const { toast } = await import('sonner')
    toast.success('Bônus Foco Absoluto (+50 XP)', {
      description: 'Você concluiu 3 tarefas de alta urgência na manhã.',
    })
    await supabase.from('user_stats').update({ streak_foco: 0 }).eq('id', stats.id)
    set((s) => ({
      ...s,
      userStats: s.userStats
        ? { ...(s.userStats as object), streak_foco: 0 }
        : null,
    }))
    return
  }

  await supabase.from('user_stats').update({ streak_foco: newStreakFoco }).eq('id', stats.id)
  set((s) => ({
    ...s,
    userStats: s.userStats
      ? { ...(s.userStats as object), streak_foco: newStreakFoco }
      : null,
  }))
}
