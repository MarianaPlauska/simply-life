import type { FinanceSubTab } from '../../lib/financePlannerNav'
import { AXEL_NAV_SUB_ACTIVE, AXEL_NAV_SUB_IDLE } from '../../constants/axelSurfaces'

const SUB_HINTS: Partial<Record<string, string>> = {
  diario: 'Lançar · extrato do dia',
  tabela: 'Buscar e filtrar',
  planilha: 'Painel · anual',
}

interface FinanceSectionNavProps
{
  tabs: FinanceSubTab[]
  activeId: string
  onChange: (id: string) => void
}

export function FinanceSectionNav({ tabs, activeId, onChange }: FinanceSectionNavProps)
{
  const hint = SUB_HINTS[activeId]

  return (
    <header className="mb-3 space-y-1.5">
      <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mx-0.5">
        {tabs.map(({ id, label }) =>
        {
          const active = activeId === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={active ? AXEL_NAV_SUB_ACTIVE : AXEL_NAV_SUB_IDLE}
            >
              {label}
            </button>
          )
        })}
      </div>
      {hint && (
        <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">
          {hint}
        </p>
      )}
    </header>
  )
}
