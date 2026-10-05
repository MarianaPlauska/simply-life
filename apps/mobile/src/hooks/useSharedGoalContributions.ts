import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { localTodayIso, sharedGoalCycle, type SharedGoal } from '@simply-life/shared'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useFocusLogStore } from '../store/focusLogStore'
import { useFoodLogStore } from '../store/foodLogStore'
import { useSharedGoalsStore } from '../store/sharedGoalsStore'
import { computeMyGoalDays } from '../lib/sharedGoalContributions'
import { fetchMyEntries, upsertMyEntries } from '../lib/sync/sharedGoals'

const DEBOUNCE_MS = 4000
const INTERVAL_MS = 10 * 60 * 1000

/**
 * Sobe a minha parte de cada meta junto (só eu leio essas linhas).
 * Hoje sempre reflete o registro atual (pode descer se eu tirar um copo);
 * dias passados só sobem quando há valor, para não apagar nada por falta
 * de histórico no aparelho.
 */
async function syncGoal(goal: SharedGoal, known: Map<string, Record<string, number>>): Promise<boolean>
{
  const today = localTodayIso()
  const mine = await computeMyGoalDays(goal, today)
  if (!mine) return false

  let server = known.get(goal.id)
  if (!server)
  {
    const cycle = sharedGoalCycle(goal, today)
    server = await fetchMyEntries(goal.id, cycle.start, cycle.end)
    known.set(goal.id, server)
  }

  const changed: Record<string, number> = {}
  for (const [dia, valor] of Object.entries(mine))
  {
    const prev = server[dia]
    if (prev !== undefined && Math.abs(prev - valor) < 0.005) continue
    if (dia !== today && valor <= 0) continue
    if (prev === undefined && valor <= 0) continue
    changed[dia] = valor
  }
  if (Object.keys(changed).length === 0) return false

  const ok = await upsertMyEntries(goal.id, changed)
  if (ok) known.set(goal.id, { ...server, ...changed })
  return ok
}

export function useSharedGoalContributions(): void
{
  const userId = useAuthStore((s) => s.userId)
  const isGuest = useAuthStore((s) => s.isGuest)
  const goals = useSharedGoalsStore((s) => s.goals)
  const loaded = useSharedGoalsStore((s) => s.loaded)
  const habits = useDataStore((s) => s.habits)
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)
  const focus = useFocusLogStore((s) => s.sessions)
  // refeições e limite de açúcar alimentam as metas de cuidar do corpo
  const meals = useFoodLogStore((s) => s.meals)
  const metaAcucar = useFoodLogStore((s) => s.prefs.metaAcucar)
  const nutrientes = useFoodLogStore((s) => s.prefs.mostrarCalorias)
  const known = useRef(new Map<string, Record<string, number>>())
  const running = useRef(false)
  const active = Boolean(userId) && !isGuest

  // Lista de metas ao entrar
  useEffect(() =>
  {
    if (!active)
    {
      known.current.clear()
      useSharedGoalsStore.getState().reset()
      return
    }
    if (!useSharedGoalsStore.getState().loaded) void useSharedGoalsStore.getState().load()
  }, [active, userId])

  useEffect(() =>
  {
    if (!active || !loaded) return
    const auto = goals.filter((g) => g.status === 'ativa' && g.metrica !== 'livre')
    if (auto.length === 0) return

    const run = async () =>
    {
      if (running.current) return
      running.current = true
      try
      {
        for (const g of auto)
        {
          const ok = await syncGoal(g, known.current).catch(() => false)
          if (ok) void useSharedGoalsStore.getState().refreshProgress(g.id)
        }
      }
      finally
      {
        running.current = false
      }
    }

    const t = setTimeout(() => void run(), DEBOUNCE_MS)
    const iv = setInterval(() => void run(), INTERVAL_MS)
    const sub = AppState.addEventListener('change', (st) =>
    {
      if (st === 'active') void run()
    })
    return () =>
    {
      clearTimeout(t)
      clearInterval(iv)
      sub.remove()
    }
  }, [active, loaded, goals, habits, tasks, humor, focus, meals, metaAcucar, nutrientes])
}
