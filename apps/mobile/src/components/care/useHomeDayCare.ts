import { useEffect, useMemo } from 'react'
import {
  bodyChecked,
  burnoutActive,
  doneTodayLines,
  energyBudget,
  energyFromMinutes,
  energyPoints,
  findHabit,
  localTodayIso,
  parseTaskEnergy,
  suggestedEnergyStock,
  tasksForPlace,
} from '@simply-life/shared'
import { useDataStore } from '../../store/dataStore'
import { useCalendarStore } from '../../store/calendarStore'
import { useCareExtrasStore } from '../../store/careExtrasStore'

/** Energia, o que já foi feito e o lugar. A Home e o Apoio leem daqui. */
export function useHomeDayCare()
{
  const hydrate = useCareExtrasStore((s) => s.hydrate)
  const stock = useCareExtrasStore((s) => s.energyStock)
  const setStock = useCareExtrasStore((s) => s.setEnergyStock)
  const burnout = useCareExtrasStore((s) => s.burnoutActive)
  const startBurnout = useCareExtrasStore((s) => s.startBurnout)
  const stopBurnout = useCareExtrasStore((s) => s.stopBurnout)
  const hereSlug = useCareExtrasStore((s) => s.hereSlug)
  const places = useCareExtrasStore((s) => s.places)
  const bodyByDay = useCareExtrasStore((s) => s.bodyByDay)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const events = useCalendarStore((s) => s.events)
  const source = useCalendarStore((s) => s.source)
  const today = localTodayIso()

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const used = useMemo(() =>
  {
    let points = 0
    for (const task of tasks)
    {
      if (task.status === 'done') continue
      if (task.dataVencimento?.slice(0, 10) !== today) continue
      const level = parseTaskEnergy(task.anotacao) ?? energyFromMinutes(task.estimativaMinutos || 30)
      points += energyPoints(level)
    }
    for (const event of events)
    {
      if (event.date !== today || event.allDay || !event.busy || event.inicio == null || event.fim == null) continue
      points += energyPoints(energyFromMinutes(event.fim - event.inicio))
    }
    return points
  }, [tasks, events, today])

  const budget = energyBudget(used, stock)
  const humorToday = humor.filter((item) => (item.data ?? '').slice(0, 10) === today)
  const humorLow = humorToday.some((item) => item.humor <= 2)
  const suggestion = suggestedEnergyStock(stock, { humorLow, manyHigh: used > stock })
  const agua = findHabit(habits, 'agua')
  const lines = doneTodayLines({
    today,
    tasks,
    txs: finance,
    humorCount: humorToday.length,
    aguaCopos: agua?.progressoAtual ?? 0,
    bodyChecked: bodyChecked(bodyByDay[today]),
  })
  const here = places.find((place) => place.slug === hereSlug) ?? null
  const hereTasks = here ? tasksForPlace(tasks, here.slug) : []
  const active = burnoutActive(burnout, today)

  return {
    stock,
    setStock,
    burnout,
    startBurnout,
    stopBurnout,
    suggestion,
    lines,
    here,
    hereTasks,
    budget,
    active,
    events,
    source,
    today,
  }
}
