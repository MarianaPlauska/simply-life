import { useEffect, useMemo } from 'react'
import {
  buildDayCard,
  buildWeekStory,
  deliveryPause,
  localTodayIso,
  missionDone,
  missionsComplete,
  mondayOfLocalWeek,
  storySundayId,
  weekStoryWindow,
  type DaySeries,
  type MissionProgress,
  type RecordBoard,
} from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useNeuroStore } from '../store/neuroStore'
import { usePlayStore } from '../store/playStore'
import { useLifePatterns } from './useLifePatterns'
import { useElo } from './useElo'
import { useGamificationStore, gamificationLevel } from '../store/gamificationStore'

function maxOf(series: DaySeries): number
{
  const values = Object.values(series)
  return values.length ? Math.max(...values) : 0
}

function weekCups(series: DaySeries): { best: number; current: number }
{
  const buckets: Record<string, number> = {}
  for (const [day, n] of Object.entries(series))
  {
    const monday = localTodayIso(mondayOfLocalWeek(new Date(`${day}T12:00:00`)))
    buckets[monday] = (buckets[monday] ?? 0) + n
  }
  const best = Math.max(0, ...Object.values(buckets), 0)
  const current = buckets[localTodayIso(mondayOfLocalWeek(new Date()))] ?? 0
  return { best, current }
}

function usualCups(series: DaySeries): number
{
  const values = Object.values(series).filter((n) => n > 0)
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Junta a carta, as missões, o recorde e o domingo com o que a Home já tem. */
export function useHomePlay()
{
  const { patterns, series, loading } = useLifePatterns()
  const elo = useElo()
  const humor = useDataStore((s) => s.humor) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const tasks = useDataStore((s) => s.tasks) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const quiet = useNeuroStore((s) => s.quietCelebrations)
  const cards = usePlayStore((s) => s.cards)
  const day = usePlayStore((s) => s.day)
  const party = usePlayStore((s) => s.party)
  const weekDismissed = usePlayStore((s) => s.weekDismissed)
  const ensureMissions = usePlayStore((s) => s.ensureMissions)
  const observeRecords = usePlayStore((s) => s.observeRecords)
  const reveal = usePlayStore((s) => s.reveal)
  const openChest = usePlayStore((s) => s.openChest)
  const dismissWeek = usePlayStore((s) => s.dismissWeek)
  const dismissParty = usePlayStore((s) => s.dismissParty)
  const totalXp = useGamificationStore((s) => s.totalXp)
  const level = gamificationLevel(totalXp)

  const today = localTodayIso()
  const water = weekCups(series.water)
  const bestTasks = maxOf(series.tasksDone)
  const tasksToday = series.tasksDone[today] ?? tasks.filter((t) => t.status === 'done' && (t.concluidoEm || '').slice(0, 10) === today).length
  const agua = habits.find((h) => h.tipo === 'agua')
  const cupsToday = Math.max(series.water[today] ?? 0, agua?.progressoAtual ?? 0)

  const card = useMemo(() =>
  {
    const year = new Date()
    year.setFullYear(year.getFullYear() - 1)
    const yearKey = localTodayIso(year)
    const memory = humor.find((h) => (h.data || '').slice(0, 10) === yearKey && h.nota?.trim())
    const pause = deliveryPause(
      finance.filter((t) => t.tipo === 'despesa').map((t) => ({
        date: (t.data || '').slice(0, 10),
        title: t.titulo || '',
        amount: Math.abs(t.valor),
      })),
      today,
    )
    return buildDayCard({
      today,
      patternText: patterns[0]?.text ?? null,
      eloRecord: elo.recorde,
      bestTasksDay: bestTasks,
      bestWaterWeek: water.best,
      daysWithoutDelivery: pause.days,
      deliverySaved: pause.saved,
      yearAgoNote: memory?.nota ?? null,
    })
  }, [today, patterns, elo.recorde, bestTasks, water.best, finance, humor])

  const morning = tasks.some((t) =>
  {
    if (!t.concluidoEm) return false
    const when = new Date(t.concluidoEm)
    return !Number.isNaN(when.getTime()) && when.getHours() < 10
  })

  useEffect(() =>
  {
    if (loading) return
    ensureMissions(today, {
      waterDays: Object.values(series.water).filter((n) => n > 0).length,
      usualCups: usualCups(series.water),
      finishesBeforeTen: morning,
    })
  }, [loading, today, series.water, morning, ensureMissions])

  const now: RecordBoard = {
    elo: Math.max(elo.atual, elo.recorde),
    tasksDay: Math.max(bestTasks, tasksToday),
    waterWeek: water.best,
  }

  useEffect(() =>
  {
    if (loading) return
    observeRecords(now, quiet)
  }, [loading, now.elo, now.tasksDay, now.waterWeek, quiet, observeRecords])

  const missions = day?.day === today ? day.missions : []
  const progress: MissionProgress = {
    waterCups: cupsToday,
    tasksDone: tasksToday,
    moodLogged: humor.some((h) => (h.data || '').slice(0, 10) === today),
    taskDoneBeforeTen: tasks.some((t) =>
    {
      if (!t.concluidoEm || (t.concluidoEm || '').slice(0, 10) !== today) return false
      const when = new Date(t.concluidoEm)
      return !Number.isNaN(when.getTime()) && when.getHours() < 10
    }),
  }

  const ref = new Date()
  const slides = buildWeekStory({
    bestDay: bestMoodLine(humor),
    moodLine: patterns[0]?.text ?? null,
    spent: spentLine(finance),
    level: level.level,
    xpInLevel: level.xpInLevel,
    xpPerLevel: level.xpToNext,
  })

  return {
    card,
    revealed: cards.some((c) => c.id === card.id),
    reveal: () => reveal(card),
    missions: missions.map((m) => ({ ...m, done: missionDone(m, progress) })),
    chestReady: day?.day === today && !day.chestOpened && missionsComplete(missions, progress),
    chestOpened: Boolean(day?.day === today && day.chestOpened),
    openChest: () => openChest(today),
    party,
    dismissParty,
    showWeek: weekStoryWindow(ref, weekDismissed),
    slides,
    dismissWeek: () => dismissWeek(storySundayId(ref)),
    loggedToday: progress.moodLogged || cupsToday > 0 || tasksToday > 0,
    loading,
  }
}

function bestMoodLine(humor: { data?: string; humor: number }[]): string | null
{
  const from = localTodayIso(new Date(Date.now() - 6 * 86400000))
  const byDay: Record<string, number[]> = {}
  for (const h of humor)
  {
    const d = (h.data || '').slice(0, 10)
    if (d < from) continue
    byDay[d] = [...(byDay[d] ?? []), h.humor]
  }
  let best: { day: string; avg: number } | null = null
  for (const [day, values] of Object.entries(byDay))
  {
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    if (!best || avg > best.avg) best = { day, avg }
  }
  if (!best) return null
  const label = new Date(`${best.day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${label} foi o dia mais leve, humor ${best.avg.toFixed(1).replace('.', ',')}.`
}

function spentLine(finance: { data?: string; tipo?: string; valor: number; fixaId?: string | null }[]): string | null
{
  const from = localTodayIso(mondayOfLocalWeek(new Date()))
  let total = 0
  for (const t of finance)
  {
    const d = (t.data || '').slice(0, 10)
    if (t.tipo !== 'despesa' || t.fixaId || d < from) continue
    total += Math.abs(t.valor)
  }
  if (total <= 0) return null
  return `Saíram R$ ${Math.round(total).toLocaleString('pt-BR')} nesta semana.`
}
