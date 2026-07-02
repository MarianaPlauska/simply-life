import { useMemo } from 'react'
import type { FinanceMonthNavBounds } from '../../lib/financeMonthOutlook'

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface FinanceMonthStripProps
{
  monthOffset: number
  bounds: FinanceMonthNavBounds
  onSelect: (offset: number) => void
}

export function FinanceMonthStrip({ monthOffset, bounds, onSelect }: FinanceMonthStripProps)
{
  const items = useMemo(() =>
  {
    const now = new Date()
    const list: { offset: number; label: string; year: number }[] = []
    for (let o = bounds.minOffset; o <= bounds.maxOffset; o++)
    {
      const d = new Date(now.getFullYear(), now.getMonth() + o, 1)
      list.push({
        offset: o,
        label: MONTHS_SHORT[d.getMonth()],
        year: d.getFullYear(),
      })
    }
    return list
  }, [bounds.minOffset, bounds.maxOffset])

  if (items.length <= 1) return null

  const showYear = new Set(items.map((i) => i.year)).size > 1

  return (
    <div
      className="flex gap-1 overflow-x-auto scrollbar-none py-1 -mx-0.5"
      role="tablist"
      aria-label="Selecionar mês"
    >
      {items.map(({ offset, label, year }) =>
      {
        const active = offset === monthOffset
        return (
          <button
            key={offset}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(offset)}
            className={`shrink-0 flex flex-col items-center min-w-[2.75rem] px-2 py-1.5 rounded-sl font-mono transition-colors border ${
              active
                ? 'font-semibold bg-zinc-100 text-zinc-900 border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-accent-muted dark:text-accent dark:border-accent/30 dark:shadow-none'
                : 'text-zinc-500 border-transparent bg-transparent hover:text-zinc-700 dark:text-ink-muted dark:hover:bg-elevated dark:hover:text-ink'
            }`}
          >
            <span className="text-[10px] uppercase">{label}</span>
            {showYear && (
              <span className="text-[8px] opacity-70 tabular-nums">{String(year).slice(2)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
