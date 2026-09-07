import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  filterTasksByPeriod,
  folderBinaryStats,
  formatBRL,
  findHabit,
  habitPct,
  monthExpenseTotal,
  monthIncomeTotal,
  taskBinaryStats,
  timeTriad,
  weekEvolution,
  type ReportPeriod,
  type ScopeSnapshot,
  type WeekMetric,
} from '@simply-life/shared'
import { Card, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useDataStore } from '../../store/dataStore'
import { PeriodFilter } from './PeriodFilter'
import { StatsMatrix } from './StatsMatrix'
import { WeekEvolutionChart } from './WeekEvolutionChart'
import { TimeTriadCard } from './TimeTriadCard'

type Props = {
  variant?: 'life' | 'tasks' | 'compact'
  snapshots?: ScopeSnapshot[]
}

type LifeChip = { label: string; value: string }

/**
 * Relatório de desempenho - mesmo framework nas tarefas e no resumo da pessoa.
 */
export function LifeSummaryReport({ variant = 'life', snapshots }: Props)
{
  const { space } = useTheme()
  const [period, setPeriod] = useState<ReportPeriod>('7d')
  const [metric, setMetric] = useState<WeekMetric>('done')
  const tasks = useDataStore((s) => s.tasks) ?? []
  const humor = useDataStore((s) => s.humor) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const habits = useDataStore((s) => s.habits) ?? []

  const scoped = useMemo(() => filterTasksByPeriod(tasks, period), [tasks, period])
  const series = useMemo(() => weekEvolution(tasks, 7), [tasks])
  const triad = useMemo(() => timeTriad(scoped), [scoped])
  const rows = useMemo(() =>
  {
    const base = taskBinaryStats(scoped)
    if (snapshots && snapshots.length > 0) return [...base, folderBinaryStats(snapshots)]
    return base
  }, [scoped, snapshots])

  const lifeChips: LifeChip[] = useMemo(() =>
  {
    if (variant !== 'life') return []
    const agua = findHabit(habits, 'agua')
    const treino = findHabit(habits, 'treino')
    const moodAvg =
      humor.length === 0
        ? null
        : Math.round((humor.reduce((s, h) => s + h.humor, 0) / humor.length) * 10) / 10
    return [
      { label: 'Humor', value: moodAvg != null ? moodAvg.toFixed(1) : '—' },
      { label: 'Água', value: `${habitPct(agua)}%` },
      { label: 'Treino', value: treino && treino.progressoAtual > 0 ? 'Feito' : 'Pendente' },
      { label: 'Gastos', value: formatBRL(monthExpenseTotal(finance)) },
      { label: 'Receitas', value: formatBRL(monthIncomeTotal(finance)) },
    ]
  }, [variant, habits, humor, finance])

  return (
    <View style={{ gap: space.md }}>
      <PeriodFilter value={period} onChange={setPeriod} />
      <StatsMatrix rows={rows} />
      <WeekEvolutionChart series={series} metric={metric} onMetricChange={setMetric} />
      {variant !== 'compact' ? <TimeTriadCard triad={triad} /> : null}
      {lifeChips.length > 0 ? (
        <Card tone="elevated" style={{ gap: 10, padding: 16 }}>
          <Text variant="section" style={{ fontSize: 16 }}>
            Resumo geral
          </Text>
          {lifeChips.map((chip) => (
            <View
              key={chip.label}
              style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 28, alignItems: 'center' }}
            >
              <Text variant="caption" muted>
                {chip.label}
              </Text>
              <Text variant="bodyStrong">{chip.value}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  )
}
