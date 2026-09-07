import { View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { moodGoalPeriodStats, type HumorRegistro, type LifeGoal } from '@simply-life/shared'
import { Card, Text } from '../../ui'
import { MiniBarChart } from '../../ui/MiniBarChart'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  humor: HumorRegistro[]
  goal: LifeGoal | null | undefined
}

/** Alerta de humor “Péssimo” no período da meta — independente do tipo da meta. */
export function MoodGoalAlertCard({ humor, goal }: Props)
{
  const { colors, space } = useTheme()
  const router = useRouter()
  const stats = moodGoalPeriodStats(humor, goal)
  if (!stats || stats.alertLevel === 'none') return null

  const tone = stats.alertLevel === 'concern' ? colors.danger : colors.axel

  return (
    <Card
      tone="elevated"
      style={{
        gap: space.sm,
        borderTopWidth: 1,
        borderTopColor: tone,
      }}
    >
      <Text variant="caption" style={{ color: tone, fontWeight: '700' }}>
        Atenção ao humor
      </Text>
      <Text variant="bodyStrong">
        {stats.terribleCount} de {stats.total} registros como Péssimo ({stats.terriblePct}%)
      </Text>
      <Text variant="caption" muted>
        No período da sua meta. Isso não é diagnóstico — serve para você perceber padrões e buscar
        apoio se precisar.
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MiniBarChart
          values={stats.byDay.length ? stats.byDay : [0]}
          color={tone}
          width={88}
          height={44}
        />
        <Text variant="micro" muted style={{ flex: 1 }}>
          Barras = dias com humor péssimo no período
        </Text>
      </View>
      <Pressable
        onPress={() => router.push('/(tabs)/saude')}
        accessibilityRole="button"
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text variant="caption" color={colors.health} style={{ fontWeight: '700' }}>
          Ver diário em Saúde →
        </Text>
      </Pressable>
    </Card>
  )
}
