import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { View, TextInput, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Search as LucideSearch } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import {
  consecutiveActivity,
  findHabit,
  lifeGoalNeedsRefresh,
  searchHomeItems,
  uniqueIsoDates,
  type FinanceTx,
  type MobileTask,
} from '@simply-life/shared'
import { Text, ProgressRing } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useGamificationStore } from '../../store/gamificationStore'
import { usePrefsStore } from '../../store/prefsStore'
import { LifeGoalMicroLine, LifeGoalSheet } from './LifeGoalSheet'
import { MoodGoalAlertCard } from './MoodGoalAlertCard'

const SearchIcon = LucideSearch as ComponentType<{
  size?: number
  color?: string
  strokeWidth?: number
}>

type Props = {
  tasks: MobileTask[]
  finance: FinanceTx[]
  pending: number
  doneToday: number
  /** Ritual da manhã — após os três quadrados de resumo. */
  ritualSlot?: ReactNode
}

/** Bloco principal do Início — busca, progresso, glances e ritual. */
export function HomeTodayDashboard({
  tasks,
  finance,
  pending,
  doneToday,
  ritualSlot,
}: Props)
{
  const { colors, elevation } = useTheme()
  const router = useRouter()
  const humor = useDataStore((s) => s.humor) ?? []
  const habits = useDataStore((s) => s.habits) ?? []
  const streak = useGamificationStore((s) => s.streak)
  const lifeGoal = usePrefsStore((s) => s.prefs.life_goal)
  const prefsLoaded = usePrefsStore((s) => s.loaded)
  const agua = findHabit(habits, 'agua')
  const [query, setQuery] = useState('')
  const [goalOpen, setGoalOpen] = useState(false)

  useEffect(() =>
  {
    if (prefsLoaded && lifeGoalNeedsRefresh(lifeGoal))
    {
      setGoalOpen(true)
    }
  }, [prefsLoaded, lifeGoal])

  const todayTotal = pending + doneToday
  const pct = todayTotal > 0 ? Math.round((doneToday / todayTotal) * 100) : 0
  const { weekLogged } = useMemo(() =>
  {
    const taskDays = tasks.filter((t) => t.status === 'done').map((t) => t.dataVencimento)
    const moodDays = humor.map((h) => h.data)
    return consecutiveActivity(uniqueIsoDates([...taskDays, ...moodDays]))
  }, [tasks, humor])

  const habitOk = agua ? agua.progressoAtual : 0

  const hits = useMemo(
    () => searchHomeItems(query, tasks, finance, 16),
    [query, tasks, finance],
  )

  const searching = query.trim().length > 0

  const cancelSearch = () => setQuery('')

  const openHit = (hit: ReturnType<typeof searchHomeItems>[number]) =>
  {
    if (hit.kind === 'task')
    {
      router.push(`/task/${hit.id}`)
      return
    }
    router.push('/(tabs)/financeiro')
  }

  return (
    <View style={{ gap: 16 }}>
      <LifeGoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 48,
          borderRadius: 16,
          paddingHorizontal: 14,
          gap: 10,
          backgroundColor: colors.elevated,
          ...elevation.card,
        }}
      >
        <SearchIcon size={18} color={colors.inkMuted} strokeWidth={2} />
        <TextInput
          placeholder="Buscar tarefas, gastos…"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.ink,
            paddingVertical: 10,
          }}
        />
        {searching ? (
          <Pressable
            onPress={cancelSearch}
            accessibilityLabel="Cancelar busca"
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <View
          style={{
            borderRadius: 24,
            padding: 20,
            gap: 14,
            backgroundColor: colors.widget,
            minHeight: 200,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" style={{ color: colors.widgetMuted }}>
              {hits.length > 0 ? `${hits.length} resultado(s)` : 'Busca'}
            </Text>
            <Pressable onPress={cancelSearch} accessibilityLabel="Fechar busca" hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={colors.widgetMuted} />
            </Pressable>
          </View>

          {hits.length === 0 ? (
            <Text variant="title" style={{ color: colors.widgetInk, fontSize: 18 }}>
              Nenhum resultado para “{query.trim()}”
            </Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
              {hits.map((hit) => (
                <Pressable
                  key={`${hit.kind}-${hit.id}`}
                  onPress={() => openHit(hit)}
                  style={{
                    minHeight: 52,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.hairline,
                    gap: 4,
                  }}
                >
                  <Text variant="bodyStrong" style={{ color: colors.widgetInk }} numberOfLines={1}>
                    {hit.title}
                  </Text>
                  <Text variant="caption" style={{ color: colors.widgetMuted }} numberOfLines={1}>
                    {hit.subtitle}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <View
            style={{
              borderRadius: 24,
              padding: 20,
              gap: 14,
              backgroundColor: colors.widget,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                <Text variant="caption" style={{ color: colors.widgetMuted }}>
                  Progresso de hoje
                </Text>
                <Text variant="title" style={{ color: colors.widgetInk, fontSize: 22 }}>
                  {todayTotal > 0
                    ? `${doneToday} de ${todayTotal} concluídas`
                    : pending > 0
                      ? `${pending} em aberto`
                      : 'Nada no dia ainda'}
                </Text>
                <Text variant="caption" style={{ color: colors.widgetMuted }}>
                  {todayTotal > 0
                    ? `${pct}% do dia — um passo de cada vez`
                    : 'As tarefas da sua conta aparecem aqui'}
                </Text>
              </View>
              <ProgressRing
                progress={pct}
                size={72}
                strokeWidth={7}
                color={colors.axel}
                trackColor="rgba(245,241,236,0.16)"
                centerLabel={`${pct}%`}
                labelColor={colors.widgetInk}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text variant="micro" style={{ color: colors.widgetMuted }}>
                {streak}d sequência
              </Text>
              <Text variant="micro" style={{ color: colors.widgetMuted }}>
                {weekLogged}/7 dias com registro
              </Text>
              <LifeGoalMicroLine onPress={() => setGoalOpen(true)} />
            </View>
          </View>

          <MoodGoalAlertCard humor={humor} goal={lifeGoal} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(
              [
                { label: 'Pendentes', value: String(pending), icon: 'time-outline' as const, color: colors.axel, href: '/(tabs)/kanban' },
                { label: 'Feitas', value: String(doneToday), icon: 'checkmark-circle-outline' as const, color: colors.health, href: '/(tabs)/kanban' },
                { label: 'Hábitos', value: String(habitOk), icon: 'star-outline' as const, color: colors.axel, href: '/(tabs)/saude' },
              ]
            ).map((g) => (
              <Pressable
                key={g.label}
                onPress={() => router.push(g.href as never)}
                style={{
                  flex: 1,
                  minHeight: 88,
                  borderRadius: 20,
                  backgroundColor: colors.elevated,
                  padding: 12,
                  gap: 8,
                  ...elevation.card,
                }}
              >
                <Ionicons name={g.icon} size={18} color={g.color} />
                <Text variant="title" style={{ fontSize: 22 }}>
                  {g.value}
                </Text>
                <Text variant="micro" muted>
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {ritualSlot}
        </>
      )}
    </View>
  )
}
