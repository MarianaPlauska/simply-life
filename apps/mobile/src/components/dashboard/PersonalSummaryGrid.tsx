import { useEffect, type ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  aguaMlPorCopo,
  findHabit,
  formatSleepHours,
  habitPct,
} from '@simply-life/shared'
import { Text, PressableScale, ProgressRing, MiniBarChart, MiniSparkline } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { last7Iso, useBodyWeekStore } from '../../store/bodyWeekStore'
import { useWaterLogStore } from '../../store/waterLogStore'
import { useAuthStore } from '../../store/authStore'

function wash(color: string, alpha: number): string
{
  if (!color.startsWith('#') || color.length < 7) return `rgba(232,115,74,${alpha})`
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type Care = 'alimentacao' | 'hidratacao' | 'sono' | 'academia'

/** Grade 2×2 do corpo — proteína, água, sono, treino. */
export function PersonalSummaryGrid()
{
  const { colors, mode } = useTheme()
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
  const week = last7Iso()
  const todaySleep = sono?.progressoAtual || sleepHours[week[week.length - 1]] || 0
  const sleepSeries = week.map((iso, i) =>
    i === week.length - 1 ? todaySleep : (sleepHours[iso] ?? 0),
  )
  const workoutSeries = week.map((iso, i) =>
  {
    if (i === week.length - 1 && treino?.progressoAtual) return 1
    return workout[iso] ?? 0
  })

  useEffect(() =>
  {
    hydrateBody()
    hydrateWater()
    if (isGuest) seedDemo()
  }, [hydrateBody, hydrateWater, seedDemo, isGuest])

  const open = (care: Care) =>
  {
    router.push(`/(tabs)/saude?section=cuidados&care=${care}`)
  }

  const proteinColor = colors.axel
  const waterColor = '#5B8DEF'
  const sleepColor = '#C4A574'
  const trainColor = colors.health
  const ink = colors.ink

  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <Text variant="section" style={{ fontSize: 17 }}>
          Seu resumo
        </Text>
        <Text variant="caption" muted>
          Corpo na semana — toque para registrar
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard
          label="Proteína"
          icon="flame"
          value={`${proteina?.progressoAtual ?? 0}`}
          unit="g"
          accent={proteinColor}
          ink={ink}
          washBg={wash(proteinColor, mode === 'dark' ? 0.16 : 0.1)}
          onPress={() => open('alimentacao')}
          viz={
            <ProgressRing
              progress={habitPct(proteina)}
              size={52}
              strokeWidth={5}
              color={proteinColor}
              showLabel={false}
            />
          }
        />
        <MetricCard
          label="Água"
          icon="water"
          value={`${((agua?.progressoAtual ?? 0) * ml).toLocaleString('pt-BR')}`}
          unit="ml"
          accent={waterColor}
          ink={ink}
          washBg={wash(waterColor, mode === 'dark' ? 0.18 : 0.1)}
          onPress={() => open('hidratacao')}
          viz={
            <ProgressRing
              progress={habitPct(agua)}
              size={52}
              strokeWidth={5}
              color={waterColor}
              showLabel={false}
            />
          }
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard
          label="Sono"
          icon="moon"
          value={todaySleep > 0 ? formatSleepHours(todaySleep) : '—'}
          unit="última noite"
          accent={sleepColor}
          ink={ink}
          washBg={wash(sleepColor, mode === 'dark' ? 0.18 : 0.12)}
          onPress={() => open('sono')}
          viz={
            <MiniBarChart
              values={sleepSeries.map((v) => v || 0.4)}
              highlightIndex={6}
              color={sleepColor}
            />
          }
        />
        <MetricCard
          label="Treino"
          icon="barbell"
          value={treino?.progressoAtual ? 'Feito' : '—'}
          unit="sessão"
          accent={trainColor}
          ink={ink}
          washBg={wash(trainColor, mode === 'dark' ? 0.16 : 0.1)}
          onPress={() => open('academia')}
          viz={<MiniSparkline values={workoutSeries.map((v) => v * 3 + 1)} color={trainColor} />}
        />
      </View>
    </View>
  )
}

function MetricCard({
  label,
  icon,
  value,
  unit,
  accent,
  ink,
  washBg,
  viz,
  onPress,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  value: string
  unit: string
  accent: string
  ink: string
  washBg: string
  viz: ReactNode
  onPress: () => void
})
{
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value} ${unit}`}
      style={{
        flex: 1,
        minHeight: 148,
        borderRadius: 24,
        padding: 14,
        backgroundColor: washBg,
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={16} color={accent} />
        <Text variant="caption" style={{ color: ink, fontSize: 13 }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="hero" style={{ fontSize: 22, lineHeight: 26, letterSpacing: -0.6 }} numberOfLines={1}>
            {value}
          </Text>
          <Text variant="micro" muted>
            {unit}
          </Text>
        </View>
        {viz}
      </View>
    </PressableScale>
  )
}
