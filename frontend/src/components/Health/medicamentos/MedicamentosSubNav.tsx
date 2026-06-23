import type { LucideIcon } from 'lucide-react'

export type MedicamentosSubTab = 'hoje' | 'cadastrar' | 'gerenciar'

interface MedicamentosSubNavProps
{
  active: MedicamentosSubTab
  onSelect: (id: MedicamentosSubTab) => void
  tabs: { id: MedicamentosSubTab; label: string; short: string; Icon: LucideIcon }[]
}

/** Subabas de medicamentos — estilo da nav principal (scroll horizontal) */
export function MedicamentosSubNav({ active, onSelect, tabs }: MedicamentosSubNavProps)
{
  return (
    <nav aria-label="Seções de medicamentos" className="-mx-1">
      <div className="flex gap-1 overflow-x-auto custom-scrollbar custom-scrollbar-x pb-1">
        {tabs.map(({ id, label, short, Icon }) =>
        {
          const ativo = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-sl text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors min-h-[40px]',
                ativo
                  ? 'bg-accent-muted text-ink border border-accent/30'
                  : 'text-ink-muted border border-transparent hover:bg-chrome hover:text-ink',
              ].join(' ')}
            >
              <Icon className={`w-3.5 h-3.5 ${ativo ? 'text-teal-400' : ''}`} />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
