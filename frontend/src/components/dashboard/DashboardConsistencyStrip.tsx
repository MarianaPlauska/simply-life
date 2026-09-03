import { useMemo } from 'react'
import { ConsistencyHeatmap } from './ConsistencyHeatmap'
import { useTaskStore } from '../../store/useTaskStore'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import {
  buildConsistencyCells,
  buildExecutionDayMap,
  buildSpendDayMap,
  formatExecutionTooltip,
  formatSpendTooltip,
} from '../../lib/consistencyHeatmap'

interface DashboardConsistencyStripProps
{
  compact?: boolean
}

export function DashboardConsistencyStrip({ compact = false }: DashboardConsistencyStripProps)
{
  const focusMinutesByDate = useTaskStore((s) => s.focusMinutesByDate)
  const recentAchievements = useTaskStore((s) => s.recentAchievements)
  const transactions = useTaskStore((s) => s.transactions)

  const execCells = useMemo(
    () =>
    {
      const completed = recentAchievements.map((a) => a.completedAt)
      return buildConsistencyCells(
        buildExecutionDayMap(focusMinutesByDate, completed),
        compact ? 12 : 16,
      )
    },
    [focusMinutesByDate, recentAchievements, compact],
  )

  const spendCells = useMemo(
    () => buildConsistencyCells(buildSpendDayMap(transactions), compact ? 12 : 16),
    [transactions, compact],
  )

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <ConsistencyHeatmap
        cells={execCells}
        tone="health"
        weeks={compact ? 12 : 16}
        label="Rotina de execução"
        emptyHint="Execute ou foque um bloco - os quadrados começam a preencher."
        formatTooltip={formatExecutionTooltip}
        compact={compact}
      />
      <ConsistencyHeatmap
        cells={spendCells}
        tone="finance"
        weeks={compact ? 12 : 16}
        label="Gastos"
        emptyHint={EMPTY_COPY.financeSpendHeatmap}
        formatTooltip={formatSpendTooltip}
        compact={compact}
      />
    </div>
  )
}
