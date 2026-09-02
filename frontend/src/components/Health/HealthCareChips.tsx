import { Droplets, Dumbbell, Beef, Pill } from 'lucide-react'
import type { CuidadosTab } from '../../lib/healthRoute'
import { visibleCareChips } from '../../lib/healthSuggestedCare'

const CHIP_META: Record<CuidadosTab, { label: string; Icon: typeof Droplets }> = {
  hidratacao: { label: 'Água', Icon: Droplets },
  alimentacao: { label: 'Comida', Icon: Beef },
  academia: { label: 'Treino', Icon: Dumbbell },
  medicamentos: { label: 'Meds', Icon: Pill },
}

interface HealthCareChipsProps
{
  active: CuidadosTab
  onSelect: (tab: CuidadosTab) => void
}

export function HealthCareChips({ active, onSelect }: HealthCareChipsProps)
{
  const chips = visibleCareChips({
    aguaHabit: true,
    medicamentosCount: 0,
    proteinaHabit: true,
    treinoHabit: true,
  })

  return (
    <nav aria-label="Outros cuidados" className="-mx-1 px-1">
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x scrollbar-none">
        {chips.map((id) =>
        {
          const { label, Icon } = CHIP_META[id]
          const ativo = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`shrink-0 snap-start inline-flex items-center gap-1.5 min-h-11 px-3 rounded-sl border text-[13px] font-medium transition-colors ${
                ativo
                  ? 'border-health/40 bg-health-muted text-ink'
                  : 'border-line text-ink-muted hover:text-ink hover:bg-chrome/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${ativo ? 'text-health' : ''}`} strokeWidth={1.75} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
