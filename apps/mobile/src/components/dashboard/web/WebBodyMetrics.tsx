import { useEffect, type ReactNode } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  aguaMlPorCopo,
  currentWeekIsos,
  findHabit,
  formatSleepHours,
  habitPct,
  localTodayIso,
} from '@simply-life/shared'
import { Text, MiniBarChart, MiniSparkline } from '../../../ui'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useBodyWeekStore } from '../../../store/bodyWeekStore'
import { useWaterLogStore } from '../../../store/waterLogStore'
import { WebHoverable } from './WebHoverable'
import { webStyle } from './webStyle'
import { WEB_CARD_BORDER, WEB_ROW_DIVIDER } from './webPalette'

type Care = 'alimentacao' | 'hidratacao' | 'sono' | 'academia'

/** Corpo na semana como lista densa (linha = métrica), não cards grandes de app. */
export function WebBodyMetrics()
{
  const { colors } = useTheme()
  const router = useRouter()
  const isGuest = useAuthStore((s) => s.isGuest)
  const habits = useDataStore((s) => s.habits)
  const sleepHours = useBodyWeekStore((s) => s.sleepHours)
  const workout = useBodyWeekStore((s) => s.workout)
  const hydrateBody = useBodyWeekStore((s) => s.hydrate)
  const seedDemo = useBodyWeekStore((s) => s.seedDemoIfEmpty)
  const hydrateWater = useWaterLogStore((s) => s.hydrate)

  const agua = findHabit(habits, 'agua')
  const proteina = findHabit(habits, 'proteina')
  const sono = findHabit(habits, 'sono')
  const treino = findHabit(habits, 'treino')
  const ml = aguaMlPorCopo(agua)
  const week = currentWeekIsos()
  const todayIso = localTodayIso()
  const todayIndex = week.indexOf(todayIso)
  const todaySleep = sono?.progressoAtual || sleepHours[todayIso] || 0
  const sleepSeries = week.map((iso) => (iso === todayIso ? todaySleep : (sleepHours[iso] ?? 0)))
  const workoutSeries = week.map((iso) =>
  {
    if (iso === todayIso && treino?.progressoAtual) return 1
    return workout[iso] ?? 0
  })

  useEffect(() =>
  {
    hydrateBody()
    hydrateWater()
    if (isGuest) seedDemo()
  }, [hydrateBody, hydrateWater, seedDemo, isGuest])

  const open = (care: Care) => router.push(`/(tabs)/saude?section=cuidados&care=${care}`)

  const rows: {
    id: Care
    icon: keyof typeof Ionicons.glyphMap
    label: string
    value: string
    unit: string
    color: string
    viz: ReactNode
  }[] = [
    {
      id: 'alimentacao',
      icon: 'flame',
      label: 'Proteína',
      value: `${proteina?.progressoAtual ?? 0}`,
      unit: 'g',
      color: colors.inkMuted,
      viz: null,
    },
    {
      id: 'hidratacao',
      icon: 'water',
      label: 'Água',
      value: `${((agua?.progressoAtual ?? 0) * ml).toLocaleString('pt-BR')}`,
      unit: 'ml',
      color: colors.inkMuted,
      viz: null,
    },
    {
      id: 'sono',
      icon: 'moon',
      label: 'Sono',
      value: todaySleep > 0 ? formatSleepHours(todaySleep) : 'Sem registro',
      unit: 'última noite',
      color: colors.inkMuted,
      viz: (
        <MiniBarChart
          values={sleepSeries.map((v) => v || 0.4)}
          highlightIndex={todayIndex >= 0 ? todayIndex : 6}
          color={colors.inkMuted}
          width={56}
          height={26}
        />
      ),
    },
    {
      id: 'academia',
      icon: 'barbell',
      label: 'Treino',
      value: treino?.progressoAtual ? 'Feito' : 'Sem sessão',
      unit: 'hoje',
      color: colors.inkMuted,
      viz: (
        <MiniSparkline
          values={workoutSeries.map((v) => v * 3 + 1)}
          color={colors.inkMuted}
          width={56}
          height={26}
        />
      ),
    },
  ]

  return (
    <View style={{ gap: 10 }}>
      <Text variant="section" style={{ fontSize: 16 }}>
        Corpo na semana
      </Text>
      <View style={{ borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: WEB_CARD_BORDER, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <WebHoverable
            key={row.id}
            onPress={() => open(row.id)}
            accessibilityLabel={`${row.label}: ${row.value} ${row.unit}`}
            style={(hovered) => webStyle({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: WEB_ROW_DIVIDER,
              backgroundColor: hovered ? colors.surface : 'transparent',
              cursor: 'pointer',
            })}
          >
            <Ionicons name={row.icon} size={16} color={row.color} style={{ width: 20 }} />
            <Text variant="body" style={{ width: 76, fontSize: 13 }}>
              {row.label}
            </Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                {row.value}
              </Text>
              <Text variant="micro" muted>
                {row.unit}
              </Text>
            </View>
            {row.viz}
          </WebHoverable>
        ))}
      </View>
    </View>
  )
}
