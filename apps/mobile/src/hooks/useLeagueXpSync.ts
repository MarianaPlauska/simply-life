import { useEffect, useRef } from 'react'
import { localTodayIso, weekStartIso } from '@simply-life/shared'
import { useGamificationStore } from '../store/gamificationStore'
import { useAuthStore } from '../store/authStore'
import { upsertMyWeekXp } from '../lib/sync/leagues'

/**
 * Envia o meu XP da semana para as ligas (geral + tarefas, foco, treino).
 * Espera 5 s depois de ganhar XP para juntar vários ganhos num envio só.
 */
export function useLeagueXpSync(): void
{
  const isGuest = useAuthStore((s) => s.isGuest)
  const userId = useAuthStore((s) => s.userId)
  const weekXp = useGamificationStore((s) => s.weekXp)
  const weekXpArea = useGamificationStore((s) => s.weekXpArea)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() =>
  {
    if (!userId || isGuest) return
    const wk = weekStartIso(localTodayIso())
    const area = weekXpArea[wk] ?? {}
    const geral = weekXp[wk] ?? 0
    if (geral <= 0) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() =>
    {
      void upsertMyWeekXp(wk, {
        geral,
        tarefas: area.tarefas ?? 0,
        foco: area.foco ?? 0,
        treino: area.treino ?? 0,
      })
    }, 5000)
    return () =>
    {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [weekXp, weekXpArea, userId, isGuest])
}
