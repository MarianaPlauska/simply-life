import type { ComponentType } from 'react'
import { ChevronDown } from 'lucide-react'
import { AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

interface FinanceTab
{
  id: string
  label: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

interface FinanceMobileTabNavProps
{
  tabs: FinanceTab[]
  activeTab: string
  onTabChange: (id: string) => void
}

/** Navegação mobile — apenas seletor em coluna única, sem barra lateral */
export function FinanceMobileTabNav({
  tabs,
  activeTab,
  onTabChange,
}: FinanceMobileTabNavProps)
{
  const active = tabs.find((t) => t.id === activeTab)
  const ActiveIcon = active?.icon

  return (
    <div className="md:hidden w-full">
      <div className="relative w-full">
        {ActiveIcon && (
          <ActiveIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent pointer-events-none"
            strokeWidth={1.75}
          />
        )}
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          aria-label="Seção do planejamento financeiro"
          className={`w-full appearance-none pl-10 pr-10 py-3 min-h-[44px] rounded-sl border border-line bg-card font-mono text-[11px] uppercase tracking-wide outline-none focus:border-accent/50 ${AXEL_TEXT_PRIMARY}`}
        >
          {tabs.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
          aria-hidden
        />
      </div>
    </div>
  )
}
