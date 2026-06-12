import { AXEL_FILTER_PILL_ACTIVE, AXEL_FILTER_PILL_IDLE } from '../../constants/axelSurfaces'
import type { FinanceSubTab } from '../../lib/financePlannerNav'

interface FinanceSubTabBarProps
{
  tabs: FinanceSubTab[]
  activeId: string
  onChange: (id: string) => void
}

export function FinanceSubTabBar({ tabs, activeId, onChange }: FinanceSubTabBarProps)
{
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x snap-mandatory -mx-1 px-1"
      role="tablist"
      aria-label="Subseção"
    >
      {tabs.map(({ id, label }) =>
      {
        const active = activeId === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`snap-start shrink-0 font-mono text-[10px] uppercase tracking-wide transition-all duration-200 ${
              active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
            } hover:border-accent/40 hover:bg-accent/10 hover:text-accent md:hover:shadow-sm`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
