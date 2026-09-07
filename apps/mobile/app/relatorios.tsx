import { useMemo } from 'react'
import { View } from 'react-native'
import { Redirect } from 'expo-router'
import { weeklyMoodReview, moodLabel } from '@simply-life/shared'
import { Screen, Text, Card } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'
import { LifeSummaryReport } from '../src/components/metrics/LifeSummaryReport'

export default function RelatoriosScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const { colors, space } = useTheme()
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)

  const open = tasks.filter((t) => t.status !== 'done').length
  const overdue = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.dataVencimento &&
      t.dataVencimento < new Date().toISOString().slice(0, 10),
  ).length
  const moodAvg = useMemo(() =>
  {
    if (humor.length === 0) return null
    return Math.round((humor.reduce((s, h) => s + h.humor, 0) / humor.length) * 10) / 10
  }, [humor])
  const burnout = (overdue >= 3 ? 1 : 0) + (moodAvg != null && moodAvg <= 2 ? 1 : 0) + (open > 12 ? 1 : 0)
  const moodWeek = weeklyMoodReview(humor)

  if (!userId) return <Redirect href="/login" />

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Relatórios" subtitle="Desempenho e resumo geral" />
      <View style={{ gap: space.lg }}>
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Risco de burnout</Text>
          <Text variant="title" color={burnout >= 2 ? colors.danger : colors.health}>
            {burnout >= 2 ? 'Alto' : burnout === 1 ? 'Atenção' : 'Estável'}
          </Text>
          <Text variant="caption" muted>
            Combina atraso, humor baixo e volume de tarefas abertas - o mesmo sinal do PWA.
          </Text>
        </Card>
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Evolução do humor</Text>
          {moodWeek.count === 0 ? (
            <Text variant="caption" muted>
              Sem check-ins nesta semana. O histórico completo fica em Saúde → Diário.
            </Text>
          ) : (
            <>
              <Text variant="title" style={{ fontSize: 22 }}>
                Média {moodWeek.avg.toFixed(1)} / 5
              </Text>
              <Text variant="caption" muted>
                {moodWeek.daysLogged} dias · melhor {moodLabel(moodWeek.best)} · mais baixo {moodLabel(moodWeek.worst)}
              </Text>
            </>
          )}
        </Card>
        <LifeSummaryReport variant="life" />
      </View>
    </Screen>
  )
}
