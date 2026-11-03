import { useEffect, useMemo, useState } from 'react'
import { findLifePatterns, lifePatternDays, type DaySeries, type LifePattern, type LifeSeries } from '@simply-life/shared'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { fetchHabitHistory } from '../lib/sync/habitHistorico'

const WINDOW_DAYS = 60

function isoDaysAgo(n: number): string
{
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function toSeries(rows: { data: string; valor: number }[]): DaySeries
{
  return Object.fromEntries(rows.map((r) => [r.data.slice(0, 10), r.valor]))
}

/** Padrões entre sono, água, treino, humor, gastos e tarefas dos últimos 60 dias. */
export function useLifePatterns(): { patterns: LifePattern[]; series: LifeSeries; loading: boolean; daysLogged: number }
{
  const isGuest = useAuthStore((s) => s.isGuest)
  const humor = useDataStore((s) => s.humor)
  const finance = useDataStore((s) => s.finance)
  const tasks = useDataStore((s) => s.tasks)
  const [habits, setHabits] = useState<Pick<LifeSeries, 'sleep' | 'water' | 'workout'>>({ sleep: {}, water: {}, workout: {} })
  const [loading, setLoading] = useState(true)
  const from = isoDaysAgo(WINDOW_DAYS)
  const to = isoDaysAgo(0)

  useEffect(() =>
  {
    if (isGuest)
    {
      setLoading(false)
      return
    }
    let alive = true
    const safe = (tipo: string) => fetchHabitHistory(tipo, from, to).catch(() => [])
    void Promise.all([safe('sono'), safe('agua'), safe('treino')]).then(([sono, agua, treino]) =>
    {
      if (!alive) return
      setHabits({ sleep: toSeries(sono), water: toSeries(agua), workout: toSeries(treino) })
      setLoading(false)
    })
    return () =>
    {
      alive = false
    }
  }, [isGuest, from, to])

  return useMemo(() =>
  {
    const inWindow = (d: string) => d >= from && d <= to
    const mood: DaySeries = {}
    const moodCount: DaySeries = {}
    for (const h of humor ?? [])
    {
      const d = (h.data || '').slice(0, 10)
      if (!inWindow(d)) continue
      mood[d] = (mood[d] ?? 0) + h.humor
      moodCount[d] = (moodCount[d] ?? 0) + 1
    }
    for (const d of Object.keys(mood)) mood[d] = mood[d] / moodCount[d]

    // contas fixas não dizem nada sobre o dia: entram só gastos do dia a dia
    const spend: DaySeries = {}
    for (const t of finance ?? [])
    {
      const d = (t.data || '').slice(0, 10)
      if (t.tipo !== 'despesa' || t.fixaId || !inWindow(d)) continue
      spend[d] = (spend[d] ?? 0) + Math.abs(t.valor)
    }

    const tasksDone: DaySeries = {}
    for (const t of tasks ?? [])
    {
      const d = (t.concluidoEm || '').slice(0, 10)
      if (t.status !== 'done' || !inWindow(d)) continue
      tasksDone[d] = (tasksDone[d] ?? 0) + 1
    }

    const series: LifeSeries = { ...habits, mood, spend, tasksDone }
    return {
      patterns: findLifePatterns(series),
      series,
      loading,
      daysLogged: lifePatternDays(series).length,
    }
  }, [habits, humor, finance, tasks, loading, from, to])
}
