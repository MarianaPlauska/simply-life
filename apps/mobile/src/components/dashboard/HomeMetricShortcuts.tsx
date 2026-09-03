import { useMemo } from 'react'
import { useRouter } from 'expo-router'
import {
  findHabit,
  formatBRL,
  monthExpenseTotal,
  moodLabel,
  AGUA_META_COPOS,
} from '@simply-life/shared'
import { useAuthStore } from '../../store/authStore'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { usePrefsStore } from '../../store/prefsStore'
import { normalizeHomeMetrics, HOME_METRIC_CATALOG, type HomeMetricId } from '../../lib/homeMetrics'
import { HomeQuickActions, type HomeShortcut } from './HomeQuickActions'

function iconFor(id: HomeMetricId): HomeShortcut['icon']
{
  if (id === 'humor')
  {
    return 'happy-outline'
  }
  if (id === 'water')
  {
    return 'water-outline'
  }
  if (id === 'protein')
  {
    return 'restaurant-outline'
  }
  if (id === 'tasks')
  {
    return 'checkbox-outline'
  }
  if (id === 'finance')
  {
    return 'wallet-outline'
  }
  return 'flag-outline'
}

export function HomeMetricShortcuts()
{
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const prefs = usePrefsStore((s) => s.prefs)
  const ids = useMemo(
    () => normalizeHomeMetrics(prefs.home_metric_cards),
    [prefs.home_metric_cards],
  )
  const humor = useDataStore((s) => s.humor) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const addWaterCup = useDataStore((s) => s.addWaterCup)

  const todayIso = new Date().toISOString().slice(0, 10)
  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const humorHoje = humor.find((h) => (h.data || '').slice(0, 10) === todayIso)?.humor
  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const doneToday = tasks.filter(
    (t) => t.status === 'done' && t.dataVencimento?.slice(0, 10) === todayIso,
  ).length
  const todayOpen = tasks.filter(
    (t) => t.status !== 'done' && t.dataVencimento?.slice(0, 10) === todayIso,
  ).length
  const gastosMes = monthExpenseTotal(finance) ?? 0
  const habitsDone = habits.filter((h) => h.progressoAtual >= (h.metaDiaria || 1)).length

  const actions = useMemo((): HomeShortcut[] =>
  {
    const valueFor = (id: HomeMetricId): string =>
    {
      if (id === 'humor')
      {
        return humorHoje ? moodLabel(humorHoje) : '-'
      }
      if (id === 'water')
      {
        return agua
          ? `${agua.progressoAtual}/${agua.metaDiaria ?? AGUA_META_COPOS}`
          : '-'
      }
      if (id === 'protein')
      {
        return proteina ? `${proteina.progressoAtual}g` : '-'
      }
      if (id === 'tasks')
      {
        return String(openTasks)
      }
      if (id === 'finance')
      {
        return gastosMes >= 1000
          ? `${(gastosMes / 1000).toFixed(1).replace('.', ',')}k`
          : formatBRL(gastosMes)
      }
      const total = doneToday + todayOpen
      if (habits.length > 0)
      {
        return `${habitsDone}/${habits.length}`
      }
      return total > 0 ? `${doneToday}/${total}` : `${doneToday}`
    }

    const pressFor = (id: HomeMetricId): (() => void) =>
    {
      if (id === 'humor')
      {
        return () => router.push('/(tabs)/saude')
      }
      if (id === 'water')
      {
        return () => void addWaterCup(isGuest)
      }
      if (id === 'protein')
      {
        return () => router.push('/(tabs)/saude')
      }
      if (id === 'tasks')
      {
        return () => openCapture('dump')
      }
      if (id === 'finance')
      {
        return () => openCapture('expense')
      }
      return () => router.push('/(tabs)/financeiro')
    }

    return ids.map((id) =>
    {
      const meta = HOME_METRIC_CATALOG.find((c) => c.id === id)
      return {
        id,
        label: meta?.label ?? id,
        icon: iconFor(id),
        value: valueFor(id),
        onPress: pressFor(id),
      }
    })
  }, [
    ids,
    humorHoje,
    agua,
    proteina,
    openTasks,
    gastosMes,
    doneToday,
    todayOpen,
    habits.length,
    habitsDone,
    addWaterCup,
    isGuest,
    openCapture,
    router,
  ])

  return <HomeQuickActions actions={actions} />
}
