import { useMemo } from 'react'
import { View } from 'react-native'
import { Redirect } from 'expo-router'
import {
  formatBRL,
  monthExpenseTotal,
  monthIncomeTotal,
  findHabit,
  habitPct,
} from '@simply-life/shared'
import { Screen, Text, Card } from '../src/ui'
import { StackHeader } from '../src/components/layout/StackHeader'
import { useTheme } from '../src/theme/ThemeProvider'
import { useAuthStore } from '../src/store/authStore'
import { useDataStore } from '../src/store/dataStore'

export default function RelatoriosScreen()
{
  const userId = useAuthStore((s) => s.userId)
  const { colors, space } = useTheme()
  const tasks = useDataStore((s) => s.tasks)
  const humor = useDataStore((s) => s.humor)
  const finance = useDataStore((s) => s.finance)
  const habits = useDataStore((s) => s.habits)

  const done = tasks.filter((t) => t.status === 'done').length
  const open = tasks.filter((t) => t.status !== 'done').length
  const overdue = tasks.filter((t) => t.status !== 'done' && t.dataVencimento && t.dataVencimento < new Date().toISOString().slice(0, 10)).length
  const moodAvg = useMemo(() =>
  {
    if (humor.length === 0) return null
    return Math.round((humor.reduce((s, h) => s + h.humor, 0) / humor.length) * 10) / 10
  }, [humor])
  const agua = findHabit(habits, 'agua')
  const treino = findHabit(habits, 'treino')
  const despesas = monthExpenseTotal(finance)
  const receitas = monthIncomeTotal(finance)
  const burnout = (overdue >= 3 ? 1 : 0) + (moodAvg != null && moodAvg <= 2 ? 1 : 0) + (open > 12 ? 1 : 0)

  if (!userId) return <Redirect href="/login" />

  const kpis: { label: string; value: string; color?: string }[] = [
    { label: 'Tarefas feitas', value: String(done), color: colors.tasks },
    { label: 'Em aberto', value: String(open) },
    { label: 'Atrasadas', value: String(overdue), color: overdue > 0 ? colors.danger : undefined },
    { label: 'Humor médio', value: moodAvg != null ? String(moodAvg) : '—' },
    { label: 'Água', value: `${habitPct(agua)}%`, color: colors.health },
    { label: 'Treino', value: treino && treino.progressoAtual > 0 ? 'Feito' : 'Pendente' },
    { label: 'Gastos', value: formatBRL(despesas), color: colors.finance },
    { label: 'Receitas', value: formatBRL(receitas), color: colors.health },
  ]

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader title="Relatórios" subtitle="Semana e mês em um olhar" />
      <View style={{ gap: space.lg }}>
        <Card tone="elevated" style={{ gap: space.sm }}>
          <Text variant="section">Risco de burnout</Text>
          <Text variant="title" color={burnout >= 2 ? colors.danger : colors.health}>
            {burnout >= 2 ? 'Alto' : burnout === 1 ? 'Atenção' : 'Estável'}
          </Text>
          <Text variant="caption" muted>
            Combina atraso, humor baixo e volume de tarefas abertas — o mesmo sinal do PWA.
          </Text>
        </Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {kpis.map((k) => (
            <Card
              key={k.label}
              tone="elevated"
              style={{ width: '47%', flexGrow: 1, gap: 4, minHeight: 88, justifyContent: 'center' }}
            >
              <Text variant="caption" muted>
                {k.label}
              </Text>
              <Text variant="title" color={k.color ?? colors.ink} style={{ fontSize: 20 }}>
                {k.value}
              </Text>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  )
}
