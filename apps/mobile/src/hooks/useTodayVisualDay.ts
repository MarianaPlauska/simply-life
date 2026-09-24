import { useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import {
  buildVisualDay,
  busyMinutesByDay,
  effectiveCapacity,
  learnedFactorFor,
  localTodayIso,
  nowAndNext,
  transitionAlerts,
  type VisualDay,
} from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useCalendarStore } from '../store/calendarStore'
import { useNeuroStore } from '../store/neuroStore'
import { usePlanLogStore } from '../store/planLogStore'
import { useOrchestratorPrefsStore } from '../store/orchestratorPrefsStore'
import { clearStickyPlan, scheduleTransitionAlerts, showStickyPlan } from '../lib/pushNotifications'
import { useTimeLearning } from '../lib/timeLearning'
import { useFocusLogStore } from '../store/focusLogStore'

/** Relógio que avança a cada minuto (para "agora" e a linha do tempo). */
export function useMinuteClock(): Date
{
  const [now, setNow] = useState(() => new Date())
  useEffect(() =>
  {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  return now
}

/** Dia visual de uma data (padrão: hoje): agenda + compromissos + tarefas encaixadas. */
export function useVisualDay(date?: string, now: Date = new Date()): VisualDay
{
  const tasks = useDataStore((s) => s.tasks) ?? []
  const events = useCalendarStore((s) => s.events)
  const estimateFactor = useNeuroStore((s) => s.estimateFactor)
  const plans = usePlanLogStore((s) => s.plans)
  const capacityMinutes = useOrchestratorPrefsStore((s) => s.capacityMinutes)
  const learning = useTimeLearning()
  const today = localTodayIso(now)
  const iso = date ?? today
  const minuteKey = `${now.getHours()}:${now.getMinutes()}`

  return useMemo(() =>
  {
    const plan = plans.find((p) => p.date === iso)
    const capacity = effectiveCapacity(
      { capacityMinutes, busyByDay: busyMinutesByDay(events), openTasks: [] },
      iso,
      today,
    )
    return buildVisualDay({
      date: iso,
      tasks,
      events,
      essentialIds: plan?.essentialIds,
      ref: now,
      estimateFactor,
      factorFor: (titulo) => learnedFactorFor(titulo, learning, estimateFactor),
      capacityMinutes: capacity,
    })
    // minuteKey recalcula o encaixe conforme o tempo passa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, tasks, events, estimateFactor, plans, capacityMinutes, minuteKey, today, learning])
}

const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

/**
 * Montado no layout: atualiza a agenda, agenda os avisos de transição
 * (perfil autismo/TDAH) e mantém o "agora / depois" fixo na barra (Android).
 */
export function useDayCompanion(): void
{
  const hydrateCalendar = useCalendarStore((s) => s.hydrate)
  const refreshCalendar = useCalendarStore((s) => s.refresh)
  const hydrateNeuro = useNeuroStore((s) => s.hydrate)
  const hydrateFocusLog = useFocusLogStore((s) => s.hydrate)
  const warnings = useNeuroStore((s) => s.transitionWarningsMin)
  const stickyPlan = useNeuroStore((s) => s.stickyPlan)
  const now = useMinuteClock()
  const day = useVisualDay(undefined, now)
  const lastSchedule = useRef('')
  const lastSticky = useRef('')

  useEffect(() =>
  {
    void hydrateNeuro()
    void hydrateFocusLog()
    void hydrateCalendar().then(() => refreshCalendar())
    const sub = AppState.addEventListener('change', (st) =>
    {
      if (st === 'active') void refreshCalendar()
    })
    return () => sub.remove()
  }, [hydrateNeuro, hydrateFocusLog, hydrateCalendar, refreshCalendar])

  // avisos antes de cada transição: reagenda só quando o plano do dia muda
  useEffect(() =>
  {
    const alerts = transitionAlerts(day, warnings, now)
    const key = alerts.map((a) => `${a.atMin}|${a.title}`).join(';')
    if (key === lastSchedule.current) return
    lastSchedule.current = key
    const [y, m, d] = day.date.split('-').map(Number)
    const t = setTimeout(() =>
    {
      void scheduleTransitionAlerts(alerts.map((a) => ({
        at: new Date(y, m - 1, d, Math.floor(a.atMin / 60), a.atMin % 60),
        title: a.title,
        body: a.body,
      })))
    }, 2500)
    return () => clearTimeout(t)
  }, [day, warnings, now])

  // "widget" grátis: notificação fixa com o que é agora e o que vem depois
  useEffect(() =>
  {
    if (!stickyPlan)
    {
      if (lastSticky.current) void clearStickyPlan()
      lastSticky.current = ''
      return
    }
    const nn = nowAndNext(day, now, 1)
    const title = nn.now
      ? `Agora: ${nn.now.titulo} (até ${hhmm(nn.now.fim)})`
      : nn.next[0] ? `Livre até ${hhmm(nn.next[0].inicio)}` : 'Dia livre daqui pra frente'
    const body = nn.next[0]
      ? `Depois: ${nn.next[0].titulo} às ${hhmm(nn.next[0].inicio)}`
      : day.unplaced.length ? `${day.unplaced.length} ficou para outro dia` : 'Nada mais marcado hoje'
    const key = `${title}|${body}`
    if (key === lastSticky.current) return
    lastSticky.current = key
    void showStickyPlan(title, body)
  }, [day, now, stickyPlan])

}
