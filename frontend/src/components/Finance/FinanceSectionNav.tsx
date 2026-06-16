import type { FinanceSubTab } from '../../lib/financePlannerNav'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
} from '../../constants/axelSurfaces'

const SUB_HINTS: Partial<Record<string, string>> = {
  diario: 'Lançar · gráficos · extrato do dia',
  tabela: 'Buscar e filtrar tudo',
  planilha: 'Painel · Excel · anual',
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
      {hint && (
        <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">
          {hint}
        </p>
      )}
      <div className="flex gap-0.5 overflow-x-auto scrollbar-none pb-0.5">
        {tabs.map(({ id, label }) =>
        {
          const active = activeId === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`shrink-0 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase tracking-wide transition-colors ${
                active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
