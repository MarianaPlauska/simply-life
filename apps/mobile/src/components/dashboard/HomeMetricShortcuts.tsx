import { useMemo } from 'react'
import { useRouter } from 'expo-router'
import {
  findHabit,
  formatBRL,
  formatSleepHours,
  monthExpenseTotal,
  moodLabel,
  AGUA_META_COPOS,
  localTodayIso,
  pledgeProgress,
} from '@simply-life/shared'
import { useAuthStore } from '../../store/authStore'
import { useCaptureStore } from '../../store/captureStore'
import { useDataStore } from '../../store/dataStore'
import { usePrefsStore } from '../../store/prefsStore'
import { normalizeHomeMetrics, HOME_METRIC_CATALOG, type HomeMetricId } from '../../lib/homeMetrics'
import { useTheme } from '../../theme/ThemeProvider'
import { HomeQuickActions, type HomeShortcut } from './HomeQuickActions'
import { filterMetrics } from '../../lib/appModules'
import { useLifePledgeStore } from '../../store/lifePledgeStore'
import { useSectionNavStore } from '../../store/sectionNavStore'

function tintFor(id: HomeMetricId, colors: {
  health: string
  tasks: string
  finance: string
  attention: string
  dismiss: string
  axelFill: string
}): string
{
  if (id === 'humor' || id === 'water')
  {
    return colors.health
  }
  if (id === 'tasks')
  {
    return colors.tasks
  }
  if (id === 'finance')
  {
    return colors.finance
  }
  if (id === 'sleep')
  {
    return colors.dismiss
  }
  if (id === 'protein' || id === 'stats')
  {
    return colors.attention
  }
  if (id === 'pledge')
  {
    return colors.health
  }
  return colors.axelFill
}

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
  if (id === 'pledge')
  {
    return 'flag-outline'
  }
  if (id === 'stats')
  {
    return 'stats-chart-outline'
  }
  if (id === 'sleep')
  {
    return 'moon-outline'
  }
  return 'flag-outline'
}

export function HomeMetricShortcuts()
{
  const router = useRouter()
  const { colors } = useTheme()
  const isGuest = useAuthStore((s) => s.isGuest)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const prefs = usePrefsStore((s) => s.prefs)
  // só atalhos de módulos que a pessoa usa
  const ids = useMemo(
    () => filterMetrics(prefs.enabled_modules, normalizeHomeMetrics(prefs.home_metric_cards)),
    [prefs.home_metric_cards, prefs.enabled_modules],
  )
  const humor = useDataStore((s) => s.humor) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const addWaterCup = useDataStore((s) => s.addWaterCup)

  const todayIso = new Date().toISOString().slice(0, 10)
  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const sono = findHabit(habits, 'sono')
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
  const pledges = useLifePledgeStore((s) => s.pledges)
  const pinnedPledge = pledges.find((p) => p.pinned) ?? pledges[0]

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
      if (id === 'stats')
      {
        return String(doneToday)
      }
      if (id === 'sleep')
      {
        return sono && sono.progressoAtual > 0 ? formatSleepHours(sono.progressoAtual) : '-'
      }
      if (id === 'pledge')
      {
        if (!pinnedPledge) return 'Começar'
        const progress = pledgeProgress(pinnedPledge.startedOn, pinnedPledge.targetDays, localTodayIso())
        return `${progress.elapsed}/${progress.target}`
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
      if (id === 'stats')
      {
        return () => router.push('/(tabs)/kanban')
      }
      if (id === 'sleep')
      {
        return () => router.push('/(tabs)/saude')
      }
      if (id === 'pledge')
      {
        return () => router.push('/metas-vida' as never)
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
        tint: tintFor(id, colors),
        value: valueFor(id),
        onPress: pressFor(id),
      }
    })
  }, [
    ids,
    humorHoje,
    agua,
    proteina,
    sono,
    openTasks,
    gastosMes,
    doneToday,
    todayOpen,
    habits.length,
    habitsDone,
    colors,
    addWaterCup,
    isGuest,
    openCapture,
    router,
    pinnedPledge,
  ])

  return (
    <HomeQuickActions
      actions={[
        {
          id: 'apoio',
          label: 'Apoio',
          icon: 'heart-outline',
          tint: colors.axelFill,
          iconColor: colors.axelOnFill,
          onPress: () => router.push('/apoio' as never),
        },
        {
          id: 'mundo',
          label: 'Meu Mundo',
          icon: 'globe-outline',
          tint: colors.tasks,
          onPress: () =>
          {
            useSectionNavStore.getState().setActive('kanban', 'mundo')
            router.push('/kanban' as never)
          },
        },
        ...actions,
      ]}
    />
  )
}
