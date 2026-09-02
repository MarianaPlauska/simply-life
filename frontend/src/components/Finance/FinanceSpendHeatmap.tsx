import { useMemo } from 'react'
import { ConsistencyHeatmap } from '../dashboard/ConsistencyHeatmap'
import {
  buildConsistencyCells,
  buildSpendDayMap,
  formatSpendTooltip,
} from '../../lib/consistencyHeatmap'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import type { Transaction } from '../../store/storeTypes'

interface FinanceSpendHeatmapProps
{
  transactions: Transaction[]
  compact?: boolean
}

export function FinanceSpendHeatmap({
  transactions,
  compact = false,
}: FinanceSpendHeatmapProps)
{
  const weeks = compact ? 12 : 16
  const cells = useMemo(
    () => buildConsistencyCells(buildSpendDayMap(transactions), weeks),
    [transactions, weeks],
  )

  return (
    <ConsistencyHeatmap
      cells={cells}
      tone="finance"
      weeks={weeks}
      label="Dias com gasto"
      emptyHint={EMPTY_COPY.financeSpendHeatmap}
      formatTooltip={formatSpendTooltip}
      compact={compact}
    />
  )
}
