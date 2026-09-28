import { useEffect, type ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../../ui/Icon'
import {
  aguaMlPorCopo,
  currentWeekIsos,
  findHabit,
  formatSleepHours,
  habitPct,
  localTodayIso,
} from '@simply-life/shared'
import { Text, PressableScale, ProgressRing, MiniBarChart, MiniSparkline } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { useBodyWeekStore } from '../../store/bodyWeekStore'
import { useWaterLogStore } from '../../store/waterLogStore'
import { useAuthStore } from '../../store/authStore'

type Care = 'alimentacao' | 'hidratacao' | 'sono' | 'academia'

/** Seu resumo: corpo na semana (único bloco na Home). */
export function PersonalSummaryGrid()
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
  const sleepSeries = week.map((iso) =>
    iso === todayIso ? todaySleep : (sleepHours[iso] ?? 0),
  )
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

  const open = (care: Care) =>
  {
    router.push(`/(tabs)/saude?section=cuidados&care=${care}`)
  }

  // Coral fica só para ações; cada métrica usa um par tom + fundo suave do tema
  const proteinColor = colors.attention
  const waterColor = colors.tasks
  const sleepColor = colors.finance
  const trainColor = colors.health
  const ink = colors.ink

  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <Text variant="section" style={{ fontSize: 17 }}>
          Seu resumo
        </Text>
        <Text variant="caption" muted>
          Corpo na semana. Toque em um card para registrar.
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
          washBg={colors.attentionMuted}
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
          washBg={colors.tasksMuted}
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
          value={todaySleep > 0 ? formatSleepHours(todaySleep) : 'Sem'}
          unit="última noite"
          accent={sleepColor}
          ink={ink}
          washBg={colors.financeMuted}
          onPress={() => open('sono')}
          viz={
            <MiniBarChart
              values={sleepSeries.map((v) => v || 0.4)}
              highlightIndex={todayIndex >= 0 ? todayIndex : 6}
              color={sleepColor}
            />
          }
        />
        <MetricCard
          label="Treino"
          icon="barbell"
          value={treino?.progressoAtual ? 'Feito' : 'Sem'}
          unit="sessão"
          accent={trainColor}
          ink={ink}
          washBg={colors.healthMuted}
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
  icon: keyof typeof Icon.glyphMap
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
        borderRadius: 20,
        padding: 14,
        backgroundColor: washBg,
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={16} color={accent} />
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
